import { getMetric } from "@/lib/data/catalogue";
import { canonicalObservation, runTemplate } from "@/lib/data/trusted";
import { extractClaims } from "@/lib/engine/extract";
import { countryName, formatPeriod, formatValue } from "@/lib/format";
import { getSnapshot } from "@/lib/store";
import type { SlackReply } from "@/lib/types";

export function verifySlackQuestion(question: string, thread = ""): SlackReply {
  const snapshot = getSnapshot();
  const combined = `${thread}\n${question}`;
  const extracted = extractClaims(combined, {
    conversationId: "slack_on_demand",
    startedAt: "2026-08-06T11:19:00+08:00",
  });
  const numeric = extracted.claims.filter(
    (item) => item.quotedValue != null && item.metricId,
  );
  const claim = numeric.length
    ? {
        ...numeric[0],
        ...numeric.reduce(
          (merged, item) => ({
            ...merged,
            metricId: item.metricId ?? merged.metricId,
            quotedValue: item.quotedValue ?? merged.quotedValue,
            period: item.period ?? merged.period,
            country: item.country ?? merged.country,
            segment: item.segment ?? merged.segment,
            unit: item.unit ?? merged.unit,
          }),
          numeric[0],
        ),
      }
    : extracted.claims.find((item) => item.quotedValue != null);

  if (!claim?.metricId || claim.quotedValue == null) {
    return {
      question,
      reply:
        "I can verify a number if you name the metric, period, and geography. I will not post a public correction — only a verification against the catalogue.",
      redacted: false,
    };
  }

  const metric = getMetric(claim.metricId)!;
  if (metric.sensitivityLevel === "confidential") {
    return {
      question,
      reply: `${metric.canonicalName} is classified confidential. I can confirm whether the claim is aligned without exposing the underlying value. Ask a metric owner in a restricted channel if you need the figure itself.`,
      redacted: true,
    };
  }

  const canonical = canonicalObservation(metric.id, {
    period: claim.period,
    country: claim.country,
    segment: claim.segment,
  });
  const stale = runTemplate("approval_rate_stale_dashboard", {
    period: claim.period ?? "2026-07",
  });

  const canonicalText = canonical
    ? formatValue(canonical.value, metric.unit)
    : "not available for those filters";
  const aligned =
    canonical != null &&
    Math.abs(claim.quotedValue - canonical.value) <= metric.toleranceValue;

  let body: string;
  if (aligned) {
    body = `For ${countryName(claim.country)} in ${formatPeriod(claim.period)}, the quoted ${formatValue(claim.quotedValue, metric.unit)} is aligned with canonical ${metric.canonicalName} (${canonicalText}).`;
  } else if (
    metric.id === "approval_rate" &&
    stale &&
    Math.abs(claim.quotedValue - stale.value) <= metric.toleranceValue
  ) {
    body = `For ${countryName(claim.country)} in ${formatPeriod(claim.period)}, canonical ${metric.canonicalName} is ${canonicalText} (approved / submitted). ${formatValue(claim.quotedValue, "rate")} matches the organisation-wide Credit Ops dashboard snapshot before late-arriving records, not the Malaysia book. This looks like context drift plus dashboard latency — not a reason to correct someone in public.`;
  } else {
    body = `Canonical ${metric.canonicalName} for ${formatPeriod(claim.period)} ${claim.country ? `in ${countryName(claim.country)} ` : ""}is ${canonicalText}. The quoted ${formatValue(claim.quotedValue, metric.unit)} does not reproduce from the approved template under those filters. I am not posting a correction of the speaker; a metric owner can review the finding privately.`;
  }

  const finding = snapshot.findings.find(
    (item) => item.metricId === metric.id && item.status === "unresolved",
  );

  return {
    question,
    reply: body,
    findingId: finding?.id,
    redacted: false,
  };
}

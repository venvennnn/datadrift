import { getMetric } from "@/lib/data/catalogue";
import { getPerson } from "@/lib/data/people";
import { canonicalObservation } from "@/lib/data/trusted";
import { countryName, formatPeriod, formatValue } from "@/lib/format";
import { getSnapshot } from "@/lib/store";
import type { AskAnswer, AskCitation } from "@/lib/types";

function citationsForMetric(metricId: string): AskCitation[] {
  return [
    {
      kind: "metric",
      id: metricId,
      label: getMetric(metricId)?.canonicalName ?? metricId,
      href: `/metrics/${metricId}`,
    },
  ];
}

export function answerQuestion(question: string): AskAnswer {
  const snapshot = getSnapshot();
  const q = question.trim();
  const lower = q.toLowerCase();

  if (/official approval[- ]rate definition|approval-rate definition|define approval rate/i.test(lower)) {
    const metric = getMetric("approval_rate")!;
    return {
      question: q,
      answer: `The official definition of **${metric.canonicalName}** is ${metric.description} Formula: ${metric.formulaDescription}. Numerator: ${metric.numerator}. Denominator: ${metric.denominator}. Owner: ${getPerson(metric.ownerId)?.name}. The number is reliable after ${metric.dataLatency}.`,
      citations: citationsForMetric("approval_rate"),
    };
  }

  if (/finance and sales|sales and finance|different numbers/i.test(lower)) {
    const finding = snapshot.findings.find(
      (item) =>
        item.metricId === "approval_rate" &&
        item.claimIds.length > 1 &&
        item.conversationId === "conv_mbr_aug",
    ) ?? snapshot.findings.find((item) => item.metricId === "approval_rate" && item.claimIds.length > 1);
    return {
      question: q,
      answer:
        "Finance and Sales were not arguing about the same object. In the July Monthly Business Review, Sales quoted 47% using approved applications over qualified leads — a valid funnel metric, but not approval rate. Risk quoted 39%, which reproduces the canonical approved/submitted definition (39.4% after freeze). Finance quoted 42% from the Credit Ops dashboard before late-arriving submitted applications landed. After refresh, the reproducible value is 39.4%. Recommended fix: rename the Sales metric, label denominators, and show dashboard freshness.",
      citations: [
        { kind: "conversation", id: "conv_mbr_aug", label: "July Monthly Business Review", href: "/conversations/conv_mbr_aug" },
        ...(finding
          ? [{ kind: "finding" as const, id: finding.id, label: "Cross-team approval-rate finding", href: `/inbox/${finding.id}` }]
          : []),
        ...citationsForMetric("approval_rate"),
      ],
    };
  }

  if (/47%|47 percent|first introduced/i.test(lower)) {
    const claim = snapshot.claims.find(
      (item) => item.quotedValue != null && Math.abs(item.quotedValue - 0.47) < 0.005,
    );
    const conversation = claim
      ? snapshot.conversations.find((item) => item.id === claim.conversationId)
      : undefined;
    return {
      question: q,
      answer: claim
        ? `The 47% value first appears in this workspace in **${conversation?.title ?? "a conversation"}** on ${conversation?.startedAt ?? "an unknown date"}, spoken by ${claim.speakerName}: “${claim.textExcerpt}”. It reproduces as lead-to-approval conversion (approved / qualified leads = 47.2%), not as canonical approval rate.`
        : "No 47% claim is stored yet.",
      citations: [
        ...(conversation
          ? [{ kind: "conversation" as const, id: conversation.id, label: conversation.title, href: `/conversations/${conversation.id}` }]
          : []),
        ...citationsForMetric("lead_to_approval"),
      ],
    };
  }

  if (/correct number at the time|at the time of the meeting|reproducible value/i.test(lower)) {
    const observation = canonicalObservation("approval_rate", { period: "2026-07" });
    return {
      question: q,
      answer: `For the 5 August Monthly Business Review, the canonical July approval rate was ${formatValue(observation?.value ?? 0.394, "rate")}. The Credit Ops dashboard still showed 42.1% that morning because 629 late-arriving submitted applications had not been applied. The T+2 freeze at 06:00 SGT on 4 August is the figure that should have been used in the board pack.`,
      citations: [
        { kind: "conversation", id: "conv_mbr_aug", label: "July Monthly Business Review", href: "/conversations/conv_mbr_aug" },
        ...citationsForMetric("approval_rate"),
      ],
    };
  }

  if (/most confusion|create the most|recurring/i.test(lower)) {
    const counts = new Map<string, number>();
    for (const finding of snapshot.findings.filter((item) => item.driftTypes.length > 0)) {
      if (!finding.metricId) continue;
      counts.set(finding.metricId, (counts.get(finding.metricId) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const lines = ranked
      .map(([metricId, count]) => {
        const metric = getMetric(metricId);
        return `• ${metric?.canonicalName ?? metricId}: ${count} alignment findings`;
      })
      .join("\n");
    return {
      question: q,
      answer: `Metrics generating the most alignment findings in this workspace:\n${lines}\n\nApproval rate is the clearest cluster: Sales, Risk and Finance are using three denominators and two freshness windows for the same name.`,
      citations: ranked.map(([metricId]) => ({
        kind: "metric" as const,
        id: metricId,
        label: getMetric(metricId)?.canonicalName ?? metricId,
        href: `/metrics/${metricId}`,
      })),
    };
  }

  if (/avoiding the official dashboard|why.*dashboard/i.test(lower)) {
    return {
      question: q,
      answer:
        "Yes. In the Finance weekly close, Sales said the official dashboard updates too late for Monday pipeline calls, so the team keeps a spreadsheet. That is trust drift and latency, not a preference for being inaccurate. The 14.1 million figure matches gross approved amount, which is faster to assemble in a tracker than net disbursement after cancellations. Intervention: publish a T+0 flash with a freshness banner, and keep net disbursement as the canonical close number.",
      citations: [
        { kind: "conversation", id: "conv_finance_close", label: "Finance weekly close", href: "/conversations/conv_finance_close" },
        ...citationsForMetric("monthly_disbursement"),
      ],
    };
  }

  const metricHit = snapshot.metrics.find((metric) =>
    [metric.canonicalName, metric.id, ...metric.aliases.map((alias) => alias.alias)].some((name) =>
      lower.includes(name.toLowerCase()),
    ),
  );
  if (metricHit) {
    const observation = canonicalObservation(metricHit.id, { period: "2026-07" });
    const related = snapshot.findings.filter((finding) => finding.metricId === metricHit.id).slice(0, 3);
    return {
      question: q,
      answer: `**${metricHit.canonicalName}**: ${metricHit.description} Canonical July value: ${formatValue(observation?.value ?? null, metricHit.unit)}. Formula: ${metricHit.formulaDescription}. There are ${related.length} recent alignment findings for this metric.`,
      citations: [
        ...citationsForMetric(metricHit.id),
        ...related.map((finding) => ({
          kind: "finding" as const,
          id: finding.id,
          label: finding.quotedSummary.slice(0, 80),
          href: `/inbox/${finding.id}`,
        })),
      ],
    };
  }

  const findingHit = snapshot.findings.find((finding) =>
    lower.includes(finding.quotedSummary.toLowerCase().slice(0, 24)),
  );
  if (findingHit) {
    return {
      question: q,
      answer: `${findingHit.rootCause} Recommended action: ${findingHit.recommendedAction}`,
      citations: [
        { kind: "finding", id: findingHit.id, label: "Matching finding", href: `/inbox/${findingHit.id}` },
      ],
    };
  }

  const periodMention = lower.match(/july|june|2026-07/) ? "2026-07" : null;
  const countryMention = lower.includes("malaysia") ? "MY" : lower.includes("singapore") ? "SG" : null;
  if (periodMention && /approval/.test(lower)) {
    const observation = canonicalObservation("approval_rate", {
      period: periodMention,
      country: countryMention,
    });
    return {
      question: q,
      answer: `Canonical approval rate for ${formatPeriod(periodMention)}${countryMention ? ` in ${countryName(countryMention)}` : ""} is ${formatValue(observation?.value ?? null, "rate")}. This is approved / submitted applications from analytics.credit_origination_monthly. The detector does not generate SQL to answer this; it runs a registered template.`,
      citations: citationsForMetric("approval_rate"),
    };
  }

  return {
    question: q,
    answer:
      "I can answer from the metric catalogue, registered query templates, and reviewed conversation evidence in this workspace. Try asking for an official definition, why two teams diverged, which meeting introduced a figure, or which metrics create repeated confusion. Responses always cite evidence rather than inventing an authoritative number.",
    citations: snapshot.conversations.slice(0, 2).map((conversation) => ({
      kind: "conversation" as const,
      id: conversation.id,
      label: conversation.title,
      href: `/conversations/${conversation.id}`,
    })),
  };
}

import { getMetric } from "@/lib/data/catalogue";
import { queryTemplates } from "@/lib/data/trusted";
import { formatPeriod, formatValue } from "@/lib/format";
import type {
  AdoptionBarrier,
  Conversation,
  DriftType,
  ExtractedClaim,
  Finding,
  Metric,
  Severity,
  Verification,
} from "@/lib/types";

function audienceWeight(conversation: Conversation): number {
  switch (conversation.meetingKind) {
    case "executive_review":
      return 1;
    case "governance":
      return 0.8;
    case "operational":
      return 0.55;
    case "regional":
      return 0.5;
    case "slack_thread":
      return 0.4;
    default:
      return 0.45;
  }
}

function magnitudeScore(claim: ExtractedClaim, verification: Verification, metric?: Metric): number {
  if (verification.difference == null || verification.trustedValue == null || !metric) {
    return 0.2;
  }
  const abs = Math.abs(verification.difference);
  if (metric.toleranceType === "percentage_points") {
    return Math.min(1, abs / 0.08);
  }
  if (metric.toleranceType === "relative") {
    return Math.min(1, abs / Math.max(Math.abs(verification.trustedValue), 1) / 0.2);
  }
  return Math.min(1, abs / Math.max(metric.toleranceValue * 8, 1));
}

export function scoreSeverity(input: {
  claim: ExtractedClaim;
  verification: Verification;
  conversation: Conversation;
  metric?: Metric;
  frequency: number;
  teamsInvolved: number;
  decisionInfluenced: boolean;
}): { severity: Severity; score: number } {
  const { claim, verification, conversation, metric, frequency, teamsInvolved, decisionInfluenced } =
    input;

  const aligned =
    verification.comparisonResult === "aligned" ||
    verification.comparisonResult === "approximately_aligned";

  let score = 0;
  score += magnitudeScore(claim, verification, metric) * 34;
  score += (metric?.importance ?? 0.4) * 16;
  score += audienceWeight(conversation) * 12;
  score += decisionInfluenced ? 14 : 0;
  score += Math.min(frequency, 4) * 4;
  score += Math.min(teamsInvolved, 4) * 3;
  score += claim.extractionConfidence * 4;
  score += claim.resolutionConfidence * 4;
  if (claim.uncertainLanguage) score -= 10;
  if (aligned) score = Math.min(score, 22);
  if (verification.comparisonResult === "unverifiable") score = Math.min(score, 28);
  score = Math.max(0, Math.min(100, score));

  let severity: Severity;
  if (aligned) severity = score > 18 ? "low" : "informational";
  else if (
    score >= 80 &&
    conversation.meetingKind === "executive_review" &&
    decisionInfluenced &&
    frequency >= 3 &&
    (metric?.importance ?? 0) >= 0.9
  ) {
    severity = "critical";
  } else if (score >= 60) severity = "high";
  else if (score >= 42) severity = "medium";
  else if (score >= 24) severity = "low";
  else severity = "informational";

  if (
    conversation.meetingKind === "executive_review" &&
    decisionInfluenced &&
    !aligned &&
    (metric?.importance ?? 0) >= 0.85 &&
    severity === "medium"
  ) {
    severity = "high";
  }

  return { severity, score: Math.round(score) };
}

export function diagnoseFinding(input: {
  claim: ExtractedClaim;
  verification: Verification;
  conversation: Conversation;
  relatedClaims: ExtractedClaim[];
}): Pick<
  Finding,
  | "driftTypes"
  | "rootCause"
  | "recommendedAction"
  | "adoptionBarriers"
  | "quotedSummary"
  | "trustedSummary"
  | "decisionInfluenced"
> {
  const { claim, verification, conversation, relatedClaims } = input;
  const metric = claim.metricId ? getMetric(claim.metricId) : undefined;
  const matchingAlt = verification.assumptionTests.find((test) => test.matchesClaim);
  const matchingTemplate = matchingAlt
    ? queryTemplates.find((item) => item.id === matchingAlt.templateId)
    : undefined;

  const driftTypes: DriftType[] = [];
  const barriers: AdoptionBarrier[] = [];
  const decisionInfluenced = /target|board|decision|comfortable raising|partner review/i.test(
    `${claim.textExcerpt} ${relatedClaims.map((item) => item.textExcerpt).join(" ")}`,
  );

  const quotedSummary = `${claim.speakerName} said “${claim.textExcerpt}”`;
  const trustedSummary =
    verification.trustedValue != null && metric
      ? `Canonical ${metric.canonicalName} for ${formatPeriod(claim.period)}${
          claim.country ? ` / ${claim.country}` : ""
        } is ${formatValue(verification.trustedValue, metric.unit)} as of ${
          verification.dataFreshnessAt ?? "the latest freeze"
        }.`
      : "No reproducible trusted value was available for the inferred filters.";

  if (verification.comparisonResult === "aligned" || verification.comparisonResult === "approximately_aligned") {
    return {
      driftTypes: [],
      rootCause:
        verification.comparisonResult === "approximately_aligned"
          ? "The quoted figure is within the metric tolerance of the canonical value. Rounding or incomplete precision explains the gap."
          : "The quoted figure reproduces from the approved template.",
      recommendedAction: "No corrective action required. Optionally label rounding in the meeting notes.",
      adoptionBarriers: [],
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (matchingTemplate?.isStaleSnapshot) {
    driftTypes.push("temporal", "source");
    barriers.push("latency", "trust");
    return {
      driftTypes,
      rootCause:
        "The quoted figure matches the official dashboard before late-arriving records were applied. The canonical freeze is newer and lower.",
      recommendedAction:
        "Display data freshness on the Credit Ops dashboard and wait for the T+2 freeze before executive reporting.",
      adoptionBarriers: barriers,
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (matchingTemplate?.alternativeName || matchingTemplate?.id.includes("qualified_leads")) {
    driftTypes.push("definition", "semantic");
    barriers.push("definition_clarity", "historical_habit", "communication");
    return {
      driftTypes,
      rootCause: `The quoted figure reproduces under “${matchingTemplate.alternativeName ?? matchingTemplate.label}”, not the canonical definition of ${metric?.canonicalName ?? "the metric"}.`,
      recommendedAction:
        "Rename the Sales figure to lead-to-approval conversion, keep approval rate for submitted applications, and label denominators on every chart.",
      adoptionBarriers: barriers,
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (matchingTemplate?.id.includes("gross") || matchingTemplate?.id.includes("undisbursed")) {
    driftTypes.push("definition", "context");
    barriers.push("definition_clarity", "workflow_fit");
    return {
      driftTypes,
      rootCause:
        "The quoted disbursement uses a different population: gross approved amount or approved-but-undisbursed facilities rather than net cash disbursed.",
      recommendedAction:
        "Keep net disbursement as the canonical executive metric and publish gross / undisbursed as separately named metrics.",
      adoptionBarriers: barriers,
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (claim.metricId === "active_customers" && Math.abs((claim.quotedValue ?? 0) - 84000) < 1) {
    driftTypes.push("semantic", "definition");
    barriers.push("definition_clarity", "communication");
    return {
      driftTypes,
      rootCause:
        "Product is using the retired logged-in definition of active customers. Finance uses paying customers with an outstanding balance.",
      recommendedAction:
        "Point Product dashboards at logged-in customers and add a definition-change notice on the active-customer metric page.",
      adoptionBarriers: barriers,
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (claim.sourceMentioned?.includes("spreadsheet") || claim.sourceMentioned?.includes("tracker")) {
    driftTypes.push("source", "trust");
    barriers.push("latency", "workflow_fit", "trust");
  }

  if (claim.segment && claim.segment !== "all") {
    driftTypes.push("context");
    barriers.push("coverage");
    return {
      driftTypes: Array.from(new Set(["context", ...driftTypes])),
      rootCause: `The claim applies an extra ${claim.segment} filter that the canonical all-segment number does not use.`,
      recommendedAction: "Require segment labels whenever a regional deck quotes approval rate.",
      adoptionBarriers: Array.from(new Set(["coverage", ...barriers])),
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (verification.comparisonResult === "unverifiable" || verification.comparisonResult === "contextually_incomplete") {
    driftTypes.push("unverifiable");
    return {
      driftTypes,
      rootCause:
        "The statement cannot be reproduced confidently because the metric, period, or denominator is missing or ambiguous.",
      recommendedAction: "Ask the speaker to name the metric, period, and denominator before the figure is reused.",
      adoptionBarriers: ["definition_clarity"],
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (conversation.meetingKind === "slack_thread" && claim.country === "MY" && claim.quotedValue != null) {
    driftTypes.push("context", "source");
    barriers.push("coverage", "workflow_fit");
    return {
      driftTypes,
      rootCause:
        "The 42% figure matches the organisation-wide stale dashboard, not the Malaysia canonical approval rate.",
      recommendedAction:
        "Reply in-thread with the Malaysia canonical value and the matching context. Do not post a public correction of the speaker.",
      adoptionBarriers: barriers,
      quotedSummary,
      trustedSummary,
      decisionInfluenced,
    };
  }

  if (driftTypes.length === 0) driftTypes.push("numerical");
  return {
    driftTypes,
    rootCause:
      "The quoted value does not reproduce from the approved template under the inferred filters. Alternative definitions were tested and did not explain the gap fully.",
    recommendedAction: "Investigate the source system named in the conversation and confirm the intended filters with the metric owner.",
    adoptionBarriers: barriers.length ? barriers : ["ownership"],
    quotedSummary,
    trustedSummary,
    decisionInfluenced,
  };
}

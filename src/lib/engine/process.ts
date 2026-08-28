import { getMetric } from "@/lib/data/catalogue";
import { compareClaim } from "@/lib/engine/compare";
import { diagnoseFinding, scoreSeverity } from "@/lib/engine/diagnose";
import { extractClaims } from "@/lib/engine/extract";
import type {
  Conversation,
  ExtractedClaim,
  Finding,
  Verification,
} from "@/lib/types";

export interface ProcessResult {
  conversation: Conversation;
  claims: ExtractedClaim[];
  verifications: Verification[];
  findings: Finding[];
}

function decisionLanguage(conversation: Conversation, claims: ExtractedClaim[]): boolean {
  const blob = `${conversation.title} ${claims.map((claim) => claim.textExcerpt).join(" ")}`;
  return /target|board pack|board|decision|comfortable raising|partner review/i.test(blob);
}

function frequencyForMetric(metricId: string | null, allClaims: ExtractedClaim[]): number {
  if (!metricId) return 1;
  return allClaims.filter((claim) => claim.metricId === metricId && claim.quotedValue != null).length;
}

export function processConversation(
  conversation: Conversation,
  extraClaims: ExtractedClaim[] = [],
  verifiedAt = "2026-08-06T12:00:00.000Z",
): ProcessResult {
  const extracted = extractClaims(conversation.transcript, {
    conversationId: conversation.id,
    startedAt: conversation.startedAt,
  });
  const claims = extracted.claims;
  const verifications = claims
    .filter((claim) => claim.quotedValue != null || claim.kind === "definition")
    .map((claim) => compareClaim(claim, verifiedAt));

  const findings: Finding[] = [];
  const decisionInfluenced = decisionLanguage(conversation, claims);
  const allClaims = [...extraClaims, ...claims];

  for (const claim of claims) {
    if (claim.quotedValue == null && claim.kind === "definition") continue;
    if (claim.quotedValue == null) continue;
    const verification = verifications.find((item) => item.claimId === claim.id);
    if (!verification) continue;

    const metric = claim.metricId ? getMetric(claim.metricId) : undefined;
    const related = claims.filter(
      (item) => item.metricId === claim.metricId && item.id !== claim.id,
    );
    const diagnosis = diagnoseFinding({
      claim,
      verification,
      conversation,
      relatedClaims: related,
    });
    const teams = Array.from(
      new Set([claim.team, ...related.map((item) => item.team)].filter(Boolean) as string[]),
    );
    const { severity, score } = scoreSeverity({
      claim,
      verification,
      conversation,
      metric,
      frequency: frequencyForMetric(claim.metricId, allClaims),
      teamsInvolved: teams.length,
      decisionInfluenced: diagnosis.decisionInfluenced || decisionInfluenced,
    });

    const aligned =
      verification.comparisonResult === "aligned" ||
      verification.comparisonResult === "approximately_aligned";

    findings.push({
      id: `find_${claim.id}`,
      verificationId: verification.id,
      conversationId: conversation.id,
      claimIds: [claim.id],
      metricId: claim.metricId,
      driftTypes: diagnosis.driftTypes,
      severity: aligned ? (severity === "informational" ? "informational" : "low") : severity,
      severityScore: score,
      rootCause: diagnosis.rootCause,
      status: aligned ? "resolved" : "unresolved",
      ownerId: metric?.ownerId ?? "arjun",
      recommendedAction: diagnosis.recommendedAction,
      adoptionBarriers: diagnosis.adoptionBarriers,
      decisionInfluenced: diagnosis.decisionInfluenced || decisionInfluenced,
      teamsInvolved: teams,
      quotedSummary: diagnosis.quotedSummary,
      trustedSummary: diagnosis.trustedSummary,
      createdAt: verifiedAt,
    });
  }

  const numericByMetric = new Map<string, ExtractedClaim[]>();
  for (const claim of claims) {
    if (!claim.metricId || claim.quotedValue == null) continue;
    const list = numericByMetric.get(claim.metricId) ?? [];
    list.push(claim);
    numericByMetric.set(claim.metricId, list);
  }

  for (const [metricId, group] of numericByMetric) {
    const uniqueValues = Array.from(
      new Set(group.map((claim) => Number(claim.quotedValue?.toPrecision(4)))),
    );
    if (uniqueValues.length < 2) continue;
    const metric = getMetric(metricId);
    const teams = Array.from(new Set(group.map((claim) => claim.team).filter(Boolean) as string[]));
    const childFindings = findings.filter((finding) => finding.metricId === metricId);
    const alreadyCovered = childFindings.some((finding) => finding.claimIds.length > 1);
    if (alreadyCovered) continue;

    findings.push({
      id: `find_${conversation.id}_${metricId}_cluster`,
      verificationId: childFindings[0]?.verificationId ?? null,
      conversationId: conversation.id,
      claimIds: group.map((claim) => claim.id),
      metricId,
      driftTypes: Array.from(new Set(childFindings.flatMap((finding) => finding.driftTypes))),
      severity: childFindings.some((finding) => finding.severity === "critical")
        ? "critical"
        : childFindings.some((finding) => finding.severity === "high")
          ? "high"
          : "medium",
      severityScore: Math.max(...childFindings.map((finding) => finding.severityScore), 55),
      rootCause: `${teams.join(" and ") || "Multiple teams"} quoted different values for ${
        metric?.canonicalName ?? metricId
      } in the same conversation. This is an alignment issue across definitions, freshness, and sources — not a ranking of speakers.`,
      status: "unresolved",
      ownerId: metric?.ownerId ?? "arjun",
      recommendedAction:
        childFindings.find((finding) => finding.recommendedAction)?.recommendedAction ??
        "Reconcile the named definitions and show freshness before the next decision forum.",
      adoptionBarriers: Array.from(
        new Set(childFindings.flatMap((finding) => finding.adoptionBarriers)),
      ),
      decisionInfluenced: decisionInfluenced,
      teamsInvolved: teams,
      quotedSummary: group
        .map(
          (claim) =>
            `${claim.team ?? claim.speakerName}: ${claim.quotedValue}`,
        )
        .join(" · "),
      trustedSummary:
        childFindings.find((finding) => finding.trustedSummary)?.trustedSummary ?? "",
      createdAt: verifiedAt,
    });
  }

  return {
    conversation: {
      ...conversation,
      processingStatus: "processed",
      processedAt: verifiedAt,
    },
    claims,
    verifications,
    findings,
  };
}

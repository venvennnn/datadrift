import { conversationSeeds, monthlyReviewTranscript } from "../data/transcripts";
import { processConversation } from "./process";
import { verifySlackQuestion } from "./slack";
import type { Conversation } from "../types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const seed = conversationSeeds.find((item) => item.id === "conv_mbr_aug")!;
const conversation: Conversation = { ...seed, processingStatus: "pending" };
const result = processConversation(conversation);

const numeric = result.claims.filter((claim) => claim.quotedValue != null);
const approvalClaims = numeric.filter((claim) => claim.metricId === "approval_rate");

const values = approvalClaims.map((claim) => Number((claim.quotedValue ?? 0).toFixed(3)));
console.log("Approval claims:", approvalClaims.map((claim) => ({
  speaker: claim.speakerName,
  value: claim.quotedValue,
  country: claim.country,
  period: claim.period,
  source: claim.sourceMentioned,
  kind: claim.kind,
})));
console.log("All numeric claims:", numeric.map((claim) => ({
  metric: claim.metricId,
  speaker: claim.speakerName,
  value: claim.quotedValue,
  excerpt: claim.textExcerpt.slice(0, 80),
})));
console.log("Findings:", result.findings.map((finding) => ({
  id: finding.id,
  metric: finding.metricId,
  severity: finding.severity,
  types: finding.driftTypes,
  result: result.verifications.find((item) => item.id === finding.verificationId)?.comparisonResult,
  status: finding.status,
})));

assert(monthlyReviewTranscript.includes("47%"), "demo transcript missing 47%");
assert(values.some((value) => Math.abs(value - 0.47) < 0.005), "did not extract 47% approval rate");
assert(values.some((value) => Math.abs(value - 0.39) < 0.005), "did not extract 39% approval rate");
assert(values.some((value) => Math.abs(value - 0.42) < 0.005), "did not extract 42% approval rate");

const sales = approvalClaims.find((claim) => Math.abs((claim.quotedValue ?? 0) - 0.47) < 0.005)!;
const risk = approvalClaims.find((claim) => Math.abs((claim.quotedValue ?? 0) - 0.39) < 0.005)!;
const finance = approvalClaims.find((claim) => Math.abs((claim.quotedValue ?? 0) - 0.42) < 0.005)!;

const salesVer = result.verifications.find((item) => item.claimId === sales.id)!;
const riskVer = result.verifications.find((item) => item.claimId === risk.id)!;
const financeVer = result.verifications.find((item) => item.claimId === finance.id)!;

console.log("Sales comparison", salesVer.comparisonResult, salesVer.assumptionTests.filter((t) => t.matchesClaim).map((t) => t.label));
console.log("Risk comparison", riskVer.comparisonResult, riskVer.trustedValue);
console.log("Finance comparison", financeVer.comparisonResult, financeVer.assumptionTests.filter((t) => t.matchesClaim).map((t) => t.label));

assert(
  salesVer.comparisonResult === "valid_alternative" ||
    salesVer.comparisonResult === "definitionally_inconsistent",
  `sales should be alternative/definitional, got ${salesVer.comparisonResult}`,
);
assert(
  riskVer.comparisonResult === "approximately_aligned" || riskVer.comparisonResult === "aligned",
  `risk should be aligned, got ${riskVer.comparisonResult}`,
);
assert(
  financeVer.comparisonResult === "outdated",
  `finance should be outdated/stale dashboard, got ${financeVer.comparisonResult}`,
);

const cluster = result.findings.find((finding) => finding.claimIds.length > 1 && finding.metricId === "approval_rate");
assert(cluster, "expected a cross-team approval-rate finding");
assert(cluster.driftTypes.includes("definition") || cluster.driftTypes.includes("temporal"), "cluster should mention definition or temporal drift");

const slack = verifySlackQuestion(
  "@DataDrift Is the 42% approval rate mentioned above correct for Malaysia in July?",
  "Priya Shah: Malaysia's approval rate is 42% based on the weekly tracker.",
);
assert(slack.reply.includes("July 2026"), `slack reply missing July: ${slack.reply}`);
assert(slack.reply.includes("38.1%"), `slack reply missing Malaysia canonical: ${slack.reply}`);
assert(/not a reason to correct someone in public/i.test(slack.reply), "slack reply should avoid public correction");

console.log("Scenario verification passed.");

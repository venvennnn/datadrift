export type DriftType =
  | "numerical"
  | "definition"
  | "context"
  | "temporal"
  | "source"
  | "semantic"
  | "trust"
  | "documentation"
  | "unverifiable";

export type ComparisonResult =
  | "aligned"
  | "approximately_aligned"
  | "outdated"
  | "contextually_incomplete"
  | "definitionally_inconsistent"
  | "numerically_inconsistent"
  | "valid_alternative"
  | "unverifiable";

export type FindingStatus =
  | "unresolved"
  | "confirmed_drift"
  | "valid_alternative_context"
  | "database_issue"
  | "definition_issue"
  | "documentation_issue"
  | "false_positive"
  | "needs_investigation"
  | "resolved";

export type Severity = "informational" | "low" | "medium" | "high" | "critical";

export type AdoptionBarrier =
  | "discoverability"
  | "accessibility"
  | "usability"
  | "latency"
  | "trust"
  | "definition_clarity"
  | "workflow_fit"
  | "coverage"
  | "ownership"
  | "historical_habit"
  | "communication";

export type SourceType = "meet" | "slack" | "upload" | "transcript";

export type ClaimKind =
  | "explicit"
  | "contextual"
  | "definition"
  | "source"
  | "confidence";

export type ToleranceType = "absolute" | "relative" | "percentage_points";

export type MetricUnit = "rate" | "currency" | "count" | "days" | "ratio";

export type MeetingKind =
  | "executive_review"
  | "operational"
  | "governance"
  | "regional"
  | "slack_thread";

export interface Person {
  id: string;
  name: string;
  team: string;
  role: string;
  title: string;
}

export interface MetricAlias {
  alias: string;
  team?: string;
  country?: string;
  confidence: number;
  approved: boolean;
}

export interface MetricDimension {
  key: string;
  label: string;
  values: string[];
}

export interface Metric {
  id: string;
  canonicalName: string;
  description: string;
  formulaDescription: string;
  numerator?: string;
  denominator?: string;
  sourceView: string;
  ownerId: string;
  refreshCadence: string;
  dataLatency: string;
  toleranceType: ToleranceType;
  toleranceValue: number;
  sensitivityLevel: "internal" | "restricted" | "confidential";
  unit: MetricUnit;
  currency?: string;
  importance: number;
  active: boolean;
  aliases: MetricAlias[];
  dimensions: MetricDimension[];
  validFrom: string;
}

export interface MetricVersion {
  id: string;
  metricId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  definition: string;
  numeratorDefinition?: string;
  denominatorDefinition?: string;
  queryTemplateId: string;
  changeReason: string;
  approvedBy: string;
}

export interface QueryTemplate {
  id: string;
  metricId: string;
  label: string;
  sqlPreview: string;
  isCanonical: boolean;
  isStaleSnapshot?: boolean;
  alternativeName?: string;
  notes: string;
}

export interface TrustedObservation {
  templateId: string;
  metricId: string;
  period: string;
  country: string | null;
  segment: string | null;
  product: string | null;
  value: number;
  numerator?: number;
  denominator?: number;
  asOf: string;
  dataFreshnessAt: string;
  notes?: string;
}

export interface ConversationSeed {
  id: string;
  sourceType: SourceType;
  externalSourceId: string;
  title: string;
  startedAt: string;
  participantIds: string[];
  accessPolicy: string;
  meetingKind: MeetingKind;
  authorised: boolean;
  notified: boolean;
  channel?: string;
  transcript: string;
}

export interface ParsedTurn {
  index: number;
  timestamp?: string;
  speakerId: string | null;
  speakerName: string;
  team?: string;
  text: string;
}

export interface ExtractedClaim {
  id: string;
  conversationId: string;
  turnIndex: number;
  speakerId: string | null;
  speakerName: string;
  team?: string;
  textExcerpt: string;
  kind: ClaimKind;
  metricId: string | null;
  metricPhrase: string | null;
  quotedValue: number | null;
  unit: MetricUnit | null;
  currency: string | null;
  period: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  country: string | null;
  segment: string | null;
  product: string | null;
  direction: "increased" | "decreased" | "unchanged" | null;
  sourceMentioned: string | null;
  definitionText: string | null;
  uncertainLanguage: boolean;
  extractionConfidence: number;
  resolutionConfidence: number;
  assumptions: string[];
}

export interface AssumptionTest {
  templateId: string;
  label: string;
  value: number | null;
  matchesClaim: boolean;
  notes: string;
}

export interface Verification {
  id: string;
  claimId: string;
  trustedValue: number | null;
  difference: number | null;
  comparisonResult: ComparisonResult;
  definitionVersionId: string | null;
  queryTemplateId: string | null;
  queryParameters: Record<string, string | null>;
  dataFreshnessAt: string | null;
  verifiedAt: string;
  assumptionTests: AssumptionTest[];
}

export interface Finding {
  id: string;
  verificationId: string | null;
  conversationId: string;
  claimIds: string[];
  metricId: string | null;
  driftTypes: DriftType[];
  severity: Severity;
  severityScore: number;
  rootCause: string;
  status: FindingStatus;
  ownerId: string | null;
  recommendedAction: string;
  adoptionBarriers: AdoptionBarrier[];
  decisionInfluenced: boolean;
  teamsInvolved: string[];
  quotedSummary: string;
  trustedSummary: string;
  createdAt: string;
}

export interface Resolution {
  id: string;
  findingId: string;
  resolutionType: FindingStatus;
  reviewerId: string;
  comment: string;
  evidenceUrl?: string;
  resolvedAt: string;
}

export interface Conversation {
  id: string;
  sourceType: SourceType;
  externalSourceId: string;
  title: string;
  startedAt: string;
  participantIds: string[];
  accessPolicy: string;
  meetingKind: MeetingKind;
  authorised: boolean;
  notified: boolean;
  channel?: string;
  transcript: string;
  processingStatus: "pending" | "processed" | "failed";
  processedAt?: string;
}

export interface AskCitation {
  kind: "metric" | "finding" | "conversation" | "verification";
  id: string;
  label: string;
  href: string;
}

export interface AskAnswer {
  question: string;
  answer: string;
  citations: AskCitation[];
}

export interface SlackReply {
  question: string;
  reply: string;
  findingId?: string;
  redacted: boolean;
}

export interface AppSnapshot {
  people: Person[];
  metrics: Metric[];
  metricVersions: MetricVersion[];
  queryTemplates: QueryTemplate[];
  conversations: Conversation[];
  claims: ExtractedClaim[];
  verifications: Verification[];
  findings: Finding[];
  resolutions: Resolution[];
}

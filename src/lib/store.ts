import { metrics, metricVersions } from "@/lib/data/catalogue";
import { people } from "@/lib/data/people";
import { queryTemplates } from "@/lib/data/trusted";
import { conversationSeeds } from "@/lib/data/transcripts";
import { processConversation } from "@/lib/engine/process";
import type {
  AppSnapshot,
  Conversation,
  ExtractedClaim,
  Finding,
  FindingStatus,
  Resolution,
  Verification,
} from "@/lib/types";

export const SEED_VERIFIED_AT = "2026-08-06T12:00:00.000Z";

interface MemoryStore {
  conversations: Conversation[];
  claims: ExtractedClaim[];
  verifications: Verification[];
  findings: Finding[];
  resolutions: Resolution[];
  seeded: boolean;
}

const globalForStore = globalThis as typeof globalThis & {
  __dataDriftStore?: MemoryStore;
};

const listeners = new Set<() => void>();
let cachedSnapshot: AppSnapshot | null = null;

function emptyStore(): MemoryStore {
  return {
    conversations: [],
    claims: [],
    verifications: [],
    findings: [],
    resolutions: [],
    seeded: false,
  };
}

function getMemory(): MemoryStore {
  if (!globalForStore.__dataDriftStore) {
    globalForStore.__dataDriftStore = emptyStore();
  }
  return globalForStore.__dataDriftStore;
}

function notify() {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seedIfNeeded() {
  const memory = getMemory();
  if (memory.seeded) return;
  for (const seed of conversationSeeds) {
    const conversation: Conversation = {
      ...seed,
      processingStatus: "pending",
    };
    ingestProcessed(
      processConversation(conversation, memory.claims, SEED_VERIFIED_AT),
      false,
    );
  }
  memory.seeded = true;
}

function ingestProcessed(
  result: ReturnType<typeof processConversation>,
  shouldNotify = true,
) {
  const memory = getMemory();
  memory.conversations = [
    result.conversation,
    ...memory.conversations.filter((item) => item.id !== result.conversation.id),
  ];
  memory.claims = [
    ...memory.claims.filter((item) => item.conversationId !== result.conversation.id),
    ...result.claims,
  ];
  memory.verifications = [
    ...memory.verifications.filter(
      (item) => !result.claims.some((claim) => claim.id === item.claimId),
    ),
    ...result.verifications,
  ];
  memory.findings = [
    ...memory.findings.filter((item) => item.conversationId !== result.conversation.id),
    ...result.findings,
  ];
  if (shouldNotify) notify();
}

function buildSnapshot(): AppSnapshot {
  const memory = getMemory();
  return {
    people,
    metrics,
    metricVersions,
    queryTemplates,
    conversations: [...memory.conversations].sort(
      (a, b) => +new Date(b.startedAt) - +new Date(a.startedAt),
    ),
    claims: memory.claims,
    verifications: memory.verifications,
    findings: [...memory.findings].sort((a, b) => b.severityScore - a.severityScore),
    resolutions: memory.resolutions,
  };
}

export function getSnapshot(): AppSnapshot {
  seedIfNeeded();
  cachedSnapshot ??= buildSnapshot();
  return cachedSnapshot;
}

export function getFinding(id: string): Finding | undefined {
  return getSnapshot().findings.find((finding) => finding.id === id);
}

export function getConversation(id: string): Conversation | undefined {
  return getSnapshot().conversations.find((conversation) => conversation.id === id);
}

export function processUploadedTranscript(input: {
  title: string;
  transcript: string;
  startedAt?: string;
  sourceType?: Conversation["sourceType"];
}): Conversation {
  seedIfNeeded();
  const id = `conv_upload_${Date.now()}`;
  const conversation: Conversation = {
    id,
    sourceType: input.sourceType ?? "upload",
    externalSourceId: `upload://${id}.txt`,
    title: input.title || "Uploaded transcript",
    startedAt: input.startedAt ?? new Date().toISOString(),
    participantIds: [],
    accessPolicy: "uploader-and-attendees",
    meetingKind: "operational",
    authorised: true,
    notified: true,
    transcript: input.transcript,
    processingStatus: "pending",
  };
  ingestProcessed(processConversation(conversation, getMemory().claims));
  return getConversation(id)!;
}

export function resolveFinding(input: {
  findingId: string;
  resolutionType: FindingStatus;
  reviewerId?: string;
  comment: string;
  evidenceUrl?: string;
}): Resolution {
  seedIfNeeded();
  const memory = getMemory();
  const finding = memory.findings.find((item) => item.id === input.findingId);
  if (!finding) {
    throw new Error("Finding not found");
  }
  const resolution: Resolution = {
    id: `res_${Date.now()}`,
    findingId: input.findingId,
    resolutionType: input.resolutionType,
    reviewerId: input.reviewerId ?? "noura",
    comment: input.comment,
    evidenceUrl: input.evidenceUrl,
    resolvedAt: new Date().toISOString(),
  };
  finding.status = input.resolutionType;
  memory.resolutions.unshift(resolution);
  notify();
  return resolution;
}

export function resetStore() {
  globalForStore.__dataDriftStore = emptyStore();
  cachedSnapshot = null;
  seedIfNeeded();
  notify();
}

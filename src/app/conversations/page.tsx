import Link from "next/link";
import { formatDate, sourceLabel } from "@/lib/format";
import { getSnapshot } from "@/lib/store";

export default function ConversationsPage() {
  const snapshot = getSnapshot();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-signal">Sources</p>
          <h1 className="serif mt-3 text-4xl text-cream">Conversations</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Authorised meetings, Slack threads, and uploaded transcripts. Participants are shown because this content is subject to analysis.
          </p>
        </div>
        <Link
          href="/conversations/upload"
          className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink"
        >
          Upload transcript
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {snapshot.conversations.map((conversation) => {
          const findings = snapshot.findings.filter((finding) => finding.conversationId === conversation.id);
          const unresolved = findings.filter((finding) => finding.status === "unresolved").length;
          const claims = snapshot.claims.filter((claim) => claim.conversationId === conversation.id);
          return (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="panel block p-6 hover:border-signal/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted">
                    {sourceLabel[conversation.sourceType]}
                    {conversation.channel ? ` · ${conversation.channel}` : ""}
                  </div>
                  <h2 className="serif mt-2 text-2xl text-cream">{conversation.title}</h2>
                </div>
                <div className="text-xs text-muted">{formatDate(conversation.startedAt)}</div>
              </div>
              <p className="mt-3 text-sm text-muted">
                {claims.filter((claim) => claim.quotedValue != null).length} claims checked · {unresolved} unresolved alignment issues · access: {conversation.accessPolicy}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

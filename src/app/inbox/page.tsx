import { InboxClient } from "@/components/InboxClient";
import { getSnapshot } from "@/lib/store";

export default function InboxPage() {
  const snapshot = getSnapshot();
  const unresolved = snapshot.findings.filter((finding) => finding.status === "unresolved").length;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs uppercase tracking-[0.22em] text-signal">Queue</p>
      <h1 className="serif mt-3 text-4xl text-cream">Alignment Inbox</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Unresolved findings across authorised meetings and Slack threads. Language is about systems, definitions and sources — not a scoreboard of employees. {unresolved} currently waiting on a metric owner.
      </p>
      <div className="mt-8">
        <InboxClient snapshot={snapshot} />
      </div>
    </div>
  );
}

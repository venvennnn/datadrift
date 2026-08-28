import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparisonBadge, DriftBadge, SeverityBadge } from "@/components/Badges";
import { getMetric } from "@/lib/data/catalogue";
import { getPerson } from "@/lib/data/people";
import { parseTurns } from "@/lib/engine/extract";
import { formatDateTime, formatValue, sourceLabel } from "@/lib/format";
import { getSnapshot } from "@/lib/store";

export default async function ConversationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = getSnapshot();
  const conversation = snapshot.conversations.find((item) => item.id === id);
  if (!conversation) notFound();

  const claims = snapshot.claims.filter((claim) => claim.conversationId === id);
  const numeric = claims.filter((claim) => claim.quotedValue != null);
  const findings = snapshot.findings.filter((finding) => finding.conversationId === id);
  const unresolved = findings.filter((finding) => finding.status === "unresolved");
  const verifications = snapshot.verifications.filter((item) =>
    claims.some((claim) => claim.id === item.claimId),
  );
  const aligned = verifications.filter(
    (item) => item.comparisonResult === "aligned" || item.comparisonResult === "approximately_aligned",
  );
  const turns = parseTurns(conversation.transcript);
  const decisionFindings = findings.filter((finding) => finding.decisionInfluenced);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/conversations" className="text-xs uppercase tracking-[0.18em] text-signal">
        ← Conversations
      </Link>
      <div className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
        {sourceLabel[conversation.sourceType]} · {conversation.accessPolicy} · notified: {conversation.notified ? "yes" : "no"}
      </div>
      <h1 className="serif mt-3 text-4xl text-cream">{conversation.title}</h1>
      <p className="mt-3 text-sm text-muted">
        {formatDateTime(conversation.startedAt)} ·{" "}
        {conversation.participantIds.map((personId) => getPerson(personId)?.name).filter(Boolean).join(", ") ||
          "Participants derived from the transcript"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Claims checked" value={String(numeric.length)} />
        <MiniStat label="Aligned" value={String(aligned.length)} />
        <MiniStat label="Discrepancies" value={String(unresolved.length)} />
        <MiniStat label="Decisions possibly influenced" value={String(decisionFindings.length)} />
      </div>

      <section className="panel mt-8 p-6">
        <h2 className="serif text-2xl">Claims</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2 pr-4">Speaker</th>
                <th className="py-2 pr-4">Metric</th>
                <th className="py-2 pr-4">Quoted</th>
                <th className="py-2 pr-4">Trusted</th>
                <th className="py-2">Comparison</th>
              </tr>
            </thead>
            <tbody>
              {numeric.map((claim) => {
                const verification = verifications.find((item) => item.claimId === claim.id);
                const metric = claim.metricId ? getMetric(claim.metricId) : undefined;
                return (
                  <tr key={claim.id} className="border-t border-line align-top">
                    <td className="py-3 pr-4">
                      <div className="text-cream">{claim.speakerName}</div>
                      <div className="text-xs text-muted">{claim.team}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {metric ? (
                        <Link href={`/metrics/${metric.id}`} className="text-signal">
                          {metric.canonicalName}
                        </Link>
                      ) : (
                        "Unmapped"
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {formatValue(claim.quotedValue, claim.unit)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {formatValue(verification?.trustedValue, metric?.unit)}
                    </td>
                    <td className="py-3">
                      {verification && <ComparisonBadge result={verification.comparisonResult} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Discrepancies and follow-ups</h2>
        <div className="mt-4 space-y-3">
          {unresolved.map((finding) => (
            <Link key={finding.id} href={`/inbox/${finding.id}`} className="block rounded-2xl border border-line p-4 hover:border-signal/30">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                {finding.driftTypes.map((type) => (
                  <DriftBadge key={type} type={type} />
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-cream">{finding.rootCause}</p>
              <p className="mt-2 text-sm text-muted">{finding.recommendedAction}</p>
            </Link>
          ))}
          {unresolved.length === 0 && (
            <p className="text-sm text-muted">No unresolved alignment issues in this conversation.</p>
          )}
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Transcript evidence</h2>
        <p className="mt-2 text-xs text-muted">
          Shown because you would have had access to the original source. Excerpts are retained only to explain findings.
        </p>
        <div className="mt-4 space-y-3">
          {turns.map((turn) => {
            const turnClaims = claims.filter((claim) => claim.turnIndex === turn.index && claim.quotedValue != null);
            return (
              <div
                key={turn.index}
                className={`rounded-2xl border p-4 ${turnClaims.length ? "border-warn/30 bg-warn/5" : "border-line bg-ink-2/50"}`}
              >
                <div className="text-xs text-muted">
                  {turn.speakerName}
                  {turn.team ? ` · ${turn.team}` : ""}
                  {turn.timestamp ? ` · ${turn.timestamp}` : ""}
                </div>
                <p className="mt-2 text-sm leading-6 text-cream">{turn.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="serif mt-2 text-3xl">{value}</div>
    </div>
  );
}

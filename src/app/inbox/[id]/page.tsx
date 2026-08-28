import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparisonBadge, DriftBadge, SeverityBadge, StatusBadge } from "@/components/Badges";
import { ResolveForm } from "@/components/ResolveForm";
import { getMetric } from "@/lib/data/catalogue";
import { getPerson } from "@/lib/data/people";
import { barrierLabel, formatDateTime, formatDifference, formatPeriod, formatValue } from "@/lib/format";
import { getSnapshot } from "@/lib/store";

export default async function FindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = getSnapshot();
  const finding = snapshot.findings.find((item) => item.id === id);
  if (!finding) notFound();

  const metric = finding.metricId ? getMetric(finding.metricId) : undefined;
  const conversation = snapshot.conversations.find((item) => item.id === finding.conversationId);
  const claims = snapshot.claims.filter((claim) => finding.claimIds.includes(claim.id));
  const primary = claims[0];
  const verification = snapshot.verifications.find((item) => item.id === finding.verificationId);
  const resolutions = snapshot.resolutions.filter((item) => item.findingId === finding.id);
  const owner = finding.ownerId ? getPerson(finding.ownerId) : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/inbox" className="text-xs uppercase tracking-[0.12em] text-signal">
        ← Alignment Inbox
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <StatusBadge status={finding.status} />
        {finding.driftTypes.map((type) => (
          <DriftBadge key={type} type={type} />
        ))}
      </div>
      <h1 className="serif mt-4 text-4xl text-cream">
        {metric?.canonicalName ?? "Unmapped claim"}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{finding.rootCause}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Quoted</div>
          <div className="serif mt-2 text-3xl">
            {formatValue(primary?.quotedValue, primary?.unit ?? metric?.unit)}
          </div>
          <div className="mt-2 text-xs text-muted">{primary?.speakerName}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Trusted value</div>
          <div className="serif mt-2 text-3xl">
            {formatValue(verification?.trustedValue, metric?.unit)}
          </div>
          <div className="mt-2 text-xs text-muted">
            {formatPeriod(primary?.period)} · {verification?.dataFreshnessAt ? formatDateTime(verification.dataFreshnessAt) : "no freeze"}
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Difference</div>
          <div className="serif mt-2 text-3xl">
            {formatDifference(verification?.difference, metric?.unit)}
          </div>
          <div className="mt-2">
            {verification && <ComparisonBadge result={verification.comparisonResult} />}
          </div>
        </div>
      </div>

      <section className="panel mt-8 p-6">
        <h2 className="serif text-2xl">What was said</h2>
        <div className="mt-4 space-y-3">
          {claims.map((claim) => (
            <blockquote key={claim.id} className="rounded-lg border border-line bg-ink-2 p-4">
              <div className="text-xs text-muted">
                {claim.speakerName}
                {claim.team ? ` · ${claim.team}` : ""} · extraction {(claim.extractionConfidence * 100).toFixed(0)}%
              </div>
              <p className="mt-2 text-sm leading-6 text-cream">“{claim.textExcerpt}”</p>
            </blockquote>
          ))}
        </div>
        {conversation && (
          <Link href={`/conversations/${conversation.id}`} className="mt-4 inline-block text-sm text-signal">
            Open conversation report → {conversation.title}
          </Link>
        )}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Assumptions tested</h2>
        <p className="mt-2 text-sm text-muted">
          The LLM may propose filters. Authoritative numbers come only from registered templates.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-4">Template</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2 pr-4">Matches claim</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(verification?.assumptionTests ?? []).map((test) => (
                <tr key={test.templateId} className="border-t border-line">
                  <td className="py-3 pr-4 text-cream">{test.label}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {formatValue(test.value, metric?.unit)}
                  </td>
                  <td className="py-3 pr-4">{test.matchesClaim ? "Yes" : "No"}</td>
                  <td className="py-3 text-muted">{test.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {primary?.assumptions.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            {primary.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="serif text-2xl">Why this happened</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{finding.rootCause}</p>
          <p className="mt-4 text-sm leading-6 text-cream">{finding.recommendedAction}</p>
          <div className="mt-4 text-xs text-muted">
            Owner: {owner?.name ?? "Unassigned"} · {finding.teamsInvolved.join(", ") || "Team unknown"}
          </div>
          {finding.adoptionBarriers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {finding.adoptionBarriers.map((barrier) => (
                <span key={barrier} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                  {barrierLabel[barrier]}
                </span>
              ))}
            </div>
          )}
        </section>
        <section className="panel p-6">
          <ResolveForm findingId={finding.id} />
          {resolutions.length > 0 && (
            <div className="mt-6 space-y-3">
              {resolutions.map((resolution) => (
                <div key={resolution.id} className="rounded-lg border border-line p-3 text-sm">
                  <div className="text-xs text-muted">
                    {getPerson(resolution.reviewerId)?.name} · {formatDateTime(resolution.resolvedAt)}
                  </div>
                  <div className="mt-1 text-cream">{resolution.resolutionType.replaceAll("_", " ")}</div>
                  <p className="mt-1 text-muted">{resolution.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

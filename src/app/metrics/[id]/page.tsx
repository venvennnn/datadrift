"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { DriftBadge, SeverityBadge } from "@/components/Badges";
import { getMetric } from "@/lib/data/catalogue";
import { getPerson } from "@/lib/data/people";
import { canonicalObservation, queryTemplates } from "@/lib/data/trusted";
import { formatDate, formatValue } from "@/lib/format";
import { useSnapshot } from "@/lib/use-snapshot";

export default function MetricPage() {
  const rawId = useParams<{ id: string }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const metric = getMetric(id);
  if (!metric) notFound();
  const snapshot = useSnapshot();
  const versions = snapshot.metricVersions.filter((version) => version.metricId === id);
  const templates = queryTemplates.filter((template) => template.metricId === id);
  const latest = canonicalObservation(id, { period: "2026-07" });
  const findings = snapshot.findings.filter((finding) => finding.metricId === id);
  const claims = snapshot.claims.filter((claim) => claim.metricId === id);
  const teams = Array.from(new Set(claims.map((claim) => claim.team).filter(Boolean) as string[]));
  const causes = Array.from(
    new Set(findings.flatMap((finding) => finding.driftTypes)),
  );
  const unofficial = claims.filter((claim) =>
    /tracker|spreadsheet|deck/i.test(claim.sourceMentioned ?? ""),
  );
  const owner = getPerson(metric.ownerId);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/metrics" className="text-xs uppercase tracking-[0.12em] text-signal">
        ← Catalogue
      </Link>
      <h1 className="serif mt-4 text-4xl text-cream">{metric.canonicalName}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{metric.description}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Canonical July value</div>
          <div className="serif mt-2 text-4xl">{formatValue(latest?.value ?? null, metric.unit)}</div>
          <div className="mt-2 text-xs text-muted">{metric.sourceView}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Owner</div>
          <div className="mt-2 text-lg text-cream">{owner?.name}</div>
          <div className="mt-2 text-xs text-muted">{owner?.title}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Freshness</div>
          <div className="mt-2 text-sm leading-6 text-cream">{metric.refreshCadence}</div>
          <div className="mt-2 text-xs text-muted">{metric.dataLatency}</div>
        </div>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Official definition</h2>
        <p className="mt-3 font-mono text-sm text-signal">{metric.formulaDescription}</p>
        {metric.numerator && (
          <p className="mt-3 text-sm text-muted">Numerator: {metric.numerator}</p>
        )}
        {metric.denominator && (
          <p className="mt-1 text-sm text-muted">Denominator: {metric.denominator}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {metric.aliases.map((alias) => (
            <span key={alias.alias} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              {alias.alias}
              {alias.team ? ` · ${alias.team}` : ""}
            </span>
          ))}
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Definition versions</h2>
        <div className="mt-4 space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-lg border border-line p-4">
              <div className="text-xs text-muted">
                {formatDate(version.effectiveFrom)} – {version.effectiveTo ? formatDate(version.effectiveTo) : "present"}
              </div>
              <p className="mt-2 text-sm text-cream">{version.definition}</p>
              <p className="mt-2 text-xs text-muted">{version.changeReason}</p>
            </div>
          ))}
          {versions.length === 0 && <p className="text-sm text-muted">No version history recorded yet.</p>}
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Registered query templates</h2>
        <p className="mt-2 text-sm text-muted">
          Unrestricted natural-language SQL is not permitted. These templates are the only way a number can be reproduced.
        </p>
        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-cream">{template.label}</div>
                {template.isCanonical && <span className="text-xs text-signal">Canonical</span>}
              </div>
              <pre className="mt-3 overflow-x-auto text-xs text-muted">{template.sqlPreview}</pre>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="serif text-2xl">Teams discussing it</h2>
          <p className="mt-3 text-sm text-muted">{teams.join(" · ") || "No recent conversation claims."}</p>
          <p className="mt-4 text-sm text-muted">
            Source adoption: {claims.length ? Math.round((1 - unofficial.length / Math.max(claims.length, 1)) * 100) : 100}% of extracted claims did not cite a personal tracker or deck.
          </p>
        </section>
        <section className="panel p-6">
          <h2 className="serif text-2xl">Common causes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {causes.length ? causes.map((type) => <DriftBadge key={type} type={type} />) : <span className="text-sm text-muted">No drift recorded.</span>}
          </div>
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="serif text-2xl">Recent disagreements</h2>
        <div className="mt-4 space-y-3">
          {findings
            .filter((finding) => finding.driftTypes.length > 0)
            .slice(0, 8)
            .map((finding) => (
              <Link key={finding.id} href={`/inbox/${finding.id}`} className="block rounded-lg border border-line p-4 hover:bg-ink-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={finding.severity} />
                  {finding.driftTypes.map((type) => (
                    <DriftBadge key={type} type={type} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">{finding.rootCause}</p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

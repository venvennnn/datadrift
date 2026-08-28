import Link from "next/link";
import { getPerson } from "@/lib/data/people";
import { canonicalObservation } from "@/lib/data/trusted";
import { formatValue } from "@/lib/format";
import { getSnapshot } from "@/lib/store";

export default function MetricsPage() {
  const snapshot = getSnapshot();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.12em] text-signal">Foundation</p>
      <h1 className="serif mt-3 text-4xl text-cream">Metric catalogue</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Without this layer the product could compare text against a number without knowing whether it was comparing the correct concepts. Queries run only through registered templates.
      </p>
      <div className="mt-8 space-y-4">
        {snapshot.metrics.map((metric) => {
          const owner = getPerson(metric.ownerId);
          const latest = canonicalObservation(metric.id, { period: "2026-07" });
          const findings = snapshot.findings.filter(
            (finding) => finding.metricId === metric.id && finding.status === "unresolved",
          );
          return (
            <Link key={metric.id} href={`/metrics/${metric.id}`} className="panel block p-6 hover:bg-ink-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="serif text-2xl text-cream">{metric.canonicalName}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted">{metric.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-signal">
                    {formatValue(latest?.value ?? null, metric.unit)}
                  </div>
                  <div className="mt-1 text-xs text-muted">July 2026 canonical</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                <span>Owner: {owner?.name}</span>
                <span>{metric.sourceView}</span>
                <span>{findings.length} unresolved findings</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

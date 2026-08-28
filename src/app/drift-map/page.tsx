import Link from "next/link";
import { getMetric } from "@/lib/data/catalogue";
import { getSnapshot } from "@/lib/store";

export default function DriftMapPage() {
  const snapshot = getSnapshot();
  const findings = snapshot.findings.filter(
    (finding) => finding.status === "unresolved" && finding.teamsInvolved.length >= 2,
  );
  const pairs = new Map<string, { teams: [string, string]; count: number; metrics: Set<string>; findingId: string }>();
  for (const finding of findings) {
    const teams = [...finding.teamsInvolved].sort();
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        const key = `${teams[i]}::${teams[j]}`;
        const current = pairs.get(key) ?? {
          teams: [teams[i], teams[j]] as [string, string],
          count: 0,
          metrics: new Set<string>(),
          findingId: finding.id,
        };
        current.count += 1;
        if (finding.metricId) current.metrics.add(finding.metricId);
        pairs.set(key, current);
      }
    }
  }

  const ranked = [...pairs.values()].sort((a, b) => b.count - a.count);
  const sources = snapshot.claims.reduce(
    (acc, claim) => {
      if (/spreadsheet|tracker/.test(claim.sourceMentioned ?? "")) acc.tracker += 1;
      else if (/dashboard/.test(claim.sourceMentioned ?? "")) acc.dashboard += 1;
      else acc.unstated += 1;
      return acc;
    },
    { tracker: 0, dashboard: 0, unstated: 0 },
  );

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.12em] text-signal">Cross-functional view</p>
      <h1 className="serif mt-3 text-4xl text-cream">Organisational drift map</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        This analyses disagreements between teams and sources — not rank of individual employees. The goal is recurring drift declining, not a high count of findings.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Personal trackers cited</div>
          <div className="serif mt-2 text-4xl">{sources.tracker}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Official dashboards cited</div>
          <div className="serif mt-2 text-4xl">{sources.dashboard}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Source unstated</div>
          <div className="serif mt-2 text-4xl">{sources.unstated}</div>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        {ranked.map((pair) => (
          <Link
            key={pair.teams.join("-")}
            href={`/inbox/${pair.findingId}`}
            className="panel block p-6 hover:bg-ink-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="serif text-2xl text-cream">
                {pair.teams[0]}
                <span className="mx-2 text-muted">and</span>
                {pair.teams[1]}
              </h2>
              <div className="text-xs text-muted">{pair.count} shared findings</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
              {[...pair.metrics].map((metricId) => (
                <span key={metricId} className="rounded-full border border-line px-3 py-1">
                  {getMetric(metricId)?.canonicalName ?? metricId}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="panel mt-8 p-6">
        <h2 className="serif text-2xl">Patterns the map is designed to show</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
          <li>Sales and Finance disagree on revenue-like measures such as disbursement.</li>
          <li>Risk and Product use different active-customer definitions.</li>
          <li>Malaysia quotes a retail-filtered approval rate while other teams use the all-segment book.</li>
          <li>Executives repeatedly hear an official dashboard that has not yet frozen.</li>
        </ul>
      </section>
    </div>
  );
}

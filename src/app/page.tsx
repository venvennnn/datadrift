import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DriftBadge, SeverityBadge, StatusBadge } from "@/components/Badges";
import { getPerson } from "@/lib/data/people";
import { getMetric } from "@/lib/data/catalogue";
import { formatDate } from "@/lib/format";
import { getSnapshot } from "@/lib/store";

export default function OverviewPage() {
  const snapshot = getSnapshot();
  const unresolved = snapshot.findings.filter((finding) => finding.status === "unresolved");
  const numericalClaims = snapshot.claims.filter((claim) => claim.quotedValue != null);
  const aligned = snapshot.verifications.filter(
    (item) => item.comparisonResult === "aligned" || item.comparisonResult === "approximately_aligned",
  );
  const alignmentRate =
    snapshot.verifications.length === 0
      ? 0
      : Math.round((aligned.length / snapshot.verifications.length) * 100);
  const hero = unresolved.find((finding) => finding.conversationId === "conv_mbr_aug" && finding.claimIds.length > 1);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs uppercase tracking-[0.22em] text-signal">Organisational intelligence</p>
      <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight text-cream md:text-5xl">
        Your database has one version of the truth. This checks how many versions exist in the organisation.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
        Data Drift Detector is not a BI dashboard and not pipeline observability. It compares claims in authorised conversations against registered, read-only metric templates — then explains why teams diverged.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Unresolved alignment issues" value={String(unresolved.length)} hint="Inbox items awaiting a metric owner" />
        <Stat label="Numerical claims checked" value={String(numericalClaims.length)} hint="Extracted from authorised sources" />
        <Stat label="Reproducible alignment" value={`${alignmentRate}%`} hint="Claims within catalogue tolerance" />
        <Stat label="Catalogue metrics" value={String(snapshot.metrics.length)} hint="Approved definitions, not generated SQL" />
      </div>

      {hero && (
        <section className="panel mt-10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-warn">MVP demonstration</p>
            <SeverityBadge severity={hero.severity} />
            {hero.driftTypes.map((type) => (
              <DriftBadge key={type} type={type} />
            ))}
          </div>
          <h2 className="serif mt-4 text-3xl text-cream">July approval rate was not one number.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            Sales quoted 47%, Risk quoted 39%, Finance quoted 42%. The detector did not declare people wrong. It reproduced each figure from a registered template: Sales used qualified leads, Risk used the canonical submitted-application denominator, and Finance used the official dashboard before late-arriving records landed. After freeze, the reproducible value is{" "}
            <span className="text-cream">39.4%</span>.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ClaimCard team="Sales" value="47%" note="Approved / qualified leads" />
            <ClaimCard team="Risk" value="39%" note="Approved / submitted — canonical" />
            <ClaimCard team="Finance" value="42%" note="Stale Credit Ops dashboard" />
          </div>
          <Link
            href={`/inbox/${hero.id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm text-signal hover:text-cream"
          >
            Open the root-cause finding <ArrowRight size={16} />
          </Link>
        </section>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h3 className="serif text-2xl">Alignment Inbox</h3>
            <Link href="/inbox" className="text-sm text-signal">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {unresolved.slice(0, 5).map((finding) => {
              const metric = finding.metricId ? getMetric(finding.metricId) : undefined;
              return (
                <Link
                  key={finding.id}
                  href={`/inbox/${finding.id}`}
                  className="block rounded-2xl border border-line bg-ink-2/50 p-4 hover:border-signal/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-cream">{metric?.canonicalName ?? "Unmapped claim"}</div>
                    <SeverityBadge severity={finding.severity} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{finding.rootCause}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={finding.status} />
                    {finding.teamsInvolved.map((team) => (
                      <span key={team} className="text-xs text-muted">
                        {team}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h3 className="serif text-2xl">Authorised conversations</h3>
            <Link href="/conversations" className="text-sm text-signal">
              Open reports
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="block rounded-2xl border border-line bg-ink-2/50 p-4 hover:border-signal/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-cream">{conversation.title}</div>
                  <span className="text-xs text-muted">{formatDate(conversation.startedAt)}</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {conversation.participantIds.map((id) => getPerson(id)?.name.split(" ")[0]).join(", ")}
                  {" · "}
                  {snapshot.findings.filter((finding) => finding.conversationId === conversation.id && finding.status === "unresolved").length}{" "}
                  unresolved
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="serif mt-3 text-4xl text-cream">{value}</div>
      <div className="mt-2 text-xs text-muted">{hint}</div>
    </div>
  );
}

function ClaimCard({ team, value, note }: { team: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2/70 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-muted">{team}</div>
      <div className="serif mt-2 text-3xl">{value}</div>
      <div className="mt-2 text-xs leading-5 text-muted">{note}</div>
    </div>
  );
}

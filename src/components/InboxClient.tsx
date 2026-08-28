"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DriftBadge, SeverityBadge, StatusBadge } from "@/components/Badges";
import { getMetric } from "@/lib/data/catalogue";
import { getPerson } from "@/lib/data/people";
import { formatValue } from "@/lib/format";
import type { AppSnapshot, FindingStatus, Severity } from "@/lib/types";

const severities: Array<Severity | "all"> = ["all", "critical", "high", "medium", "low", "informational"];
const statuses: Array<FindingStatus | "all"> = [
  "all",
  "unresolved",
  "needs_investigation",
  "confirmed_drift",
  "resolved",
];

export function InboxClient({ snapshot }: { snapshot: AppSnapshot }) {
  const [severity, setSeverity] = useState<(typeof severities)[number]>("all");
  const [status, setStatus] = useState<(typeof statuses)[number]>("unresolved");
  const [query, setQuery] = useState("");

  const findings = useMemo(() => {
    return snapshot.findings.filter((finding) => {
      if (severity !== "all" && finding.severity !== severity) return false;
      if (status !== "all" && finding.status !== status) return false;
      if (query) {
        const metric = finding.metricId ? getMetric(finding.metricId)?.canonicalName : "";
        const haystack = `${metric} ${finding.rootCause} ${finding.quotedSummary} ${finding.teamsInvolved.join(" ")}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [snapshot.findings, severity, status, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search claims, teams, causes"
          className="field"
        />
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value as typeof severity)}
          className="field lg:w-48"
        >
          {severities.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All severities" : item}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="field lg:w-56"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All statuses" : item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel-2 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium">Quoted vs trusted</th>
              <th className="px-4 py-3 font-medium">Drift</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Severity</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => {
              const metric = finding.metricId ? getMetric(finding.metricId) : undefined;
              const conversation = snapshot.conversations.find((item) => item.id === finding.conversationId);
              const claim = snapshot.claims.find((item) => item.id === finding.claimIds[0]);
              const verification = snapshot.verifications.find((item) => item.id === finding.verificationId);
              return (
                <tr key={finding.id} className="border-t border-line bg-panel/60 hover:bg-panel-2">
                  <td className="px-4 py-4 align-top">
                    <Link href={`/inbox/${finding.id}`} className="text-cream hover:text-signal">
                      {metric?.canonicalName ?? "Unmapped"}
                    </Link>
                    <div className="mt-1 text-xs text-muted">{conversation?.title}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-mono text-xs text-cream">
                      {formatValue(claim?.quotedValue, claim?.unit ?? metric?.unit)}
                      {verification?.trustedValue != null && (
                        <>
                          {" → "}
                          {formatValue(verification.trustedValue, metric?.unit)}
                        </>
                      )}
                    </div>
                    <div className="mt-1 max-w-sm text-xs text-muted">{finding.rootCause}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {finding.driftTypes.length ? (
                        finding.driftTypes.map((type) => <DriftBadge key={type} type={type} />)
                      ) : (
                        <span className="text-xs text-muted">Aligned</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={finding.status} />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-muted">
                    {finding.ownerId ? getPerson(finding.ownerId)?.name : "Unassigned"}
                    <div className="mt-1">{finding.teamsInvolved.join(" · ")}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <SeverityBadge severity={finding.severity} />
                  </td>
                </tr>
              );
            })}
            {findings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">
                  No findings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

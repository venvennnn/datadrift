import { cn } from "@/lib/cn";
import {
  comparisonLabel,
  driftTypeLabel,
  severityLabel,
  statusLabel,
} from "@/lib/format";
import type { ComparisonResult, DriftType, FindingStatus, Severity } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone: Record<Severity, string> = {
    informational: "border-line text-muted",
    low: "border-line text-muted",
    medium: "border-warn/30 text-warn",
    high: "border-alert/30 text-alert",
    critical: "border-alert/40 text-alert",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", tone[severity])}>
      {severityLabel[severity]}
    </span>
  );
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const resolved = status === "resolved" || status === "false_positive" || status === "valid_alternative_context";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px]",
        resolved ? "border-good/30 text-good" : "border-line text-muted",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function DriftBadge({ type }: { type: DriftType }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted">
      {driftTypeLabel[type]}
    </span>
  );
}

export function ComparisonBadge({ result }: { result: ComparisonResult }) {
  const good = result === "aligned" || result === "approximately_aligned";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px]",
        good ? "border-good/30 text-good" : "border-line text-muted",
      )}
    >
      {comparisonLabel[result]}
    </span>
  );
}

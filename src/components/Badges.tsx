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
    informational: "bg-info/15 text-info",
    low: "bg-white/8 text-muted",
    medium: "bg-warn/15 text-warn",
    high: "bg-alert/15 text-alert",
    critical: "bg-alert/25 text-alert",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", tone[severity])}>
      {severityLabel[severity]}
    </span>
  );
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const resolved = status === "resolved" || status === "false_positive" || status === "valid_alternative_context";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        resolved ? "bg-good/15 text-good" : "bg-white/8 text-cream/80",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function DriftBadge({ type }: { type: DriftType }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-cream/80">
      {driftTypeLabel[type]}
    </span>
  );
}

export function ComparisonBadge({ result }: { result: ComparisonResult }) {
  const good = result === "aligned" || result === "approximately_aligned";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px]", good ? "bg-good/15 text-good" : "bg-warn/15 text-warn")}>
      {comparisonLabel[result]}
    </span>
  );
}

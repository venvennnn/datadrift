import type {
  AdoptionBarrier,
  ComparisonResult,
  DriftType,
  FindingStatus,
  MetricUnit,
  Severity,
  SourceType,
} from "@/lib/types";

export function formatValue(
  value: number | null | undefined,
  unit: MetricUnit | null | undefined,
  currency = "USD",
): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (unit === "rate" || unit === "ratio") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === "currency") {
    const millions = Math.abs(value) >= 1_000_000;
    if (millions) {
      return `${currency === "USD" ? "$" : `${currency} `}${(value / 1_000_000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "count") {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
  return String(value);
}

export function formatDifference(
  difference: number | null | undefined,
  unit: MetricUnit | null | undefined,
): string {
  if (difference == null) return "—";
  const sign = difference > 0 ? "+" : "";
  if (unit === "rate" || unit === "ratio") {
    return `${sign}${(difference * 100).toFixed(1)} pp`;
  }
  return `${sign}${formatValue(difference, unit)}`;
}

export function formatPeriod(period: string | null | undefined): string {
  if (!period) return "Unspecified period";
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const date = new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return period.replaceAll("_", " ");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const driftTypeLabel: Record<DriftType, string> = {
  numerical: "Numerical drift",
  definition: "Definition drift",
  context: "Context drift",
  temporal: "Temporal drift",
  source: "Source drift",
  semantic: "Semantic drift",
  trust: "Trust drift",
  documentation: "Documentation drift",
  unverifiable: "Unverifiable claim",
};

export const comparisonLabel: Record<ComparisonResult, string> = {
  aligned: "Aligned",
  approximately_aligned: "Approximately aligned",
  outdated: "Outdated",
  contextually_incomplete: "Contextually incomplete",
  definitionally_inconsistent: "Definitionally inconsistent",
  numerically_inconsistent: "Numerically inconsistent",
  valid_alternative: "Valid under an alternative definition",
  unverifiable: "Unverifiable",
};

export const statusLabel: Record<FindingStatus, string> = {
  unresolved: "Unresolved",
  confirmed_drift: "Confirmed drift",
  valid_alternative_context: "Valid alternative context",
  database_issue: "Database issue",
  definition_issue: "Definition issue",
  documentation_issue: "Documentation issue",
  false_positive: "False positive",
  needs_investigation: "Needs investigation",
  resolved: "Resolved",
};

export const severityLabel: Record<Severity, string> = {
  informational: "Informational",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const sourceLabel: Record<SourceType, string> = {
  meet: "Google Meet",
  slack: "Slack",
  upload: "Uploaded transcript",
  transcript: "Transcript",
};

export const barrierLabel: Record<AdoptionBarrier, string> = {
  discoverability: "Discoverability",
  accessibility: "Accessibility",
  usability: "Usability",
  latency: "Latency",
  trust: "Trust",
  definition_clarity: "Definition clarity",
  workflow_fit: "Workflow fit",
  coverage: "Coverage",
  ownership: "Ownership",
  historical_habit: "Historical habit",
  communication: "Communication",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "All markets";
  const names: Record<string, string> = {
    MY: "Malaysia",
    SG: "Singapore",
    ID: "Indonesia",
    TH: "Thailand",
    PH: "Philippines",
  };
  return names[code] ?? code;
}

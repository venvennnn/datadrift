import { getCurrentVersion, getMetric } from "@/lib/data/catalogue";
import {
  alternativeObservations,
  canonicalObservation,
  queryTemplates,
} from "@/lib/data/trusted";
import type {
  AssumptionTest,
  ComparisonResult,
  ExtractedClaim,
  Metric,
  Verification,
} from "@/lib/types";

function withinTolerance(metric: Metric, difference: number): boolean {
  const abs = Math.abs(difference);
  if (metric.toleranceType === "percentage_points" || metric.toleranceType === "absolute") {
    return abs <= metric.toleranceValue;
  }
  const baseline = Math.max(Math.abs(difference), 1);
  // relative tolerance uses the trusted value via caller
  return abs <= baseline;
}

function relativeOk(metric: Metric, trusted: number, difference: number): boolean {
  if (metric.toleranceType !== "relative") {
    return withinTolerance(metric, difference);
  }
  if (trusted === 0) return Math.abs(difference) === 0;
  return Math.abs(difference) / Math.abs(trusted) <= metric.toleranceValue;
}

function matchesClaim(claimValue: number, trusted: number, metric: Metric): boolean {
  return relativeOk(metric, trusted, claimValue - trusted);
}

export function compareClaim(claim: ExtractedClaim, verifiedAt: string): Verification {
  const metric = claim.metricId ? getMetric(claim.metricId) : undefined;
  const params = {
    period: claim.period,
    country: claim.country,
    segment: claim.segment,
    product: claim.product,
  };

  const tests: AssumptionTest[] = [];
  if (metric) {
    for (const { template, observation } of alternativeObservations(metric.id, params)) {
      const value = observation?.value ?? null;
      tests.push({
        templateId: template.id,
        label: template.label,
        value,
        matchesClaim:
          claim.quotedValue != null && value != null
            ? matchesClaim(claim.quotedValue, value, metric)
            : false,
        notes: template.notes,
      });
    }
  }

  const canonical = metric ? canonicalObservation(metric.id, params) : null;
  const trustedValue = canonical?.value ?? null;
  const difference =
    claim.quotedValue != null && trustedValue != null
      ? claim.quotedValue - trustedValue
      : null;

  let comparisonResult: ComparisonResult = "unverifiable";
  const canonicalTest = tests.find((test) => test.label.startsWith("Canonical"));
  const matchingAlt = tests.find(
    (test) => test.matchesClaim && test.templateId !== canonicalTest?.templateId,
  );

  if (claim.quotedValue == null) {
    comparisonResult = claim.kind === "definition" ? "contextually_incomplete" : "unverifiable";
  } else if (!metric || trustedValue == null || !claim.period) {
    comparisonResult = claim.period ? "unverifiable" : "contextually_incomplete";
  } else if (canonicalTest?.matchesClaim) {
    const exact = Math.abs(difference ?? 1) < 1e-9;
    comparisonResult = exact || (metric.toleranceType !== "percentage_points" && Math.abs(difference ?? 1) === 0)
      ? "aligned"
      : "approximately_aligned";
    if (metric.toleranceType === "percentage_points" && Math.abs(difference ?? 0) <= metric.toleranceValue) {
      comparisonResult = Math.abs(difference ?? 0) < 0.001 ? "aligned" : "approximately_aligned";
    }
    if (metric.toleranceType === "relative" && relativeOk(metric, trustedValue, difference ?? 0)) {
      comparisonResult = Math.abs(difference ?? 0) / trustedValue < 0.005 ? "aligned" : "approximately_aligned";
    }
  } else if (matchingAlt) {
    const template = queryTemplates.find((item) => item.id === matchingAlt.templateId);
    if (template?.isStaleSnapshot) comparisonResult = "outdated";
    else if (template?.alternativeName) comparisonResult = "valid_alternative";
    else comparisonResult = "definitionally_inconsistent";
  } else if (difference != null) {
    comparisonResult = "numerically_inconsistent";
  }

  if (claim.kind === "definition" && claim.quotedValue == null) {
    comparisonResult = "contextually_incomplete";
  }

  const version = metric ? getCurrentVersion(metric.id) : null;

  return {
    id: `ver_${claim.id}`,
    claimId: claim.id,
    trustedValue,
    difference,
    comparisonResult,
    definitionVersionId: version?.id ?? null,
    queryTemplateId: canonical ? `${canonical.templateId}` : null,
    queryParameters: {
      period: claim.period,
      country: claim.country,
      segment: claim.segment,
      product: claim.product,
    },
    dataFreshnessAt: canonical?.dataFreshnessAt ?? null,
    verifiedAt,
    assumptionTests: tests,
  };
}

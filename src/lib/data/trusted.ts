import type { QueryTemplate, TrustedObservation } from "@/lib/types";

export const queryTemplates: QueryTemplate[] = [
  {
    id: "approval_rate_canonical",
    metricId: "approval_rate",
    label: "Canonical: approved / submitted",
    sqlPreview:
      "select approved_applications::float / nullif(submitted_applications, 0) from analytics.credit_origination_monthly where month = :period and coalesce(country, :country) = coalesce(:country, country)",
    isCanonical: true,
    notes: "Registered read-only template. Includes late-arriving submitted applications.",
  },
  {
    id: "approval_rate_qualified_leads",
    metricId: "approval_rate",
    label: "Sales funnel: approved / qualified leads",
    sqlPreview:
      "select approved_applications::float / nullif(qualified_leads, 0) from analytics.sales_funnel_monthly where month = :period",
    isCanonical: false,
    alternativeName: "Lead-to-approval conversion",
    notes: "Valid funnel metric, but it is not the catalogue definition of approval rate.",
  },
  {
    id: "approval_rate_stale_dashboard",
    metricId: "approval_rate",
    label: "Credit Ops dashboard snapshot before late-arriving records",
    sqlPreview:
      "select snapshot_approval_rate from ops.credit_dashboard_snapshots where month = :period and captured_at = :as_of",
    isCanonical: false,
    isStaleSnapshot: true,
    notes: "Same dashboard as the canonical metric, captured before T+2 freeze.",
  },
  {
    id: "approval_rate_retail_my",
    metricId: "approval_rate",
    label: "Malaysia retail book only",
    sqlPreview:
      "select approved_applications::float / nullif(submitted_applications, 0) from analytics.credit_origination_monthly where month = :period and country = 'MY' and segment = 'retail'",
    isCanonical: false,
    notes: "Approved filter, but narrower than an all-segment Malaysia claim.",
  },
  {
    id: "monthly_disbursement_canonical",
    metricId: "monthly_disbursement",
    label: "Canonical net disbursement, calendar month, USD",
    sqlPreview:
      "select sum(disbursed_amount_usd) from analytics.disbursement_monthly where month = :period and status = 'disbursed'",
    isCanonical: true,
    notes: "Excludes cancelled loans and approved-but-undisbursed facilities.",
  },
  {
    id: "monthly_disbursement_gross_sales",
    metricId: "monthly_disbursement",
    label: "Sales tracker: approved amount including pipeline",
    sqlPreview:
      "select sum(approved_amount_usd) from analytics.origination_approved_monthly where month = :period",
    isCanonical: false,
    alternativeName: "Gross approved amount",
    notes: "Includes cancelled loans and facilities not yet disbursed.",
  },
  {
    id: "monthly_disbursement_ops_undisbursed",
    metricId: "monthly_disbursement",
    label: "Operations: disbursed + approved undisbursed",
    sqlPreview:
      "select sum(approved_amount_usd) filter (where status in ('disbursed','approved')) from analytics.origination_approved_monthly where month = :period",
    isCanonical: false,
    notes: "Adds approved but undisbursed facilities; still excludes most cancellations.",
  },
  {
    id: "dpd90_canonical",
    metricId: "dpd90",
    label: "Canonical DPD90",
    sqlPreview:
      "select principal_dpd_90_plus / nullif(outstanding_principal, 0) from analytics.credit_risk_monthly where month = :period",
    isCanonical: true,
    notes: "Month-end book snapshot.",
  },
  {
    id: "active_customers_canonical",
    metricId: "active_customers",
    label: "Canonical: paying customers with outstanding balance",
    sqlPreview:
      "select count(distinct customer_id) from analytics.customer_snapshot_monthly where month = :period and outstanding_balance > 0",
    isCanonical: true,
    notes: "Finance / book definition effective 2025-07-01.",
  },
  {
    id: "active_customers_logged_in_legacy",
    metricId: "active_customers",
    label: "Retired definition: logged-in in trailing 30 days",
    sqlPreview:
      "select count(distinct customer_id) from analytics.product_engagement_monthly where month = :period and last_login >= month_end - 30",
    isCanonical: false,
    alternativeName: "Logged-in customers",
    notes: "Valid product metric, but it stopped being the definition of active customers on 2025-07-01.",
  },
  {
    id: "logged_in_customers_canonical",
    metricId: "logged_in_customers",
    label: "Product: logged-in in trailing 30 days",
    sqlPreview:
      "select count(distinct customer_id) from analytics.product_engagement_monthly where month = :period and last_login >= month_end - 30",
    isCanonical: true,
    notes: "Product usage metric. Historically mislabelled as active customers.",
  },
  {
    id: "npl_ratio_canonical",
    metricId: "npl_ratio",
    label: "Canonical NPL ratio",
    sqlPreview:
      "select npl_balance / nullif(gross_loan_book, 0) from analytics.credit_risk_monthly where month = :period",
    isCanonical: true,
    notes: "Regulatory 90-day definition.",
  },
  {
    id: "origination_volume_canonical",
    metricId: "origination_volume",
    label: "Canonical origination volume",
    sqlPreview:
      "select count(loan_id) from analytics.credit_origination_monthly where month = :period",
    isCanonical: true,
    notes: "Calendar month originated loans.",
  },
  {
    id: "average_ticket_size_canonical",
    metricId: "average_ticket_size",
    label: "Canonical average ticket size",
    sqlPreview:
      "select net_disbursement / nullif(originated_loan_count, 0) from analytics.disbursement_monthly where month = :period",
    isCanonical: true,
    notes: "USD, calendar month.",
  },
  {
    id: "collection_rate_canonical",
    metricId: "collection_rate",
    label: "Canonical collection rate",
    sqlPreview:
      "select collected_amount / nullif(scheduled_amount, 0) from analytics.collections_monthly where month = :period",
    isCanonical: true,
    notes: "Calendar month collections.",
  },
  {
    id: "default_rate_canonical",
    metricId: "default_rate",
    label: "Canonical 6-month vintage default rate",
    sqlPreview:
      "select defaulted_loans / nullif(originated_loans, 0) from analytics.credit_vintages where vintage_month = :period",
    isCanonical: true,
    notes: "Not a spot book rate.",
  },
  {
    id: "conversion_rate_canonical",
    metricId: "conversion_rate",
    label: "Canonical application conversion",
    sqlPreview:
      "select submitted_applications / nullif(started_applications, 0) from analytics.credit_origination_monthly where month = :period",
    isCanonical: true,
    notes: "Credit funnel, not sales won/lost conversion.",
  },
  {
    id: "churn_rate_canonical",
    metricId: "churn_rate",
    label: "Canonical churn rate",
    sqlPreview:
      "select churned_customers / nullif(beginning_active_customers, 0) from analytics.customer_snapshot_monthly where month = :period",
    isCanonical: true,
    notes: "Book churn, not app uninstalls.",
  },
];

export const trustedObservations: TrustedObservation[] = [
  {
    templateId: "approval_rate_canonical",
    metricId: "approval_rate",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.394,
    numerator: 3862,
    denominator: 9802,
    asOf: "2026-08-04T22:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
    notes: "Includes 629 late-arriving submitted applications, mostly declines.",
  },
  {
    templateId: "approval_rate_canonical",
    metricId: "approval_rate",
    period: "2026-07",
    country: "MY",
    segment: null,
    product: null,
    value: 0.381,
    numerator: 1404,
    denominator: 3685,
    asOf: "2026-08-04T22:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "approval_rate_canonical",
    metricId: "approval_rate",
    period: "2026-07",
    country: "SG",
    segment: null,
    product: null,
    value: 0.412,
    numerator: 980,
    denominator: 2379,
    asOf: "2026-08-04T22:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "approval_rate_canonical",
    metricId: "approval_rate",
    period: "2026-06",
    country: null,
    segment: null,
    product: null,
    value: 0.408,
    numerator: 3711,
    denominator: 9096,
    asOf: "2026-07-04T06:00:00+08:00",
    dataFreshnessAt: "2026-07-04T06:00:00+08:00",
  },
  {
    templateId: "approval_rate_qualified_leads",
    metricId: "approval_rate",
    period: "2026-07",
    country: null,
    segment: "qualified_leads",
    product: null,
    value: 0.472,
    numerator: 3862,
    denominator: 8178,
    asOf: "2026-08-04T07:00:00+08:00",
    dataFreshnessAt: "2026-08-04T07:00:00+08:00",
    notes: "Matches the Sales weekly tracker.",
  },
  {
    templateId: "approval_rate_stale_dashboard",
    metricId: "approval_rate",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.421,
    numerator: 3862,
    denominator: 9173,
    asOf: "2026-08-05T08:10:00+08:00",
    dataFreshnessAt: "2026-08-05T08:00:00+08:00",
    notes: "Dashboard had not yet incorporated late-arriving submitted records.",
  },
  {
    templateId: "approval_rate_retail_my",
    metricId: "approval_rate",
    period: "2026-07",
    country: "MY",
    segment: "retail",
    product: null,
    value: 0.378,
    numerator: 1188,
    denominator: 3143,
    asOf: "2026-08-04T22:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "monthly_disbursement_canonical",
    metricId: "monthly_disbursement",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 12_400_000,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "monthly_disbursement_gross_sales",
    metricId: "monthly_disbursement",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 14_100_000,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "monthly_disbursement_ops_undisbursed",
    metricId: "monthly_disbursement",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 13_600_000,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "dpd90_canonical",
    metricId: "dpd90",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.074,
    numerator: 18_400_000,
    denominator: 248_600_000,
    asOf: "2026-08-04T05:30:00+08:00",
    dataFreshnessAt: "2026-08-04T05:30:00+08:00",
  },
  {
    templateId: "active_customers_canonical",
    metricId: "active_customers",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 61200,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "active_customers_logged_in_legacy",
    metricId: "active_customers",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 84000,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "logged_in_customers_canonical",
    metricId: "logged_in_customers",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 84000,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "npl_ratio_canonical",
    metricId: "npl_ratio",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.069,
    asOf: "2026-08-04T05:30:00+08:00",
    dataFreshnessAt: "2026-08-04T05:30:00+08:00",
  },
  {
    templateId: "origination_volume_canonical",
    metricId: "origination_volume",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 3862,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "average_ticket_size_canonical",
    metricId: "average_ticket_size",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 3211,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "collection_rate_canonical",
    metricId: "collection_rate",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.931,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "default_rate_canonical",
    metricId: "default_rate",
    period: "2026-01",
    country: null,
    segment: null,
    product: null,
    value: 0.041,
    asOf: "2026-08-03T06:00:00+08:00",
    dataFreshnessAt: "2026-08-03T06:00:00+08:00",
  },
  {
    templateId: "conversion_rate_canonical",
    metricId: "conversion_rate",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.62,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
  {
    templateId: "churn_rate_canonical",
    metricId: "churn_rate",
    period: "2026-07",
    country: null,
    segment: null,
    product: null,
    value: 0.028,
    asOf: "2026-08-04T06:00:00+08:00",
    dataFreshnessAt: "2026-08-04T06:00:00+08:00",
  },
];

export interface QueryParams {
  period?: string | null;
  country?: string | null;
  segment?: string | null;
  product?: string | null;
}

function scoreObservation(
  observation: TrustedObservation,
  params: QueryParams,
): number {
  let score = 0;
  if (params.period && observation.period === params.period) score += 8;
  if ((params.country ?? null) === (observation.country ?? null)) score += 5;
  else if (!params.country && observation.country == null) score += 3;
  if ((params.segment ?? null) === (observation.segment ?? null)) score += 2;
  if ((params.product ?? null) === (observation.product ?? null)) score += 1;
  return score;
}

export function runTemplate(
  templateId: string,
  params: QueryParams,
): TrustedObservation | null {
  const template = queryTemplates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`Unregistered query template: ${templateId}`);
  }
  const matches = trustedObservations.filter(
    (observation) => observation.templateId === templateId,
  );
  if (matches.length === 0) return null;
  const ranked = [...matches].sort(
    (a, b) => scoreObservation(b, params) - scoreObservation(a, params),
  );
  const best = ranked[0];
  if (params.period && best.period !== params.period) return null;
  if (params.country && best.country && best.country !== params.country) return null;
  return best;
}

export function canonicalObservation(
  metricId: string,
  params: QueryParams,
): TrustedObservation | null {
  const template = queryTemplates.find(
    (item) => item.metricId === metricId && item.isCanonical,
  );
  if (!template) return null;
  return runTemplate(template.id, params);
}

export function alternativeObservations(
  metricId: string,
  params: QueryParams,
): Array<{ template: QueryTemplate; observation: TrustedObservation | null }> {
  return queryTemplates
    .filter((template) => template.metricId === metricId)
    .map((template) => ({
      template,
      observation: runTemplate(template.id, params),
    }));
}

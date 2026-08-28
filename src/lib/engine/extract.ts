import { metrics } from "@/lib/data/catalogue";
import { findPersonByName } from "@/lib/data/people";
import type {
  ClaimKind,
  ExtractedClaim,
  Metric,
  MetricUnit,
  ParsedTurn,
} from "@/lib/types";

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const UNCERTAIN = /\b(think|around|about|roughly|maybe|approximately|probably|guess)\b/i;
const DIRECTION_DOWN = /\b(dropped|fell|decreased|declined|down)\b/i;
const DIRECTION_UP = /\b(increased|rose|up|improved)\b/i;
const SOURCE =
  /\b(dashboard|spreadsheet|tracker|deck|pack|workbook|finance tracker|credit ops dashboard|weekly tracker|official dashboard)\b/i;
const DEFINITION =
  /\b(we define|defined as|we count|divided by|denominator|meaning|means)\b/i;
const PRONOUN_VALUE = /\b(it|that|the (?:rate|number|figure|dashboard))\b/i;

interface AliasEntry {
  alias: string;
  metric: Metric;
  confidence: number;
}

const aliasIndex: AliasEntry[] = metrics
  .flatMap((metric) =>
    metric.aliases.map((alias) => ({
      alias: alias.alias.toLowerCase(),
      metric,
      confidence: alias.confidence,
    })),
  )
  .sort((a, b) => b.alias.length - a.alias.length);

export function parseTurns(transcript: string): ParsedTurn[] {
  const lines = transcript
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const turns: ParsedTurn[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:\[([^\]]+)\]\s*)?([^:]{1,120}):\s*(.*)$/);
    if (!match) {
      if (turns.length > 0) {
        turns[turns.length - 1].text += ` ${line}`;
      }
      continue;
    }
    const [, timestamp, rawSpeaker, text] = match;
    const speakerMatch = rawSpeaker.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const speakerName = (speakerMatch?.[1] ?? rawSpeaker).trim();
    const team = speakerMatch?.[2]?.split(",")[0]?.trim();
    const person = findPersonByName(speakerName) ?? (team ? findPersonByName(team) : undefined);
    turns.push({
      index: turns.length,
      timestamp,
      speakerId: person?.id ?? null,
      speakerName: person?.name ?? speakerName,
      team: person?.team ?? team,
      text: text.trim(),
    });
  }
  return turns;
}

function monthFromConversation(startedAt: string): { year: number; month: number } {
  const date = new Date(startedAt);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parsePeriod(text: string, startedAt: string): string | null {
  const lower = text.toLowerCase();
  const { year, month } = monthFromConversation(startedAt);

  if (/\blast month\b/.test(lower) || /\bprevious (?:calendar )?month\b/.test(lower)) {
    const prior = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    return `${prior.year}-${pad(prior.month)}`;
  }
  if (/\btrailing[- ]?30[- ]?day|\blast 30 days\b/.test(lower)) {
    return "trailing_30_days";
  }

  for (const [name, monthNumber] of Object.entries(MONTHS)) {
    const regex = new RegExp(`\\b${name}\\b`, "i");
    if (regex.test(lower)) {
      const yearMatch = lower.match(new RegExp(`${name}\\s+(20\\d{2})`, "i"));
      const resolvedYear = yearMatch ? Number(yearMatch[1]) : year;
      return `${resolvedYear}-${pad(monthNumber)}`;
    }
  }
  return null;
}

function parseCountry(text: string): string | null {
  const lower = text.toLowerCase();
  const named: Array<[RegExp, string]> = [
    [/\bmalaysia'?s\b|\bfor malaysia\b|\bin malaysia\b|\bmalaysia (?:approval|rate|book|credit|retail|disbursement)/i, "MY"],
    [/\bsingapore'?s\b|\bfor singapore\b|\bin singapore\b|\bsingapore (?:approval|rate|book|credit|retail|disbursement)/i, "SG"],
    [/\bindonesia'?s\b|\bfor indonesia\b|\bin indonesia\b/i, "ID"],
    [/\bthailand'?s\b|\bfor thailand\b|\bin thailand\b/i, "TH"],
  ];
  for (const [pattern, code] of named) {
    if (pattern.test(lower)) return code;
  }
  const iso = text.match(/\b(MY|SG|ID|TH|PH)\b/);
  return iso ? iso[1] : null;
}

function parseSegment(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\bretail only\b|\bretail\b/.test(lower)) return "retail";
  if (/\bqualified leads?\b/.test(lower)) return "qualified_leads";
  if (/\bsme\b/.test(lower)) return "sme";
  return null;
}

function parseDirection(text: string): ExtractedClaim["direction"] {
  if (DIRECTION_DOWN.test(text)) return "decreased";
  if (DIRECTION_UP.test(text)) return "increased";
  return null;
}

function parseSource(text: string): string | null {
  const match = text.match(SOURCE);
  return match ? match[0].toLowerCase() : null;
}

function findMetric(text: string, team?: string): { metric: Metric; phrase: string; confidence: number } | null {
  const lower = text.toLowerCase();
  const matches = aliasIndex.filter((entry) => lower.includes(entry.alias));
  if (matches.length === 0) return null;
  const scored = matches.map((entry) => {
    let score = entry.confidence + entry.alias.length / 100;
    if (team && entry.metric.aliases.some((alias) => alias.team === team && alias.alias === entry.alias)) {
      score += 0.08;
    }
    return { entry, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].entry;
  return { metric: best.metric, phrase: best.alias, confidence: best.confidence };
}

interface NumericHit {
  value: number;
  unit: MetricUnit;
  currency: string | null;
  raw: string;
}

function extractNumbers(text: string): NumericHit[] {
  const hits: NumericHit[] = [];
  const seen = new Set<string>();

  const consider = (hit: NumericHit, index: number) => {
    const key = `${hit.unit}:${hit.value}:${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(%|percent)/gi)) {
    consider(
      {
        value: Number(match[1]) / 100,
        unit: "rate",
        currency: null,
        raw: match[0],
      },
      match.index ?? 0,
    );
  }

  for (const match of text.matchAll(
    /\$\s*(\d+(?:\.\d+)?)\s*(million|billion|m|bn|k)\b/gi,
  )) {
    const amount = Number(match[1]);
    const suffix = match[2].toLowerCase();
    const multiplier =
      suffix === "billion" || suffix === "bn"
        ? 1_000_000_000
        : suffix === "k"
          ? 1_000
          : 1_000_000;
    consider(
      {
        value: amount * multiplier,
        unit: "currency",
        currency: "USD",
        raw: match[0],
      },
      match.index ?? 0,
    );
  }

  for (const match of text.matchAll(/\b(\d{1,3}(?:,\d{3})+)(?:\.\d+)?\b/g)) {
    consider(
      {
        value: Number(match[1].replaceAll(",", "")),
        unit: "count",
        currency: null,
        raw: match[0],
      },
      match.index ?? 0,
    );
  }

  const unique: NumericHit[] = [];
  for (const hit of hits) {
    if (unique.some((item) => item.unit === hit.unit && Math.abs(item.value - hit.value) < 1e-9)) {
      continue;
    }
    unique.push(hit);
  }
  return unique;
}

function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (/^(what was|what is|why did|which |can we|please tell)\b/i.test(trimmed)) {
    return !/\b(was|is|showed|had)\s+\d/i.test(trimmed);
  }
  return /^(what|why|which|can we|please)\b/i.test(trimmed) && trimmed.endsWith("?");
}

function claimKind(text: string, hasValue: boolean, hasDefinition: boolean): ClaimKind {
  if (hasDefinition) return "definition";
  if (SOURCE.test(text) && hasValue) return "source";
  if (UNCERTAIN.test(text) && hasValue) return "confidence";
  if (PRONOUN_VALUE.test(text) && hasValue && !findMetric(text)) return "contextual";
  if (hasValue) return "explicit";
  return "definition";
}

export interface ExtractionContext {
  conversationId: string;
  startedAt: string;
}

export function extractClaims(
  transcript: string,
  context: ExtractionContext,
): { turns: ParsedTurn[]; claims: ExtractedClaim[] } {
  const turns = parseTurns(transcript);
  const claims: ExtractedClaim[] = [];

  let lastMetric: Metric | null = null;
  let lastPeriod: string | null = null;
  let lastCountry: string | null = null;
  let lastUnit: MetricUnit | null = null;

  for (const turn of turns) {
    const text = turn.text;
    if (isQuestion(text) && !extractNumbers(text).length) continue;

    const metricHit = findMetric(text, turn.team);
    const parsedPeriod: string | null = parsePeriod(text, context.startedAt);
    const parsedCountry: string | null = parseCountry(text);
    const period: string | null = parsedPeriod ?? lastPeriod;
    const country: string | null = parsedCountry ?? lastCountry;
    const segment = parseSegment(text);
    const numbers = extractNumbers(text);
    const definition = DEFINITION.test(text);
    const sourceMentioned = parseSource(text);
    const uncertain = UNCERTAIN.test(text);
    const direction = parseDirection(text);

    if (metricHit) {
      lastMetric = metricHit.metric;
      lastUnit = metricHit.metric.unit;
    }
    if (parsedPeriod) lastPeriod = parsedPeriod;
    if (parsedCountry) lastCountry = parsedCountry;
    if (numbers[0]) lastUnit = numbers[0].unit;

    const metric = metricHit?.metric ?? lastMetric;
    const unitFromMetric = metric?.unit ?? lastUnit;

    const relevantNumbers = numbers.filter((hit) => {
      if (!unitFromMetric) return true;
      if (unitFromMetric === "rate" || unitFromMetric === "ratio") return hit.unit === "rate";
      if (unitFromMetric === "currency") return hit.unit === "currency";
      if (unitFromMetric === "count") return hit.unit === "count";
      return true;
    });

    const values = relevantNumbers.length > 0 ? relevantNumbers : numbers;
    const shouldEmitDefinition = definition && values.length === 0;
    const emitValues = values.length > 0 ? values : shouldEmitDefinition ? [null] : [];

    if (
      emitValues.length === 0 &&
      sourceMentioned &&
      metric &&
      lastMetric
    ) {
      continue;
    }

    for (const hit of emitValues) {
      const quotedValue = hit?.value ?? null;
      const unit = hit?.unit ?? metric?.unit ?? null;
      const kind = claimKind(text, quotedValue != null, definition && quotedValue == null);
      if (quotedValue == null && !definition && !sourceMentioned) continue;

      const assumptions: string[] = [];
      if (!metricHit && metric) {
        assumptions.push(
          `Metric inferred from earlier turns as ${metric.canonicalName}.`,
        );
      }
      if (!parsePeriod(text, context.startedAt) && period) {
        assumptions.push(`Period inferred as ${period} from conversation context.`);
      }
      if (!parseCountry(text) && country) {
        assumptions.push(`Geography inferred as ${country} from conversation context.`);
      }
      if (uncertain) {
        assumptions.push("Uncertain language reduced extraction confidence.");
      }

      let extractionConfidence = 0.5;
      if (quotedValue != null) extractionConfidence += 0.25;
      if (metricHit) extractionConfidence += 0.15;
      else if (metric) extractionConfidence += 0.05;
      if (period) extractionConfidence += 0.05;
      if (uncertain) extractionConfidence -= 0.18;
      if (kind === "contextual") extractionConfidence -= 0.05;
      extractionConfidence = Math.max(0.2, Math.min(0.98, extractionConfidence));

      let resolutionConfidence = metricHit ? metricHit.confidence : metric ? 0.62 : 0.2;
      if (kind === "contextual") resolutionConfidence -= 0.08;
      resolutionConfidence = Math.max(0.15, Math.min(0.98, resolutionConfidence));

      claims.push({
        id: `${context.conversationId}_c${claims.length + 1}`,
        conversationId: context.conversationId,
        turnIndex: turn.index,
        speakerId: turn.speakerId,
        speakerName: turn.speakerName,
        team: turn.team,
        textExcerpt: text,
        kind,
        metricId: metric?.id ?? null,
        metricPhrase: metricHit?.phrase ?? (metric ? metric.canonicalName.toLowerCase() : null),
        quotedValue,
        unit,
        currency: hit?.currency ?? metric?.currency ?? null,
        period,
        periodStart: period && /^\d{4}-\d{2}$/.test(period) ? `${period}-01` : null,
        periodEnd: period && /^\d{4}-\d{2}$/.test(period) ? `${period}-28` : null,
        country,
        segment,
        product: null,
        direction,
        sourceMentioned,
        definitionText: definition ? text : null,
        uncertainLanguage: uncertain,
        extractionConfidence,
        resolutionConfidence,
        assumptions,
      });
    }
  }

  return { turns, claims };
}

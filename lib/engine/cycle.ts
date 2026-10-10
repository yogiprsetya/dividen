import type { StockbitDividendRow } from "../parser/types";
import type {
  DividendCycle,
  HistoricalDividendRecord,
} from "./types";

/**
 * Calculates median value of an array of numbers.
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Pads a single-digit number with leading zero.
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Formats year, month, and day into YYYY-MM-DD, clamping day to month length.
 */
function formatIsoDate(year: number, month: number, day: number): string {
  // Clamp day to valid month length in non-leap / leap year
  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(Math.max(1, day), daysInMonth);
  return `${year}-${padZero(month)}-${padZero(clampedDay)}`;
}

/**
 * Normalizes an input date (string or Date) into YYYY-MM-DD.
 */
function normalizeDateInput(date?: string | Date): string {
  if (!date) {
    const now = new Date();
    return formatIsoDate(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
  }
  if (typeof date === "string") {
    return date.slice(0, 10);
  }
  return formatIsoDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
}

/**
 * Calculates median month and day offset from an array of ISO date strings.
 */
export function calculateMedianDateOffset(dates: string[]): {
  month: number;
  day: number;
} {
  if (dates.length === 0) {
    return { month: 1, day: 1 };
  }

  const months = dates.map((d) => parseInt(d.slice(5, 7), 10));
  const days = dates.map((d) => parseInt(d.slice(8, 10), 10));

  const medianMonth = calculateMedian(months);
  const medianDay = calculateMedian(days);

  return { month: medianMonth, day: medianDay };
}

interface DividendSeries {
  type: "FINAL" | "INTERIM" | "UNKNOWN";
  medianMonth: number;
  medianDay: number;
  records: StockbitDividendRow[];
}

/**
 * Groups historical dividend records by dividend distribution type and clusters.
 */
function groupIntoSeries(records: StockbitDividendRow[]): DividendSeries[] {
  if (records.length === 0) return [];

  const finalRecords: StockbitDividendRow[] = [];
  const interimRecords: StockbitDividendRow[] = [];
  const unknownRecords: StockbitDividendRow[] = [];

  for (const r of records) {
    if (r.dividendType === "FINAL") {
      finalRecords.push(r);
    } else if (r.dividendType === "INTERIM") {
      interimRecords.push(r);
    } else {
      unknownRecords.push(r);
    }
  }

  const seriesList: DividendSeries[] = [];

  if (finalRecords.length > 0) {
    const offset = calculateMedianDateOffset(finalRecords.map((r) => r.cumDate));
    seriesList.push({
      type: "FINAL",
      medianMonth: offset.month,
      medianDay: offset.day,
      records: finalRecords,
    });
  }

  if (interimRecords.length > 0) {
    // Check if there are multiple interim clusters (e.g. Interim 1 in Sep, Interim 2 in Nov)
    const monthGroups = new Map<number, StockbitDividendRow[]>();
    for (const r of interimRecords) {
      const month = parseInt(r.cumDate.slice(5, 7), 10);
      const existing = monthGroups.get(month) || [];
      existing.push(r);
      monthGroups.set(month, existing);
    }

    if (monthGroups.size > 1 && interimRecords.length >= 4) {
      // Multiple distinct interim months
      for (const group of monthGroups.values()) {
        const offset = calculateMedianDateOffset(group.map((r) => r.cumDate));
        seriesList.push({
          type: "INTERIM",
          medianMonth: offset.month,
          medianDay: offset.day,
          records: group,
        });
      }
    } else {
      const offset = calculateMedianDateOffset(interimRecords.map((r) => r.cumDate));
      seriesList.push({
        type: "INTERIM",
        medianMonth: offset.month,
        medianDay: offset.day,
        records: interimRecords,
      });
    }
  }

  if (unknownRecords.length > 0) {
    // If we only have unknown records or mixed, cluster by month
    const monthGroups = new Map<number, StockbitDividendRow[]>();
    for (const r of unknownRecords) {
      const month = parseInt(r.cumDate.slice(5, 7), 10);
      const existing = monthGroups.get(month) || [];
      existing.push(r);
      monthGroups.set(month, existing);
    }

    for (const group of monthGroups.values()) {
      const offset = calculateMedianDateOffset(group.map((r) => r.cumDate));
      seriesList.push({
        type: "UNKNOWN",
        medianMonth: offset.month,
        medianDay: offset.day,
        records: group,
      });
    }
  }

  return seriesList;
}

/**
 * Projects next estimated Cum Date for a series of historical dividend records.
 */
export function estimateNextCumDate(
  records: StockbitDividendRow[],
  asOfDateInput?: string | Date
): string | undefined {
  if (records.length === 0) return undefined;

  const asOfDateStr = normalizeDateInput(asOfDateInput);
  const asOfYear = parseInt(asOfDateStr.slice(0, 4), 10);
  const seriesList = groupIntoSeries(records);

  if (seriesList.length === 0) return undefined;

  const candidateDates: string[] = [];

  for (const series of seriesList) {
    // Try candidate in current year
    const thisYearCandidate = formatIsoDate(
      asOfYear,
      series.medianMonth,
      series.medianDay
    );

    if (thisYearCandidate >= asOfDateStr) {
      candidateDates.push(thisYearCandidate);
    } else {
      // If already passed this year, project to next year
      const nextYearCandidate = formatIsoDate(
        asOfYear + 1,
        series.medianMonth,
        series.medianDay
      );
      candidateDates.push(nextYearCandidate);
    }
  }

  // Sort candidate dates ascending and pick the earliest upcoming date
  candidateDates.sort();
  return candidateDates[0];
}

/**
 * Classifies the historical payment frequency of a ticker.
 */
function classifyFrequency(
  records: StockbitDividendRow[]
): "ANNUAL" | "SEMI_ANNUAL" | "IRREGULAR" {
  if (records.length === 0) return "IRREGULAR";
  if (records.length === 1) return "ANNUAL";

  // Group payments by calendar year
  const yearCounts = new Map<number, number>();
  for (const r of records) {
    const year = r.year || parseInt(r.cumDate.slice(0, 4), 10);
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
  }

  const counts = Array.from(yearCounts.values());
  const avgPaymentsPerYear =
    counts.reduce((sum, c) => sum + c, 0) / counts.length;

  const years = Array.from(yearCounts.keys()).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const yearSpan = maxYear - minYear + 1;

  // If there are skipped years between first and last recorded year
  if (yearSpan > counts.length) {
    return "IRREGULAR";
  }

  if (avgPaymentsPerYear >= 1.7 && avgPaymentsPerYear <= 2.3) {
    return "SEMI_ANNUAL";
  }

  if (avgPaymentsPerYear >= 0.8 && avgPaymentsPerYear <= 1.3) {
    return "ANNUAL";
  }

  return "IRREGULAR";
}

/**
 * Calculates a confidence score (0-100) based on data density and regularity.
 */
function calculateConfidenceScore(
  records: StockbitDividendRow[],
  frequency: "ANNUAL" | "SEMI_ANNUAL" | "IRREGULAR"
): number {
  if (records.length === 0) return 0;
  if (records.length === 1) return 40;

  const uniqueYears = new Set(
    records.map((r) => r.year || parseInt(r.cumDate.slice(0, 4), 10))
  );
  const yearCount = uniqueYears.size;

  let score = 40;
  if (yearCount >= 4) {
    score = 90;
  } else if (yearCount === 3) {
    score = 80;
  } else if (yearCount === 2) {
    score = 65;
  }

  if (frequency === "IRREGULAR") {
    score = Math.min(score, 50);
  } else if (frequency === "SEMI_ANNUAL" || frequency === "ANNUAL") {
    score += 5;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Detects dividend cycle characteristics for a single ticker.
 */
export function detectCycleForTicker(
  ticker: string,
  allRecords: StockbitDividendRow[],
  asOfDate?: string | Date
): DividendCycle {
  const records = allRecords
    .filter((r) => {
      const sym = r.ticker;
      return sym && sym.toUpperCase() === ticker.toUpperCase();
    })
    .sort((a, b) => a.cumDate.localeCompare(b.cumDate));

  const historicalDividends: HistoricalDividendRecord[] = records.map((r) => ({
    year: r.year || parseInt(r.cumDate.slice(0, 4), 10),
    cumDate: r.cumDate,
    dividendPerShare: r.dividendPerShare,
    yieldPercent: r.yieldPercent,
    dividendType: r.dividendType,
  }));

  const frequency = classifyFrequency(records);
  const confidenceScore = calculateConfidenceScore(records, frequency);

  const seriesList = groupIntoSeries(records);
  const typicalMonths = Array.from(
    new Set(seriesList.map((s) => s.medianMonth))
  ).sort((a, b) => a - b);

  // If typicalMonths is empty but we have records, extract months directly
  if (typicalMonths.length === 0 && records.length > 0) {
    for (const r of records) {
      const m = parseInt(r.cumDate.slice(5, 7), 10);
      if (!typicalMonths.includes(m)) typicalMonths.push(m);
    }
    typicalMonths.sort((a, b) => a - b);
  }

  const estimatedNextCumDate = estimateNextCumDate(records, asOfDate);

  return {
    ticker,
    frequency,
    typicalMonths,
    historicalDividends,
    estimatedNextCumDate,
    confidenceScore,
  };
}

/**
 * Detects dividend cycles for all unique tickers in a dataset.
 */
export function detectDividendCycles(
  records: StockbitDividendRow[],
  asOfDate?: string | Date
): DividendCycle[] {
  if (records.length === 0) return [];

  const tickerMap = new Map<string, StockbitDividendRow[]>();
  for (const r of records) {
    const symbol = (r.ticker || "").toUpperCase();
    if (!symbol) continue;
    const existing = tickerMap.get(symbol) || [];
    existing.push(r);
    tickerMap.set(symbol, existing);
  }

  const cycles: DividendCycle[] = [];
  for (const [ticker, tickerRecords] of tickerMap.entries()) {
    cycles.push(detectCycleForTicker(ticker, tickerRecords, asOfDate));
  }

  return cycles.sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/**
 * Status indicator for how close a stock is to its estimated Buy Window or Cum Date.
 */
export type WindowStatus = "OPTIMAL" | "APPROACHING" | "LATE" | "OFF_CYCLE";

/**
 * Historical dividend record summary within a cycle.
 */
export interface HistoricalDividendRecord {
  year: number;
  cumDate: string; // YYYY-MM-DD
  dividendPerShare: number;
  yieldPercent: number;
  dividendType: "INTERIM" | "FINAL" | "UNKNOWN";
}

/**
 * Detected historical dividend cycle for an IDX ticker.
 */
export interface DividendCycle {
  ticker: string;
  frequency: "ANNUAL" | "SEMI_ANNUAL" | "IRREGULAR";
  typicalMonths: number[]; // 1-12
  historicalDividends: HistoricalDividendRecord[];
  estimatedNextCumDate?: string; // YYYY-MM-DD
  confidenceScore: number; // 0-100
}

/**
 * Radar screener opportunity row surfaced for retail investors.
 */
export interface RadarOpportunity {
  ticker: string;
  companyName: string;
  currentPrice: number;
  estimatedNextCumDate: string; // YYYY-MM-DD
  estimatedYield: number; // percentage, e.g. 5.2
  estimatedDividendPerShare: number; // in IDR
  windowStatus: WindowStatus;
  daysToCumDate: number;
  daysToWindowStart: number;
  historicalConsistency: number; // 0-100 score
  typicalMonth: number; // 1-12
  history: HistoricalDividendRecord[];
}

/**
 * Filter options for the radar screener table.
 */
export interface FilterOptions {
  minYield: number;
  targetMonth: number | "ALL";
  status: WindowStatus | "ALL";
  searchQuery: string;
  sortBy: "yield" | "daysToCumDate" | "ticker" | "consistency";
  sortDirection: "asc" | "desc";
}

/**
 * Summary statistics for the dashboard.
 */
export interface SummaryStats {
  totalTracked: number;
  optimalCount: number;
  approachingCount: number;
  averageYield: number;
  topOpportunity?: RadarOpportunity;
}

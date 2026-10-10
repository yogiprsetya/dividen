import type { StockbitDividendRow } from "../parser/types";
import type {
  DividendCycle,
  FilterOptions,
  HistoricalDividendRecord,
  RadarOpportunity,
  SummaryStats,
  WindowStatus,
} from "./types";

/**
 * Classifies the buy window status based on calendar days remaining until estimated Cum Date.
 * - OPTIMAL (IN_WINDOW): 60–90 days (2–3 months) before estimated Cum Date.
 * - APPROACHING: 91–120 days (3–4 months) before estimated Cum Date.
 * - LATE: < 60 days before estimated Cum Date (risk of run-up or post-ex date).
 * - OFF_CYCLE: > 120 days before estimated Cum Date.
 */
export function classifyWindowStatus(daysToCumDate: number): WindowStatus {
  if (daysToCumDate >= 60 && daysToCumDate <= 90) {
    return "OPTIMAL";
  }
  if (daysToCumDate > 90 && daysToCumDate <= 120) {
    return "APPROACHING";
  }
  if (daysToCumDate < 60) {
    return "LATE";
  }
  return "OFF_CYCLE";
}

/**
 * Calculates calendar day difference between a reference date and a target YYYY-MM-DD date.
 */
export function calculateDaysDifference(
  fromDate: Date,
  targetDateStr: string,
): number {
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const from = new Date(
    Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate(),
    ),
  );
  const diffMs = target.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generates RadarOpportunity items by joining DividendCycle projections with latest stock details.
 */
export function generateRadarOpportunities(
  cycles: DividendCycle[],
  rawRows: StockbitDividendRow[],
  currentDate: Date = new Date(),
): RadarOpportunity[] {
  // Map ticker to latest available company info & latest stock price
  const tickerMap = new Map<
    string,
    {
      companyName: string;
      latestPrice: number;
      history: HistoricalDividendRecord[];
    }
  >();

  for (const row of rawRows) {
    const existing = tickerMap.get(row.ticker);
    const histRecord: HistoricalDividendRecord = {
      year: parseInt(row.cumDate.slice(0, 4), 10),
      cumDate: row.cumDate,
      dividendPerShare: row.dividendPerShare,
      yieldPercent: row.yieldPercent,
      dividendType:
        row.dividendType === "INTERIM"
          ? "INTERIM"
          : row.dividendType === "FINAL"
            ? "FINAL"
            : "UNKNOWN",
    };

    if (!existing) {
      tickerMap.set(row.ticker, {
        companyName: row.companyName || row.ticker,
        latestPrice: row.price || 0,
        history: [histRecord],
      });
    } else {
      existing.history.push(histRecord);
      if (!existing.latestPrice && row.price) {
        existing.latestPrice = row.price;
      }
      if (!existing.companyName && row.companyName) {
        existing.companyName = row.companyName;
      }
    }
  }

  const opportunities: RadarOpportunity[] = [];

  for (const cycle of cycles) {
    if (!cycle.estimatedNextCumDate) continue;

    const info = tickerMap.get(cycle.ticker);
    const companyName = info?.companyName || cycle.ticker;
    const history = info?.history || cycle.historicalDividends;

    const daysToCumDate = calculateDaysDifference(
      currentDate,
      cycle.estimatedNextCumDate,
    );
    const windowStatus = classifyWindowStatus(daysToCumDate);
    const daysToWindowStart = Math.max(0, daysToCumDate - 90);

    // Calculate estimated yield and estimated dividend per share based on latest historical data
    let estimatedYield = 0;
    let estimatedDividendPerShare = 0;

    if (history.length > 0) {
      // Sort history descending by date
      const sortedHistory = [...history].sort((a, b) =>
        b.cumDate.localeCompare(a.cumDate),
      );
      const latestHist = sortedHistory[0];
      estimatedYield = latestHist.yieldPercent;
      estimatedDividendPerShare = latestHist.dividendPerShare;
    }

    const nextCumDateMonth = parseInt(
      cycle.estimatedNextCumDate.slice(5, 7),
      10,
    );
    const typicalMonth =
      cycle.typicalMonths.length > 0
        ? cycle.typicalMonths[0]
        : nextCumDateMonth;

    opportunities.push({
      ticker: cycle.ticker,
      companyName,
      currentPrice: info?.latestPrice || 0,
      estimatedNextCumDate: cycle.estimatedNextCumDate,
      estimatedYield,
      estimatedDividendPerShare,
      windowStatus,
      daysToCumDate,
      daysToWindowStart,
      historicalConsistency: cycle.confidenceScore,
      typicalMonth,
      history,
    });
  }

  return opportunities;
}

/**
 * Filters opportunities according to specified filter criteria.
 */
export function filterRadarOpportunities(
  opportunities: RadarOpportunity[],
  filters: FilterOptions,
): RadarOpportunity[] {
  return opportunities.filter((opp) => {
    // Minimum Yield Filter
    if (opp.estimatedYield < filters.minYield) {
      return false;
    }

    // Target Accumulation Month Filter
    if (filters.targetMonth !== "ALL") {
      if (opp.typicalMonth !== filters.targetMonth) {
        return false;
      }
    }

    // Window Status Filter
    if (filters.status !== "ALL") {
      if (opp.windowStatus !== filters.status) {
        return false;
      }
    }

    // Search Query Filter (ticker or company name)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchesTicker = opp.ticker.toLowerCase().includes(q);
      const matchesCompany = opp.companyName.toLowerCase().includes(q);
      if (!matchesTicker && !matchesCompany) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sorter for radar opportunities supporting multiple columns and directions.
 */
export function sortRadarOpportunities(
  opportunities: RadarOpportunity[],
  sortBy: FilterOptions["sortBy"],
  sortDirection: FilterOptions["sortDirection"],
): RadarOpportunity[] {
  const multiplier = sortDirection === "asc" ? 1 : -1;

  return [...opportunities].sort((a, b) => {
    switch (sortBy) {
      case "yield":
        return (a.estimatedYield - b.estimatedYield) * multiplier;
      case "daysToCumDate":
        return (a.daysToCumDate - b.daysToCumDate) * multiplier;
      case "ticker":
        return a.ticker.localeCompare(b.ticker) * multiplier;
      case "consistency":
        return (a.historicalConsistency - b.historicalConsistency) * multiplier;
      default:
        return 0;
    }
  });
}

/**
 * Computes dashboard aggregate summary statistics for the opportunities list.
 */
export function calculateSummaryStats(
  opportunities: RadarOpportunity[],
): SummaryStats {
  if (opportunities.length === 0) {
    return {
      totalTracked: 0,
      optimalCount: 0,
      approachingCount: 0,
      averageYield: 0,
      topOpportunity: undefined,
    };
  }

  let totalYield = 0;
  let optimalCount = 0;
  let approachingCount = 0;
  let topOpportunity: RadarOpportunity | undefined = opportunities[0];

  for (const opp of opportunities) {
    totalYield += opp.estimatedYield;
    if (opp.windowStatus === "OPTIMAL") {
      optimalCount += 1;
    } else if (opp.windowStatus === "APPROACHING") {
      approachingCount += 1;
    }

    if (!topOpportunity || opp.estimatedYield > topOpportunity.estimatedYield) {
      topOpportunity = opp;
    }
  }

  const averageYield = totalYield / opportunities.length;

  return {
    totalTracked: opportunities.length,
    optimalCount,
    approachingCount,
    averageYield,
    topOpportunity,
  };
}

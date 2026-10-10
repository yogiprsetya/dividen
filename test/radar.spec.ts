import { describe, it, expect } from "vitest";
import {
  classifyWindowStatus,
  calculateDaysDifference,
  generateRadarOpportunities,
  filterRadarOpportunities,
  sortRadarOpportunities,
  calculateSummaryStats,
} from "../lib/engine/radar";
import { detectDividendCycles } from "../lib/engine/cycle";
import { loadSampleDividendData } from "../lib/parser/sample-data";
import type { RadarOpportunity, FilterOptions } from "../lib/engine/types";

describe("Buy Window Classifier", () => {
  it("classifies 60-90 days before Cum Date as OPTIMAL (IN_WINDOW)", () => {
    expect(classifyWindowStatus(60)).toBe("OPTIMAL");
    expect(classifyWindowStatus(75)).toBe("OPTIMAL");
    expect(classifyWindowStatus(90)).toBe("OPTIMAL");
  });

  it("classifies 91-120 days before Cum Date as APPROACHING", () => {
    expect(classifyWindowStatus(91)).toBe("APPROACHING");
    expect(classifyWindowStatus(105)).toBe("APPROACHING");
    expect(classifyWindowStatus(120)).toBe("APPROACHING");
  });

  it("classifies < 60 days before Cum Date as LATE", () => {
    expect(classifyWindowStatus(59)).toBe("LATE");
    expect(classifyWindowStatus(30)).toBe("LATE");
    expect(classifyWindowStatus(0)).toBe("LATE");
    expect(classifyWindowStatus(-5)).toBe("LATE");
  });

  it("classifies > 120 days before Cum Date as OFF_CYCLE", () => {
    expect(classifyWindowStatus(121)).toBe("OFF_CYCLE");
    expect(classifyWindowStatus(180)).toBe("OFF_CYCLE");
    expect(classifyWindowStatus(300)).toBe("OFF_CYCLE");
  });

  it("calculates exact calendar day difference correctly", () => {
    const fromDate = new Date("2025-01-01T00:00:00Z");
    const targetDate = "2025-03-12"; // 70 days difference in non-leap year Jan (31) + Feb (28) + 11 = 70
    const days = calculateDaysDifference(fromDate, targetDate);
    expect(days).toBe(70);
  });
});

describe("Radar Screener Opportunities Generation", () => {
  it("generates structured RadarOpportunity objects from detected cycles and raw data", () => {
    const rawRows = loadSampleDividendData();
    const cycles = detectDividendCycles(rawRows);

    // Fixed reference date: 2025-01-15
    const refDate = new Date("2025-01-15T00:00:00Z");
    const opportunities = generateRadarOpportunities(cycles, rawRows, refDate);

    expect(opportunities.length).toBeGreaterThan(0);
    for (const opp of opportunities) {
      expect(opp.ticker).toBeDefined();
      expect(opp.companyName).toBeDefined();
      expect(opp.estimatedNextCumDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(opp.windowStatus).toMatch(
        /^(OPTIMAL|APPROACHING|LATE|OFF_CYCLE)$/,
      );
      expect(typeof opp.daysToCumDate).toBe("number");
      expect(typeof opp.estimatedYield).toBe("number");
      expect(typeof opp.historicalConsistency).toBe("number");
      expect(opp.history.length).toBeGreaterThan(0);
    }
  });
});

describe("Screener Filtering Pipeline", () => {
  const mockOpportunities: RadarOpportunity[] = [
    {
      ticker: "BBCA",
      companyName: "Bank Central Asia Tbk",
      currentPrice: 9500,
      estimatedNextCumDate: "2025-03-25",
      estimatedYield: 3.5,
      estimatedDividendPerShare: 332.5,
      windowStatus: "OPTIMAL",
      daysToCumDate: 70,
      daysToWindowStart: 0,
      historicalConsistency: 95,
      typicalMonth: 3,
      history: [],
    },
    {
      ticker: "ITMG",
      companyName: "Indo Tambangraya Megah Tbk",
      currentPrice: 26000,
      estimatedNextCumDate: "2025-04-15",
      estimatedYield: 15.0,
      estimatedDividendPerShare: 3900,
      windowStatus: "APPROACHING",
      daysToCumDate: 95,
      daysToWindowStart: 5,
      historicalConsistency: 85,
      typicalMonth: 4,
      history: [],
    },
    {
      ticker: "ASII",
      companyName: "Astra International Tbk",
      currentPrice: 5100,
      estimatedNextCumDate: "2025-05-10",
      estimatedYield: 7.2,
      estimatedDividendPerShare: 367.2,
      windowStatus: "OFF_CYCLE",
      daysToCumDate: 125,
      daysToWindowStart: 35,
      historicalConsistency: 90,
      typicalMonth: 5,
      history: [],
    },
    {
      ticker: "BBRI",
      companyName: "Bank Rakyat Indonesia (Persero) Tbk",
      currentPrice: 4800,
      estimatedNextCumDate: "2025-01-20",
      estimatedYield: 6.0,
      estimatedDividendPerShare: 288,
      windowStatus: "LATE",
      daysToCumDate: 10,
      daysToWindowStart: 0,
      historicalConsistency: 92,
      typicalMonth: 1,
      history: [],
    },
  ];

  it("filters by minimum yield %", () => {
    const options: FilterOptions = {
      minYield: 7.0,
      targetMonth: "ALL",
      status: "ALL",
      searchQuery: "",
      sortBy: "yield",
      sortDirection: "desc",
    };
    const result = filterRadarOpportunities(mockOpportunities, options);
    expect(result.map((r) => r.ticker)).toEqual(["ITMG", "ASII"]);
  });

  it("filters by target accumulation month", () => {
    const options: FilterOptions = {
      minYield: 0,
      targetMonth: 3,
      status: "ALL",
      searchQuery: "",
      sortBy: "yield",
      sortDirection: "desc",
    };
    const result = filterRadarOpportunities(mockOpportunities, options);
    expect(result.map((r) => r.ticker)).toEqual(["BBCA"]);
  });

  it("filters by window status", () => {
    const options: FilterOptions = {
      minYield: 0,
      targetMonth: "ALL",
      status: "OPTIMAL",
      searchQuery: "",
      sortBy: "yield",
      sortDirection: "desc",
    };
    const result = filterRadarOpportunities(mockOpportunities, options);
    expect(result.map((r) => r.ticker)).toEqual(["BBCA"]);
  });

  it("filters by ticker and company name search query (case-insensitive)", () => {
    const optionsTicker: FilterOptions = {
      minYield: 0,
      targetMonth: "ALL",
      status: "ALL",
      searchQuery: "bb",
      sortBy: "ticker",
      sortDirection: "asc",
    };
    const resultTicker = filterRadarOpportunities(
      mockOpportunities,
      optionsTicker,
    );
    expect(resultTicker.map((r) => r.ticker)).toContain("BBCA");
    expect(resultTicker.map((r) => r.ticker)).toContain("BBRI");

    const optionsName: FilterOptions = {
      minYield: 0,
      targetMonth: "ALL",
      status: "ALL",
      searchQuery: "tambangraya",
      sortBy: "ticker",
      sortDirection: "asc",
    };
    const resultName = filterRadarOpportunities(mockOpportunities, optionsName);
    expect(resultName.map((r) => r.ticker)).toEqual(["ITMG"]);
  });
});

describe("Multi-Column Sorter", () => {
  const sampleList: RadarOpportunity[] = [
    {
      ticker: "UNTR",
      companyName: "United Tractors Tbk",
      currentPrice: 24000,
      estimatedNextCumDate: "2025-04-20",
      estimatedYield: 8.5,
      estimatedDividendPerShare: 2040,
      windowStatus: "APPROACHING",
      daysToCumDate: 100,
      daysToWindowStart: 10,
      historicalConsistency: 88,
      typicalMonth: 4,
      history: [],
    },
    {
      ticker: "BBCA",
      companyName: "Bank Central Asia Tbk",
      currentPrice: 9500,
      estimatedNextCumDate: "2025-03-25",
      estimatedYield: 3.5,
      estimatedDividendPerShare: 332.5,
      windowStatus: "OPTIMAL",
      daysToCumDate: 70,
      daysToWindowStart: 0,
      historicalConsistency: 95,
      typicalMonth: 3,
      history: [],
    },
    {
      ticker: "ITMG",
      companyName: "Indo Tambangraya Megah Tbk",
      currentPrice: 26000,
      estimatedNextCumDate: "2025-04-15",
      estimatedYield: 15.0,
      estimatedDividendPerShare: 3900,
      windowStatus: "APPROACHING",
      daysToCumDate: 95,
      daysToWindowStart: 5,
      historicalConsistency: 80,
      typicalMonth: 4,
      history: [],
    },
  ];

  it("sorts by yield descending and ascending", () => {
    const desc = sortRadarOpportunities(sampleList, "yield", "desc");
    expect(desc.map((x) => x.ticker)).toEqual(["ITMG", "UNTR", "BBCA"]);

    const asc = sortRadarOpportunities(sampleList, "yield", "asc");
    expect(asc.map((x) => x.ticker)).toEqual(["BBCA", "UNTR", "ITMG"]);
  });

  it("sorts by daysToCumDate ascending and descending", () => {
    const asc = sortRadarOpportunities(sampleList, "daysToCumDate", "asc");
    expect(asc.map((x) => x.ticker)).toEqual(["BBCA", "ITMG", "UNTR"]);

    const desc = sortRadarOpportunities(sampleList, "daysToCumDate", "desc");
    expect(desc.map((x) => x.ticker)).toEqual(["UNTR", "ITMG", "BBCA"]);
  });

  it("sorts by ticker symbol ascending and descending", () => {
    const asc = sortRadarOpportunities(sampleList, "ticker", "asc");
    expect(asc.map((x) => x.ticker)).toEqual(["BBCA", "ITMG", "UNTR"]);

    const desc = sortRadarOpportunities(sampleList, "ticker", "desc");
    expect(desc.map((x) => x.ticker)).toEqual(["UNTR", "ITMG", "BBCA"]);
  });

  it("sorts by consistency score descending and ascending", () => {
    const desc = sortRadarOpportunities(sampleList, "consistency", "desc");
    expect(desc.map((x) => x.ticker)).toEqual(["BBCA", "UNTR", "ITMG"]);

    const asc = sortRadarOpportunities(sampleList, "consistency", "asc");
    expect(asc.map((x) => x.ticker)).toEqual(["ITMG", "UNTR", "BBCA"]);
  });
});

describe("Summary Stats Calculator", () => {
  const opportunities: RadarOpportunity[] = [
    {
      ticker: "BBCA",
      companyName: "Bank Central Asia Tbk",
      currentPrice: 9500,
      estimatedNextCumDate: "2025-03-25",
      estimatedYield: 4.0,
      estimatedDividendPerShare: 380,
      windowStatus: "OPTIMAL",
      daysToCumDate: 70,
      daysToWindowStart: 0,
      historicalConsistency: 95,
      typicalMonth: 3,
      history: [],
    },
    {
      ticker: "ITMG",
      companyName: "Indo Tambangraya Megah Tbk",
      currentPrice: 26000,
      estimatedNextCumDate: "2025-04-15",
      estimatedYield: 16.0,
      estimatedDividendPerShare: 4160,
      windowStatus: "APPROACHING",
      daysToCumDate: 95,
      daysToWindowStart: 5,
      historicalConsistency: 85,
      typicalMonth: 4,
      history: [],
    },
    {
      ticker: "ASII",
      companyName: "Astra International Tbk",
      currentPrice: 5100,
      estimatedNextCumDate: "2025-05-10",
      estimatedYield: 8.0,
      estimatedDividendPerShare: 408,
      windowStatus: "OPTIMAL",
      daysToCumDate: 80,
      daysToWindowStart: 0,
      historicalConsistency: 90,
      typicalMonth: 5,
      history: [],
    },
  ];

  it("calculates summary statistics correctly", () => {
    const stats = calculateSummaryStats(opportunities);
    expect(stats.totalTracked).toBe(3);
    expect(stats.optimalCount).toBe(2);
    expect(stats.approachingCount).toBe(1);
    expect(stats.averageYield).toBeCloseTo((4.0 + 16.0 + 8.0) / 3, 2);
    expect(stats.topOpportunity?.ticker).toBe("ITMG"); // Highest yield
  });

  it("handles empty opportunity list safely", () => {
    const stats = calculateSummaryStats([]);
    expect(stats.totalTracked).toBe(0);
    expect(stats.optimalCount).toBe(0);
    expect(stats.approachingCount).toBe(0);
    expect(stats.averageYield).toBe(0);
    expect(stats.topOpportunity).toBeUndefined();
  });
});

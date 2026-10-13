import { describe, it, expect } from "vitest";
import {
  detectDividendCycles,
  detectCycleForTicker,
  estimateNextCumDate,
  calculateMedianDateOffset,
} from "../lib/engine/cycle";
import { loadSampleDividendData } from "../lib/parser/sample-data";
import type { StockbitDividendRow } from "../lib/parser/types";

describe("Dividend Cycle Detection & Next Cum Date Estimator", () => {
  describe("Grouping & Frequency Classification", () => {
    it("classifies semi-annual dividend payers with Interim and Final series", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "ASII",
          cumDate: "2022-05-10",
          exDate: "2022-05-11",
          dividendPerShare: 194,
          yieldPercent: 2.64,
          price: 7350,
          dividendType: "FINAL",
          year: 2022,
        },
        {
          ticker: "ASII",
          cumDate: "2022-10-10",
          exDate: "2022-10-11",
          dividendPerShare: 88,
          yieldPercent: 1.32,
          price: 6650,
          dividendType: "INTERIM",
          year: 2022,
        },
        {
          ticker: "ASII",
          cumDate: "2023-05-08",
          exDate: "2023-05-09",
          dividendPerShare: 552,
          yieldPercent: 8.76,
          price: 6300,
          dividendType: "FINAL",
          year: 2023,
        },
        {
          ticker: "ASII",
          cumDate: "2023-10-12",
          exDate: "2023-10-13",
          dividendPerShare: 82,
          yieldPercent: 1.4,
          price: 5850,
          dividendType: "INTERIM",
          year: 2023,
        },
        {
          ticker: "ASII",
          cumDate: "2024-05-13",
          exDate: "2024-05-14",
          dividendPerShare: 421,
          yieldPercent: 8.96,
          price: 4700,
          dividendType: "FINAL",
          year: 2024,
        },
        {
          ticker: "ASII",
          cumDate: "2024-10-11",
          exDate: "2024-10-14",
          dividendPerShare: 98,
          yieldPercent: 1.89,
          price: 5175,
          dividendType: "INTERIM",
          year: 2024,
        },
      ];

      const cycle = detectCycleForTicker("ASII", records, "2024-01-01");
      expect(cycle.ticker).toBe("ASII");
      expect(cycle.frequency).toBe("SEMI_ANNUAL");
      expect(cycle.typicalMonths).toEqual(expect.arrayContaining([5, 10]));
      expect(cycle.historicalDividends).toHaveLength(6);
      expect(cycle.confidenceScore).toBeGreaterThanOrEqual(70);
    });

    it("classifies annual single-dividend payers", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "PTBA",
          cumDate: "2022-06-24",
          exDate: "2022-06-27",
          dividendPerShare: 688,
          yieldPercent: 16.0,
          price: 4300,
          dividendType: "FINAL",
          year: 2022,
        },
        {
          ticker: "PTBA",
          cumDate: "2023-06-23",
          exDate: "2023-06-26",
          dividendPerShare: 1094,
          yieldPercent: 28.79,
          price: 3800,
          dividendType: "FINAL",
          year: 2023,
        },
        {
          ticker: "PTBA",
          cumDate: "2024-06-24",
          exDate: "2024-06-25",
          dividendPerShare: 397,
          yieldPercent: 15.63,
          price: 2540,
          dividendType: "FINAL",
          year: 2024,
        },
      ];

      const cycle = detectCycleForTicker("PTBA", records, "2024-01-01");
      expect(cycle.ticker).toBe("PTBA");
      expect(cycle.frequency).toBe("ANNUAL");
      expect(cycle.typicalMonths).toEqual([6]);
      expect(cycle.confidenceScore).toBeGreaterThanOrEqual(70);
    });

    it("classifies irregular payers with erratic distribution", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "IRRG",
          cumDate: "2021-02-10",
          exDate: "2021-02-11",
          dividendPerShare: 10,
          yieldPercent: 1.0,
          price: 1000,
          dividendType: "FINAL",
          year: 2021,
        },
        {
          ticker: "IRRG",
          cumDate: "2023-11-20",
          exDate: "2023-11-21",
          dividendPerShare: 20,
          yieldPercent: 2.0,
          price: 1000,
          dividendType: "INTERIM",
          year: 2023,
        },
      ];

      const cycle = detectCycleForTicker("IRRG", records, "2024-01-01");
      expect(cycle.ticker).toBe("IRRG");
      expect(cycle.frequency).toBe("IRREGULAR");
      expect(cycle.confidenceScore).toBeLessThan(70);
    });
  });

  describe("Median Offset & Next Cum Date Estimation", () => {
    it("calculates median date offset accurately", () => {
      const dates = ["2022-05-10", "2023-05-08", "2024-05-13"];
      const median = calculateMedianDateOffset(dates);
      expect(median.month).toBe(5);
      expect(median.day).toBe(10);
    });

    it("projects next upcoming estimated Cum Date for mid-year asOfDate", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "ASII",
          cumDate: "2022-05-10",
          exDate: "2022-05-11",
          dividendPerShare: 194,
          yieldPercent: 2.64,
          price: 7350,
          dividendType: "FINAL",
          year: 2022,
        },
        {
          ticker: "ASII",
          cumDate: "2022-10-10",
          exDate: "2022-10-11",
          dividendPerShare: 88,
          yieldPercent: 1.32,
          price: 6650,
          dividendType: "INTERIM",
          year: 2022,
        },
        {
          ticker: "ASII",
          cumDate: "2023-05-08",
          exDate: "2023-05-09",
          dividendPerShare: 552,
          yieldPercent: 8.76,
          price: 6300,
          dividendType: "FINAL",
          year: 2023,
        },
        {
          ticker: "ASII",
          cumDate: "2023-10-12",
          exDate: "2023-10-13",
          dividendPerShare: 82,
          yieldPercent: 1.4,
          price: 5850,
          dividendType: "INTERIM",
          year: 2023,
        },
      ];

      // On 2024-01-15, next dividend should be May Final (around May 9-10)
      const nextCumJan = estimateNextCumDate(records, "2024-01-15");
      expect(nextCumJan).toBe("2024-05-09");

      // On 2024-06-01 (after May Final), next dividend should be October Interim (around Oct 11)
      const nextCumJun = estimateNextCumDate(records, "2024-06-01");
      expect(nextCumJun).toBe("2024-10-11");
    });

    it("handles year-boundary rollovers when asOfDate is in late Q4", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "BBCA",
          cumDate: "2022-03-25",
          exDate: "2022-03-29",
          dividendPerShare: 120,
          yieldPercent: 1.51,
          price: 7925,
          dividendType: "FINAL",
          year: 2022,
        },
        {
          ticker: "BBCA",
          cumDate: "2022-12-01",
          exDate: "2022-12-02",
          dividendPerShare: 35,
          yieldPercent: 0.4,
          price: 8650,
          dividendType: "INTERIM",
          year: 2022,
        },
        {
          ticker: "BBCA",
          cumDate: "2023-03-28",
          exDate: "2023-03-29",
          dividendPerShare: 170,
          yieldPercent: 1.93,
          price: 8825,
          dividendType: "FINAL",
          year: 2023,
        },
        {
          ticker: "BBCA",
          cumDate: "2023-12-01",
          exDate: "2023-12-04",
          dividendPerShare: 42.5,
          yieldPercent: 0.48,
          price: 8925,
          dividendType: "INTERIM",
          year: 2023,
        },
      ];

      // As of 2024-12-15 (after Dec Interim), next projected dividend should be March 2025 Final
      const nextCumLateDec = estimateNextCumDate(records, "2024-12-15");
      expect(nextCumLateDec).toBe("2025-03-27");
    });

    it("handles year-boundary rollover for early Q1 payers when evaluated in late Q4", () => {
      const records: StockbitDividendRow[] = [
        {
          ticker: "JANPAY",
          cumDate: "2022-01-15",
          exDate: "2022-01-16",
          dividendPerShare: 50,
          yieldPercent: 5.0,
          price: 1000,
          dividendType: "FINAL",
          year: 2022,
        },
        {
          ticker: "JANPAY",
          cumDate: "2023-01-17",
          exDate: "2023-01-18",
          dividendPerShare: 55,
          yieldPercent: 5.5,
          price: 1000,
          dividendType: "FINAL",
          year: 2023,
        },
      ];

      const nextCum = estimateNextCumDate(records, "2024-11-20");
      expect(nextCum).toBe("2025-01-16");
    });
  });

  describe("detectDividendCycles with Sample Dataset", () => {
    it("processes all sample tickers from curated dataset", () => {
      const sampleRecords = loadSampleDividendData();
      const cycles = detectDividendCycles(sampleRecords, "2024-01-01");

      expect(cycles.length).toBeGreaterThanOrEqual(6);

      const tickers = cycles.map((c) => c.ticker);
      expect(tickers).toContain("ASII");
      expect(tickers).toContain("BBCA");
      expect(tickers).toContain("BBRI");
      expect(tickers).toContain("ITMG");
      expect(tickers).toContain("PTBA");
      expect(tickers).toContain("UNTR");

      for (const cycle of cycles) {
        expect(cycle.confidenceScore).toBeGreaterThan(0);
        expect(cycle.estimatedNextCumDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(cycle.typicalMonths.length).toBeGreaterThan(0);
        expect(cycle.historicalDividends.length).toBeGreaterThan(0);
      }
    });

    it("handles empty or single-record datasets gracefully", () => {
      expect(detectDividendCycles([])).toEqual([]);

      const singleRecord: StockbitDividendRow[] = [
        {
          ticker: "SOLO",
          cumDate: "2023-08-15",
          exDate: "2023-08-16",
          dividendPerShare: 100,
          yieldPercent: 4.0,
          price: 2500,
          dividendType: "FINAL",
          year: 2023,
        },
      ];

      const cycles = detectDividendCycles(singleRecord, "2024-01-01");
      expect(cycles).toHaveLength(1);
      expect(cycles[0].ticker).toBe("SOLO");
      expect(cycles[0].estimatedNextCumDate).toBe("2024-08-15");
      expect(cycles[0].frequency).toBe("ANNUAL");
      expect(cycles[0].confidenceScore).toBeLessThan(60);
    });
  });
});

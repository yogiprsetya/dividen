import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  formatRatio,
  formatNumber,
} from "../lib/utils/format";
import {
  INDONESIAN_MONTH_NAMES,
  getIndonesianMonthName,
  differenceInDays,
  formatDateIndonesian,
  formatRelativeDays,
  addDays,
} from "../lib/utils/date";
import {
  exportOpportunitiesToCSV,
  buildWatchlistClipboard,
} from "../lib/utils/export";
import type { RadarOpportunity } from "../lib/engine/types";

describe("Format Utilities (lib/utils/format.ts)", () => {
  describe("formatCurrency", () => {
    it("formats standard IDR integer amounts with dot thousand separators", () => {
      expect(formatCurrency(1250)).toBe("Rp 1.250");
      expect(formatCurrency(1000000)).toBe("Rp 1.000.000");
      expect(formatCurrency(0)).toBe("Rp 0");
    });

    it("supports optional decimal formatting with comma separator", () => {
      expect(formatCurrency(1250.5, { decimals: 2 })).toBe("Rp 1.250,50");
      expect(formatCurrency(1250.75, { decimals: 1 })).toBe("Rp 1.250,8");
    });

    it("allows hiding the Rp currency prefix", () => {
      expect(formatCurrency(1250, { showPrefix: false })).toBe("1.250");
      expect(formatCurrency(1000000, { showPrefix: false })).toBe("1.000.000");
    });

    it("formats negative currency values properly", () => {
      expect(formatCurrency(-500)).toBe("-Rp 500");
      expect(formatCurrency(-1500, { showPrefix: false })).toBe("-1.500");
    });

    it("handles NaN or non-finite inputs gracefully", () => {
      expect(formatCurrency(Number.NaN)).toBe("Rp 0");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage with default 2 decimal places and % symbol", () => {
      expect(formatPercent(7.5)).toBe("7.50%");
      expect(formatPercent(12.3456)).toBe("12.35%");
      expect(formatPercent(0)).toBe("0.00%");
    });

    it("supports custom decimal precision", () => {
      expect(formatPercent(7.5, 0)).toBe("8%");
      expect(formatPercent(7.5, 1)).toBe("7.5%");
      expect(formatPercent(7.54321, 3)).toBe("7.543%");
    });

    it("handles negative and NaN percent values", () => {
      expect(formatPercent(-3.2)).toBe("-3.20%");
      expect(formatPercent(Number.NaN)).toBe("0.00%");
    });
  });

  describe("formatRatio", () => {
    it("formats multiplier ratio with 'x' suffix", () => {
      expect(formatRatio(1.5)).toBe("1.50x");
      expect(formatRatio(2)).toBe("2.00x");
      expect(formatRatio(0.854, 1)).toBe("0.9x");
    });

    it("handles NaN ratio gracefully", () => {
      expect(formatRatio(Number.NaN)).toBe("0.00x");
    });
  });

  describe("formatNumber", () => {
    it("formats standard numbers with Indonesian thousand separator (.)", () => {
      expect(formatNumber(1250000)).toBe("1.250.000");
      expect(formatNumber(42)).toBe("42");
    });

    it("formats numbers with decimals using comma (,)", () => {
      expect(formatNumber(1234.56, 2)).toBe("1.234,56");
      expect(formatNumber(1234.5, 2)).toBe("1.234,50");
    });
  });
});

describe("Date Utilities (lib/utils/date.ts)", () => {
  describe("INDONESIAN_MONTH_NAMES & getIndonesianMonthName", () => {
    it("provides correct 12 Indonesian month names", () => {
      expect(INDONESIAN_MONTH_NAMES).toHaveLength(12);
      expect(INDONESIAN_MONTH_NAMES[0]).toBe("Januari");
      expect(INDONESIAN_MONTH_NAMES[4]).toBe("Mei");
      expect(INDONESIAN_MONTH_NAMES[11]).toBe("Desember");
    });

    it("returns correct month name by 1-indexed month number", () => {
      expect(getIndonesianMonthName(1)).toBe("Januari");
      expect(getIndonesianMonthName(5)).toBe("Mei");
      expect(getIndonesianMonthName(12)).toBe("Desember");
      expect(getIndonesianMonthName(13)).toBe("");
      expect(getIndonesianMonthName(0)).toBe("");
    });
  });

  describe("differenceInDays", () => {
    it("calculates difference in days between two ISO date strings", () => {
      expect(differenceInDays("2024-05-20", "2024-05-10")).toBe(10);
      expect(differenceInDays("2024-05-10", "2024-05-20")).toBe(-10);
      expect(differenceInDays("2024-05-10", "2024-05-10")).toBe(0);
    });

    it("handles cross-month and cross-year differences accurately", () => {
      expect(differenceInDays("2024-03-01", "2024-02-28")).toBe(2); // 2024 is leap year
      expect(differenceInDays("2025-01-01", "2024-12-31")).toBe(1);
    });

    it("accepts Date instances", () => {
      const d1 = new Date("2024-05-20T00:00:00Z");
      const d2 = new Date("2024-05-10T00:00:00Z");
      expect(differenceInDays(d1, d2)).toBe(10);
    });
  });

  describe("formatDateIndonesian", () => {
    it("formats ISO date string into Indonesian format", () => {
      expect(formatDateIndonesian("2024-05-15")).toBe("15 Mei 2024");
      expect(formatDateIndonesian("2024-01-01")).toBe("1 Januari 2024");
    });

    it("supports omitting year", () => {
      expect(formatDateIndonesian("2024-05-15", { includeYear: false })).toBe(
        "15 Mei",
      );
    });

    it("supports short month abbreviations", () => {
      expect(formatDateIndonesian("2024-08-17", { shortMonth: true })).toBe(
        "17 Agu 2024",
      );
      expect(formatDateIndonesian("2024-12-25", { shortMonth: true })).toBe(
        "25 Des 2024",
      );
    });

    it("handles invalid date strings safely", () => {
      expect(formatDateIndonesian("invalid-date")).toBe("-");
    });
  });

  describe("formatRelativeDays", () => {
    it("returns intuitive relative day descriptions", () => {
      expect(formatRelativeDays(0)).toBe("Hari ini");
      expect(formatRelativeDays(1)).toBe("Besok");
      expect(formatRelativeDays(-1)).toBe("Kemarin");
      expect(formatRelativeDays(5)).toBe("5 hari lagi");
      expect(formatRelativeDays(-10)).toBe("10 hari lalu");
    });
  });

  describe("addDays", () => {
    it("adds calendar days and returns formatted ISO YYYY-MM-DD date", () => {
      expect(addDays("2024-01-01", 10)).toBe("2024-01-11");
      expect(addDays("2024-01-30", 5)).toBe("2024-02-04");
      expect(addDays("2024-03-01", -2)).toBe("2024-02-28"); // Leap year leap day handled
    });
  });
});

describe("Export Utilities (lib/utils/export.ts)", () => {
  const mockOpportunities: RadarOpportunity[] = [
    {
      ticker: "BBCA",
      companyName: "Bank Central Asia Tbk",
      currentPrice: 9800,
      estimatedNextCumDate: "2025-03-20",
      projectedYieldPercent: 4.85,
      windowStatus: "OPTIMAL",
      daysToCumDate: 70,
      daysToWindowStart: 10,
      historicalConsistency: 95,
      typicalMonth: 3,
      history: [],
    },
    {
      ticker: "PTBA",
      companyName: "Bukit Asam Tbk, PT",
      currentPrice: 2650,
      estimatedNextCumDate: "2025-06-15",
      projectedYieldPercent: 14.2,
      windowStatus: "APPROACHING",
      daysToCumDate: 110,
      daysToWindowStart: 50,
      historicalConsistency: 88,
      typicalMonth: 6,
      history: [],
    },
  ];

  describe("exportOpportunitiesToCSV", () => {
    it("generates a valid CSV string with headers and escaped values", () => {
      const csv = exportOpportunitiesToCSV(mockOpportunities);
      const lines = csv.trim().split("\n");

      expect(lines.length).toBe(3);
      expect(lines[0]).toBe(
        "Ticker,Company Name,Current Price (IDR),Estimated Next Cum Date,Projected Yield (%),Days to Cum Date,Window Status,Consistency Score (%)",
      );

      // Verify row 1 (BBCA)
      expect(lines[1]).toBe(
        "BBCA,Bank Central Asia Tbk,9800,2025-03-20,4.85,70,OPTIMAL,95",
      );

      // Verify row 2 (PTBA with comma in company name escaped)
      expect(lines[2]).toBe(
        'PTBA,"Bukit Asam Tbk, PT",2650,2025-06-15,14.20,110,APPROACHING,88',
      );
    });

    it("returns only headers for empty opportunity array", () => {
      const csv = exportOpportunitiesToCSV([]);
      const lines = csv.trim().split("\n");
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain("Ticker");
    });
  });

  describe("buildWatchlistClipboard", () => {
    it("creates comma-separated ticker list from RadarOpportunity array", () => {
      const text = buildWatchlistClipboard(mockOpportunities);
      expect(text).toBe("BBCA,PTBA");
    });

    it("creates comma-separated ticker list from string array", () => {
      const text = buildWatchlistClipboard(["bbca", "bbri", "ASII"]);
      expect(text).toBe("BBCA,BBRI,ASII");
    });

    it("deduplicates tickers and ignores empty values", () => {
      const text = buildWatchlistClipboard(["BBCA", "bbca", "", "  ", "TLKM"]);
      expect(text).toBe("BBCA,TLKM");
    });

    it("supports custom separator", () => {
      const text = buildWatchlistClipboard(mockOpportunities, "\n");
      expect(text).toBe("BBCA\nPTBA");
    });

    it("returns empty string for empty input", () => {
      expect(buildWatchlistClipboard([])).toBe("");
    });
  });
});

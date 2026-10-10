import { describe, it, expect } from "vitest";
import {
  SAMPLE_STOCKBIT_CSV,
  loadSampleDividendData,
  loadSampleDividendParseResult,
} from "@/lib/parser/sample-data";

describe("Built-in IDX Sample Dataset & Loader", () => {
  describe("SAMPLE_STOCKBIT_CSV", () => {
    it("is defined and contains non-empty CSV string", () => {
      expect(SAMPLE_STOCKBIT_CSV).toBeDefined();
      expect(typeof SAMPLE_STOCKBIT_CSV).toBe("string");
      expect(SAMPLE_STOCKBIT_CSV.length).toBeGreaterThan(100);
      expect(SAMPLE_STOCKBIT_CSV).toContain("Symbol");
    });
  });

  describe("loadSampleDividendParseResult", () => {
    it("parses without errors and returns valid ParseResult", () => {
      const result = loadSampleDividendParseResult();
      expect(result).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.validRows).toBe(result.rows.length);
      expect(result.skippedRows).toBe(0);

      const errorDiagnostics = result.diagnostics.filter(
        (d) => d.type === "error",
      );
      expect(errorDiagnostics).toHaveLength(0);
    });
  });

  describe("loadSampleDividendData", () => {
    it("returns array of validated StockbitDividendRow objects", () => {
      const rows = loadSampleDividendData();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThanOrEqual(15);
    });

    it("contains all target IDX dividend payers (ASII, BBCA, BBRI, ITMG, PTBA, UNTR)", () => {
      const rows = loadSampleDividendData();
      const tickers = new Set(rows.map((r) => r.ticker));
      const requiredTickers = ["ASII", "BBCA", "BBRI", "ITMG", "PTBA", "UNTR"];

      requiredTickers.forEach((ticker) => {
        expect(tickers.has(ticker)).toBe(true);
      });
    });

    it("contains both INTERIM and FINAL dividend distributions", () => {
      const rows = loadSampleDividendData();
      const types = new Set(rows.map((r) => r.dividendType));

      expect(types.has("INTERIM")).toBe(true);
      expect(types.has("FINAL")).toBe(true);
    });

    it("covers multi-year history across 2022 to 2024", () => {
      const rows = loadSampleDividendData();
      const years = new Set(rows.map((r) => r.year));

      expect(years.has(2022)).toBe(true);
      expect(years.has(2023)).toBe(true);
      expect(years.has(2024)).toBe(true);
    });

    it("validates data integrity on each row", () => {
      const rows = loadSampleDividendData();
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

      rows.forEach((row) => {
        expect(row.ticker).toMatch(/^[A-Z]{4}$/);
        expect(row.cumDate).toMatch(isoDatePattern);
        expect(row.exDate).toMatch(isoDatePattern);
        if (row.paymentDate) {
          expect(row.paymentDate).toMatch(isoDatePattern);
        }
        expect(row.dividendPerShare).toBeGreaterThan(0);
        expect(row.yieldPercent).toBeGreaterThan(0);
        expect(row.price).toBeGreaterThan(0);
        expect(row.year).toBeGreaterThanOrEqual(2020);
        expect(["INTERIM", "FINAL", "UNKNOWN"]).toContain(row.dividendType);
        expect(row.companyName).toBeDefined();
        expect(row.companyName!.length).toBeGreaterThan(0);
      });
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  parseStockbitCsv,
  parseDateToIso,
  parseNumericAmount,
  parseYieldPercent,
} from "@/lib/parser";
import type { ParseResult } from "@/lib/parser/types";

describe("Stockbit CSV Parser & Normalizer", () => {
  describe("Helper parsers", () => {
    describe("parseDateToIso", () => {
      it("parses DD/MM/YYYY dates", () => {
        expect(parseDateToIso("15/03/2024")).toBe("2024-03-15");
        expect(parseDateToIso("05/11/2023")).toBe("2023-11-05");
      });

      it("parses YYYY-MM-DD ISO dates", () => {
        expect(parseDateToIso("2024-03-15")).toBe("2024-03-15");
      });

      it("parses DD-MM-YYYY dates", () => {
        expect(parseDateToIso("15-03-2024")).toBe("2024-03-15");
      });

      it("parses DD MMM YYYY dates with English and Indonesian month names", () => {
        expect(parseDateToIso("15 Mar 2024")).toBe("2024-03-15");
        expect(parseDateToIso("22 Mei 2024")).toBe("2024-05-22");
        expect(parseDateToIso("10 Agu 2023")).toBe("2023-08-10");
        expect(parseDateToIso("01 Des 2023")).toBe("2023-12-01");
      });

      it("returns null for invalid dates", () => {
        expect(parseDateToIso("")).toBeNull();
        expect(parseDateToIso("-")).toBeNull();
        expect(parseDateToIso("N/A")).toBeNull();
        expect(parseDateToIso("invalid-date")).toBeNull();
      });
    });

    describe("parseNumericAmount", () => {
      it("parses standard numbers", () => {
        expect(parseNumericAmount("270")).toBe(270);
        expect(parseNumericAmount("1250.5")).toBe(1250.5);
      });

      it("parses Indonesian formatted currency with Rp and dot thousand separators", () => {
        expect(parseNumericAmount("Rp 1.250")).toBe(1250);
        expect(parseNumericAmount("Rp1.250,50")).toBe(1250.5);
        expect(parseNumericAmount("Rp 350")).toBe(350);
        expect(parseNumericAmount("2.500.000")).toBe(2500000);
      });

      it("handles empty or dash representations", () => {
        expect(parseNumericAmount("")).toBe(0);
        expect(parseNumericAmount("-")).toBe(0);
        expect(parseNumericAmount("N/A")).toBe(0);
      });
    });

    describe("parseYieldPercent", () => {
      it("parses percent strings with % symbol and commas", () => {
        expect(parseYieldPercent("4.5%")).toBe(4.5);
        expect(parseYieldPercent("4,5%")).toBe(4.5);
        expect(parseYieldPercent("5.25")).toBe(5.25);
      });

      it("handles empty strings", () => {
        expect(parseYieldPercent("")).toBe(0);
      });
    });
  });

  describe("parseStockbitCsv", () => {
    it("parses standard Stockbit dividend export CSV", () => {
      const csv = `Symbol,Cum Date,Ex Date,Payment Date,Cash Dividend,Yield (%),Price,Type
BBCA,15/03/2024,16/03/2024,04/04/2024,270,2.7%,10000,Final
BBRI,13/03/2024,14/03/2024,28/03/2024,319,5.3%,6000,Final
ASII,10/05/2024,13/05/2024,30/05/2024,421,8.1%,5200,Final`;

      const result: ParseResult = parseStockbitCsv(csv);

      expect(result.rows).toHaveLength(3);
      expect(result.validRows).toBe(3);
      expect(result.totalRows).toBe(3);
      expect(result.diagnostics.filter((d) => d.type === "error")).toHaveLength(
        0,
      );

      const bbca = result.rows[0];
      expect(bbca.ticker).toBe("BBCA");
      expect(bbca.cumDate).toBe("2024-03-15");
      expect(bbca.exDate).toBe("2024-03-16");
      expect(bbca.paymentDate).toBe("2024-04-04");
      expect(bbca.dividendPerShare).toBe(270);
      expect(bbca.yieldPercent).toBe(2.7);
      expect(bbca.price).toBe(10000);
      expect(bbca.dividendType).toBe("FINAL");
      expect(bbca.year).toBe(2024);
    });

    it("handles alternative column header naming conventions", () => {
      const csv = `Ticker,Nama Perusahaan,Tanggal Cum,Tanggal Ex,Tanggal Pembayaran,Dividen (Rp),Yield,Harga,Tipe
TLKM,Telkom Indonesia (Persero) Tbk,20/05/2024,21/05/2024,10/06/2024,166.5,5.1%,3250,Final
UNVR,Unilever Indonesia Tbk,15/11/2023,16/11/2023,05/12/2023,63,2.4%,2600,Interim`;

      const result = parseStockbitCsv(csv);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].ticker).toBe("TLKM");
      expect(result.rows[0].cumDate).toBe("2024-05-20");
      expect(result.rows[0].dividendPerShare).toBe(166.5);
      expect(result.rows[0].dividendType).toBe("FINAL");

      expect(result.rows[1].ticker).toBe("UNVR");
      expect(result.rows[1].cumDate).toBe("2023-11-15");
      expect(result.rows[1].dividendPerShare).toBe(63);
      expect(result.rows[1].dividendType).toBe("INTERIM");
    });

    it("correctly parses CSV with quotes, and CRLF line endings", () => {
      const csv =
        "Symbol,Cum Date,Ex Date,Payment Date,Cash Dividend,Yield (%),Price,Type\r\n" +
        '"PTBA",24/06/2024,25/06/2024,12/07/2024,"Rp 397,7",15.9%,"2,500",Final\r\n';

      const result = parseStockbitCsv(csv);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].ticker).toBe("PTBA");

      expect(result.rows[0].cumDate).toBe("2024-06-24");
      expect(result.rows[0].dividendPerShare).toBe(397.7);
      expect(result.rows[0].yieldPercent).toBe(15.9);
      expect(result.rows[0].price).toBe(2500);
    });

    it("handles UTF-8 Byte Order Mark (BOM)", () => {
      const csvWithBom =
        "\uFEFFSymbol,Cum Date,Ex Date,Cash Dividend\nBBCA,15/03/2024,16/03/2024,270";
      const result = parseStockbitCsv(csvWithBom);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].ticker).toBe("BBCA");
    });

    it("derives missing price or yield if one is present with dividendPerShare", () => {
      const csv = `Symbol,Cum Date,Ex Date,Cash Dividend,Price,Yield (%)
BBCA,15/03/2024,16/03/2024,270,10000,
BBRI,13/03/2024,14/03/2024,300,,5.0%`;

      const result = parseStockbitCsv(csv);

      expect(result.rows).toHaveLength(2);
      // BBCA: Price 10000, DPS 270 -> Yield = 2.7%
      expect(result.rows[0].yieldPercent).toBe(2.7);
      // BBRI: Yield 5.0%, DPS 300 -> Price = 6000
      expect(result.rows[1].price).toBe(6000);
    });

    it("skips invalid rows and collects diagnostics without aborting parsing of valid rows", () => {
      const csv = `Symbol,Cum Date,Ex Date,Cash Dividend
BBCA,15/03/2024,16/03/2024,270
,15/03/2024,16/03/2024,270
BBRI,invalid-date,16/03/2024,300
BMRI,18/03/2024,19/03/2024,0
BBNI,20/03/2024,21/03/2024,250`;

      const result = parseStockbitCsv(csv);

      expect(result.totalRows).toBe(5);
      expect(result.validRows).toBe(2);
      expect(result.rows.map((r) => r.ticker)).toEqual(["BBCA", "BBNI"]);

      // Diagnostics should report issues for row 2 (missing ticker), row 3 (invalid date), row 4 (0 DPS)
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(3);
    });

    it("handles empty or whitespace-only CSV gracefully", () => {
      const resultEmpty = parseStockbitCsv("");
      expect(resultEmpty.rows).toEqual([]);
      expect(resultEmpty.totalRows).toBe(0);
      expect(resultEmpty.validRows).toBe(0);
      expect(resultEmpty.diagnostics.some((d) => d.type === "error")).toBe(
        true,
      );

      const resultWhitespace = parseStockbitCsv("   \n  \r\n  ");
      expect(resultWhitespace.rows).toEqual([]);
      expect(resultWhitespace.totalRows).toBe(0);
    });

    it("handles missing required columns with clear diagnostic error", () => {
      const csv = `RandomColumn,AnotherColumn\nValue1,Value2`;
      const result = parseStockbitCsv(csv);

      expect(result.rows).toEqual([]);
      expect(
        result.diagnostics.some(
          (d) =>
            d.type === "error" && d.message.toLowerCase().includes("column"),
        ),
      ).toBe(true);
    });

    it("flags USD or foreign currency rows with informative warning diagnostic", () => {
      const csv = `Symbol,Cum Date,Ex Date,Cash Dividend,Currency
MEDC,10/06/2024,11/06/2024,0.015,USD
BBCA,15/03/2024,16/03/2024,270,IDR`;

      const result = parseStockbitCsv(csv);

      // Warning diagnostic should exist for USD
      const usdWarning = result.diagnostics.find(
        (d) => d.type === "warning" && d.message.includes("USD"),
      );
      expect(usdWarning).toBeDefined();
      expect(result.rows).toHaveLength(2);
    });
  });
});

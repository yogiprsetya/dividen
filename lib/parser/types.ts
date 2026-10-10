/**
 * Raw row shape as parsed directly from Stockbit Dividend CSV exports.
 */
export interface StockbitRawRow {
  Symbol?: string;
  Ticker?: string;
  "Company Name"?: string;
  "Cum Date"?: string;
  "Ex Date"?: string;
  "Payment Date"?: string;
  "Cash Dividend"?: string;
  "Dividend (Rp)"?: string;
  "Yield (%)"?: string;
  Price?: string;
  Type?: string;
  [key: string]: string | undefined;
}

/**
 * Normalized dividend payment record for a stock.
 */
export interface StockbitDividendRow {
  ticker: string;
  companyName?: string;
  cumDate: string; // YYYY-MM-DD
  exDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  dividendPerShare: number; // In IDR
  yieldPercent: number; // e.g. 5.4 for 5.4%
  price: number; // In IDR
  dividendType: "INTERIM" | "FINAL" | "UNKNOWN";
  year: number;
}

/**
 * Diagnostic collected during parsing (for skipped, invalid, or warning rows).
 */
export interface ParseDiagnostic {
  type: "info" | "warning" | "error";
  message: string;
  rowNumber?: number;
  rawRow?: Record<string, string | undefined>;
}

/**
 * Complete result returned by the CSV parser.
 */
export interface ParseResult {
  rows: StockbitDividendRow[];
  diagnostics: ParseDiagnostic[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
}

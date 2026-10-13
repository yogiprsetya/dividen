import { parseCsvString } from "./csv-reader";
import {
  parseDateToIso,
  parseNumericAmount,
  parseYieldPercent,
  detectDividendType,
} from "./normalizers";
import type {
  StockbitDividendRow,
  ParseDiagnostic,
  ParseOptions,
  ParseResult,
} from "./types";

export * from "./types";
export * from "./normalizers";
export * from "./csv-reader";
export * from "./sample-data";

interface ColumnIndexes {
  ticker?: number;
  cumDate?: number;
  exDate?: number;
  paymentDate?: number;
  dividendPerShare?: number;
  yieldPercent?: number;
  price?: number;
  dividendType?: number;
  currency?: number;
}

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapColumns(headers: string[]): ColumnIndexes {
  const mapping: ColumnIndexes = {};

  headers.forEach((h, idx) => {
    const key = normalizeHeaderKey(h);

    if (
      ["symbol", "ticker", "code", "kode", "emiten", "stocksymbol"].includes(
        key,
      )
    ) {
      if (mapping.ticker === undefined) mapping.ticker = idx;
    } else if (
      ["cumdate", "tanggalcum", "cum", "cumdividenddate"].includes(key)
    ) {
      if (mapping.cumDate === undefined) mapping.cumDate = idx;
    } else if (["exdate", "tanggalex", "ex", "exdividenddate"].includes(key)) {
      if (mapping.exDate === undefined) mapping.exDate = idx;
    } else if (
      [
        "paymentdate",
        "tanggalpembayaran",
        "payment",
        "paydate",
        "tanggalbayar",
      ].includes(key)
    ) {
      if (mapping.paymentDate === undefined) mapping.paymentDate = idx;
    } else if (
      [
        "cashdividend",
        "dividendrp",
        "dividenrp",
        "dividend",
        "dividen",
        "dividendshare",
        "dividendershare",
        "dps",
        "cashdividendpershare",
      ].includes(key)
    ) {
      if (mapping.dividendPerShare === undefined)
        mapping.dividendPerShare = idx;
    } else if (
      [
        "yield",
        "yieldpercent",
        "dividendyield",
        "dividendyieldpercent",
        "dy",
      ].includes(key)
    ) {
      if (mapping.yieldPercent === undefined) mapping.yieldPercent = idx;
    } else if (
      [
        "price",
        "stockprice",
        "harga",
        "closeprice",
        "closingprice",
        "hargasaham",
      ].includes(key)
    ) {
      if (mapping.price === undefined) mapping.price = idx;
    } else if (["type", "dividendtype", "tipedividen", "tipe"].includes(key)) {
      if (mapping.dividendType === undefined) mapping.dividendType = idx;
    } else if (["currency", "matauang", "curr"].includes(key)) {
      if (mapping.currency === undefined) mapping.currency = idx;
    }
  });

  return mapping;
}

/**
 * Parses raw Stockbit Dividend Calendar CSV export string into normalized DividendAnnouncement records.
 */
export function parseStockbitCsv(
  csvContent: string,
  options?: ParseOptions,
): ParseResult {
  const diagnostics: ParseDiagnostic[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    diagnostics.push({
      type: "error",
      message: "CSV content is empty.",
    });
    return {
      rows: [],
      diagnostics,
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
    };
  }

  const rawRows = parseCsvString(csvContent);

  if (rawRows.length === 0) {
    diagnostics.push({
      type: "error",
      message: "No readable data rows found in CSV.",
    });
    return {
      rows: [],
      diagnostics,
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
    };
  }

  const headers = rawRows[0];
  const colMap = mapColumns(headers);

  // Validate essential columns
  if (
    colMap.ticker === undefined ||
    (colMap.cumDate === undefined && colMap.exDate === undefined) ||
    colMap.dividendPerShare === undefined
  ) {
    const missing: string[] = [];
    if (colMap.ticker === undefined) missing.push("Ticker/Symbol");
    if (colMap.cumDate === undefined && colMap.exDate === undefined)
      missing.push("Cum Date / Ex Date");
    if (colMap.dividendPerShare === undefined)
      missing.push("Cash Dividend / DPS");

    diagnostics.push({
      type: "error",
      message: `Missing required columns: ${missing.join(", ")}.`,
    });

    return {
      rows: [],
      diagnostics,
      totalRows: Math.max(0, rawRows.length - 1),
      validRows: 0,
      skippedRows: Math.max(0, rawRows.length - 1),
    };
  }

  const dataRows = rawRows.slice(1);
  const rows: StockbitDividendRow[] = [];

  dataRows.forEach((rowCells, idx) => {
    const rowNumber = idx + 2; // 1-based index including header
    const rawTicker =
      colMap.ticker !== undefined ? rowCells[colMap.ticker] : undefined;
    const rawCumDate =
      colMap.cumDate !== undefined ? rowCells[colMap.cumDate] : undefined;
    const rawExDate =
      colMap.exDate !== undefined ? rowCells[colMap.exDate] : undefined;
    const rawPaymentDate =
      colMap.paymentDate !== undefined
        ? rowCells[colMap.paymentDate]
        : undefined;
    const rawDPS =
      colMap.dividendPerShare !== undefined
        ? rowCells[colMap.dividendPerShare]
        : undefined;
    const rawYield =
      colMap.yieldPercent !== undefined
        ? rowCells[colMap.yieldPercent]
        : undefined;
    const rawPrice =
      colMap.price !== undefined ? rowCells[colMap.price] : undefined;
    const rawType =
      colMap.dividendType !== undefined
        ? rowCells[colMap.dividendType]
        : undefined;
    const rawCurrency =
      colMap.currency !== undefined ? rowCells[colMap.currency] : undefined;

    const ticker = rawTicker ? rawTicker.trim().toUpperCase() : "";
    if (!ticker) {
      diagnostics.push({
        type: "error",
        rowNumber,
        message: `Row ${rowNumber}: Missing ticker symbol.`,
      });
      return;
    }

    const cumDate = parseDateToIso(rawCumDate);
    const exDate = parseDateToIso(rawExDate) || cumDate;

    if (!cumDate) {
      diagnostics.push({
        type: "error",
        rowNumber,
        message: `Row ${rowNumber}: Invalid or missing Cum Date ('${rawCumDate || ""}').`,
      });
      return;
    }

    const dps = parseNumericAmount(rawDPS);
    if (dps <= 0) {
      diagnostics.push({
        type: "warning",
        rowNumber,
        message: `Row ${rowNumber}: Invalid or zero dividend amount for ${ticker}.`,
      });
      return;
    }

    let price = parseNumericAmount(rawPrice);
    let yieldPercent = parseYieldPercent(rawYield);

    // Derive missing price or yield if possible
    if (price <= 0 && yieldPercent > 0 && dps > 0) {
      price = Math.round(dps / (yieldPercent / 100));
    } else if (yieldPercent <= 0 && price > 0 && dps > 0) {
      yieldPercent = Number(((dps / price) * 100).toFixed(2));
    }

    // Currency check
    const isUsd =
      (rawCurrency && rawCurrency.toUpperCase().includes("USD")) ||
      (rawDPS && rawDPS.toUpperCase().includes("USD"));
    if (isUsd) {
      diagnostics.push({
        type: "warning",
        rowNumber,
        message: `Row ${rowNumber}: ${ticker} dividend is in USD. Stored as raw numerical value.`,
      });
    }

    const dividendType = detectDividendType(rawType);
    const paymentDate = parseDateToIso(rawPaymentDate) || undefined;
    const year = parseInt(cumDate.slice(0, 4), 10);

    rows.push({
      ticker,
      cumDate,
      exDate: exDate || cumDate,
      paymentDate,
      dividendPerShare: dps,
      yieldPercent,
      price,
      dividendType,
      year,
    });
  });

  if (options?.strict && diagnostics.some((d) => d.type === "error")) {
    return {
      rows: [],
      diagnostics,
      totalRows: dataRows.length,
      validRows: 0,
      skippedRows: dataRows.length,
    };
  }

  return {
    rows,
    diagnostics,
    totalRows: dataRows.length,
    validRows: rows.length,
    skippedRows: Math.max(0, dataRows.length - rows.length),
  };
}

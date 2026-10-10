import type { RadarOpportunity } from "../engine/types";

function escapeCSVField(value: string | number): string {
  const str = String(value ?? "");
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports a list of RadarOpportunity items to a CSV formatted string.
 */
export function exportOpportunitiesToCSV(
  opportunities: RadarOpportunity[],
): string {
  const headers = [
    "Ticker",
    "Company Name",
    "Current Price (IDR)",
    "Estimated Next Cum Date",
    "Projected Yield (%)",
    "Days to Cum Date",
    "Window Status",
    "Consistency Score (%)",
  ];

  const rows = opportunities.map((opp) => {
    return [
      escapeCSVField(opp.ticker),
      escapeCSVField(opp.companyName),
      escapeCSVField(opp.currentPrice),
      escapeCSVField(opp.estimatedNextCumDate),
      escapeCSVField(opp.estimatedYield.toFixed(2)),
      escapeCSVField(opp.daysToCumDate),
      escapeCSVField(opp.windowStatus),
      escapeCSVField(opp.historicalConsistency),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Builds a clean, deduplicated ticker string suitable for pasting into Stockbit / TradingView / Excel watchlist.
 * Accepts either RadarOpportunity array or string array.
 * Example: ["BBCA", "BBRI"] -> "BBCA,BBRI"
 */
export function buildWatchlistClipboard(
  items: (RadarOpportunity | string)[],
  separator = ",",
): string {
  const tickers: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const rawTicker = typeof item === "string" ? item : item.ticker;
    const ticker = rawTicker ? rawTicker.trim().toUpperCase() : "";

    if (ticker && !seen.has(ticker)) {
      seen.add(ticker);
      tickers.push(ticker);
    }
  }

  return tickers.join(separator);
}

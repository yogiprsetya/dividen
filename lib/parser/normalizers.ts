const INDONESIAN_MONTH_MAP: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  mar: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  agu: 8,
  ags: 8,
  aug: 8,
  agustus: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oct: 10,
  oktober: 10,
  october: 10,
  nov: 11,
  nop: 11,
  november: 11,
  des: 12,
  dec: 12,
  desember: 12,
  december: 12,
};

/**
 * Normalizes varied date formats into ISO `YYYY-MM-DD`.
 */
export function parseDateToIso(
  rawDate: string | undefined | null,
): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (
    !trimmed ||
    trimmed === "-" ||
    trimmed === "N/A" ||
    trimmed === "null" ||
    trimmed === "undefined"
  ) {
    return null;
  }

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (
      year >= 1970 &&
      year <= 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  // 2. Numeric DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numMatch = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(trimmed);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const month = parseInt(numMatch[2], 10);
    const year = parseInt(numMatch[3], 10);

    if (
      year >= 1970 &&
      year <= 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  // 3. Named month: e.g. "15 Mar 2024", "22 Mei 2024", "15-Mar-2024", "15 March 2024"
  const textMonthMatch = /^(\d{1,2})[-\s/]+([a-zA-Z]+)[-\s/]+(\d{4})$/.exec(
    trimmed,
  );
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const monthKey = textMonthMatch[2].toLowerCase();
    const year = parseInt(textMonthMatch[3], 10);
    const month = INDONESIAN_MONTH_MAP[monthKey];

    if (month && year >= 1970 && year <= 2100 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Normalizes varied Indonesian/International currency and numeric strings into a clean float.
 */
export function parseNumericAmount(
  rawAmount: string | number | undefined | null,
): number {
  if (typeof rawAmount === "number") {
    return Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
  }
  if (!rawAmount) return 0;

  const trimmed = rawAmount.trim();
  if (
    !trimmed ||
    trimmed === "-" ||
    trimmed === "N/A" ||
    trimmed === "null" ||
    trimmed === "undefined"
  ) {
    return 0;
  }

  // Strip currency prefixes and symbols (Rp, IDR, USD, $, etc.) and spaces
  let cleaned = trimmed.replace(/^(rp\.?|idr|\$|usd)\s*/i, "").trim();

  // If string has both '.' and ','
  if (cleaned.includes(".") && cleaned.includes(",")) {
    const dotIdx = cleaned.indexOf(".");
    const commaIdx = cleaned.indexOf(",");
    if (dotIdx < commaIdx) {
      // Indonesian style: 1.250,50 -> remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US style: 1,250.50 -> remove commas
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(".")) {
    // Only dot present. Check if it's a thousand separator (e.g. "1.250", "2.500.000", "10.000")
    // Indonesian thousand separator matches: digits followed by .3digits (repeating)
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, "");
    }
    // Otherwise it's a decimal dot like 166.5 or 0.015
  } else if (cleaned.includes(",")) {
    // Only comma present.
    // Check if it's a thousand separator: e.g. "1,250", "2,500,000"
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Decimal comma: e.g. "397,7" or "1250,5"
      cleaned = cleaned.replace(",", ".");
    }
  }

  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/**
 * Normalizes percentage strings (e.g. "4.5%", "4,5%", "5.25") into a numeric float.
 */
export function parseYieldPercent(
  rawYield: string | number | undefined | null,
): number {
  if (typeof rawYield === "number") {
    return Number.isFinite(rawYield) ? Math.max(0, rawYield) : 0;
  }
  if (!rawYield) return 0;

  const trimmed = rawYield.trim();
  if (!trimmed || trimmed === "-" || trimmed === "N/A") {
    return 0;
  }

  const cleaned = trimmed.replace(/%/g, "").replace(",", ".").trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/**
 * Classifies dividend type as INTERIM, FINAL, or UNKNOWN.
 */
export function detectDividendType(
  rawType: string | undefined | null,
): "INTERIM" | "FINAL" | "UNKNOWN" {
  if (!rawType) return "UNKNOWN";
  const lower = rawType.toLowerCase();
  if (lower.includes("interim")) {
    return "INTERIM";
  }
  if (lower.includes("final")) {
    return "FINAL";
  }
  return "UNKNOWN";
}

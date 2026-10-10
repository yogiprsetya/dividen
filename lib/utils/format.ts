export interface CurrencyFormatOptions {
  showPrefix?: boolean;
  decimals?: number;
}

/**
 * Format a number into Indonesian Rupiah (IDR) currency format.
 * Example: 1250 -> "Rp 1.250", -500 -> "-Rp 500"
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {},
): string {
  const { showPrefix = true, decimals = 0 } = options;

  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    return showPrefix ? "Rp 0" : "0";
  }

  const isNegative = amount < 0;
  const absValue = Math.abs(amount);

  const formattedValue = formatNumber(absValue, decimals);
  const prefix = showPrefix ? "Rp " : "";

  return isNegative
    ? `-${prefix}${formattedValue}`
    : `${prefix}${formattedValue}`;
}

/**
 * Format a number as percentage string.
 * Example: 7.5 -> "7.50%"
 */
export function formatPercent(value: number, decimals = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return (0).toFixed(decimals) + "%";
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a multiplier ratio with 'x' suffix.
 * Example: 1.5 -> "1.50x"
 */
export function formatRatio(value: number, decimals = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return (0).toFixed(decimals) + "x";
  }

  return `${value.toFixed(decimals)}x`;
}

/**
 * Format a standard number using Indonesian separators (. for thousands, , for decimals).
 * Example: 1250000 -> "1.250.000", 1234.56 -> "1.234,56"
 */
export function formatNumber(value: number, decimals = 0): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return "0";
  }

  const parts = value.toFixed(decimals).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1];

  return decimalPart !== undefined && decimals > 0
    ? `${integerPart},${decimalPart}`
    : integerPart;
}

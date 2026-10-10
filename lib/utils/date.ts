export const INDONESIAN_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const INDONESIAN_SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export interface IndonesianDateOptions {
  includeYear?: boolean;
  shortMonth?: boolean;
}

function toUTCDate(d: string | Date): Date | null {
  if (typeof d === "string") {
    const cleanDateStr = d.split("T")[0].trim();
    const parts = cleanDateStr.split("-").map(Number);
    if (parts.length === 3 && parts.every((num) => !Number.isNaN(num))) {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
      ),
    );
  }

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Returns the Indonesian month name for a 1-indexed month number (1 - 12).
 */
export function getIndonesianMonthName(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) {
    return "";
  }
  return INDONESIAN_MONTH_NAMES[monthNumber - 1];
}

/**
 * Calculates the exact calendar day difference between two dates (date1 - date2).
 */
export function differenceInDays(
  date1: string | Date,
  date2: string | Date,
): number {
  const d1 = toUTCDate(date1);
  const d2 = toUTCDate(date2);

  if (!d1 || !d2) {
    return 0;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d1.getTime() - d2.getTime()) / msPerDay);
}

/**
 * Format date string or Date instance to Indonesian date format.
 * Example: "2024-05-15" -> "15 Mei 2024", { shortMonth: true } -> "15 Mei 2024", { includeYear: false } -> "15 Mei"
 */
export function formatDateIndonesian(
  date: string | Date,
  options: IndonesianDateOptions = {},
): string {
  const { includeYear = true, shortMonth = false } = options;
  const utcDate = toUTCDate(date);

  if (!utcDate) {
    return "-";
  }

  const day = utcDate.getUTCDate();
  const monthIdx = utcDate.getUTCMonth();
  const year = utcDate.getUTCFullYear();

  const monthName = shortMonth
    ? INDONESIAN_SHORT_MONTH_NAMES[monthIdx]
    : INDONESIAN_MONTH_NAMES[monthIdx];

  if (!includeYear) {
    return `${day} ${monthName}`;
  }

  return `${day} ${monthName} ${year}`;
}

/**
 * Formats a day difference number into friendly relative Indonesian label.
 * Example: 0 -> "Hari ini", 1 -> "Besok", -1 -> "Kemarin", 5 -> "5 hari lagi", -10 -> "10 hari lalu"
 */
export function formatRelativeDays(days: number): string {
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  if (days === -1) return "Kemarin";
  if (days > 1) return `${days} hari lagi`;
  return `${Math.abs(days)} hari lalu`;
}

/**
 * Add or subtract calendar days to a date and return ISO YYYY-MM-DD string.
 */
export function addDays(date: string | Date, days: number): string {
  const utcDate = toUTCDate(date);
  if (!utcDate) {
    return "";
  }

  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcDate.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

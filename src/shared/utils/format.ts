/**
 * Pure, locale-aware formatters. No side effects, no global state:
 * the locale is always passed in, which keeps them trivially testable.
 * React components use them through the hooks in `@/shared/hooks`.
 */

export type DateInput = Date | string | number;

const toDate = (input: DateInput): Date | null => {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const isDateOnly = (input: DateInput | null | undefined): boolean =>
  typeof input === "string" && DATE_ONLY.test(input);

export const formatDate = (
  input: DateInput | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string => {
  const date = input === null || input === undefined || input === "" ? null : toDate(input);
  // Date-only strings ("2026-11-14") are parsed as UTC midnight: format them in UTC too,
  // otherwise users west of UTC see the previous day and server/client output differs.
  const zoned = isDateOnly(input) ? { timeZone: "UTC", ...options } : options;
  return date ? new Intl.DateTimeFormat(locale, zoned).format(date) : "";
};

export const formatYear = (input: DateInput | null | undefined, locale: string): string =>
  formatDate(input, locale, { year: "numeric" });

type RelativeUnit = readonly [Intl.RelativeTimeFormatUnit, number];

const SECOND_UNIT: RelativeUnit = ["second", 1];

const RELATIVE_UNITS: ReadonlyArray<RelativeUnit> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  SECOND_UNIT,
];

export const formatRelativeTime = (
  input: DateInput,
  locale: string,
  now: DateInput = Date.now(),
): string => {
  const date = toDate(input);
  const reference = toDate(now);
  if (!date || !reference) return "";

  const diffSeconds = Math.round((date.getTime() - reference.getTime()) / 1000);
  const [unit, secondsInUnit] =
    RELATIVE_UNITS.find(([, seconds]) => Math.abs(diffSeconds) >= seconds) ?? SECOND_UNIT;

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    Math.round(diffSeconds / secondsInUnit),
    unit,
  );
};

/** 125 → "2h 5m" (unit labels localized via Intl). */
export const formatRuntime = (minutes: number | null | undefined, locale: string): string => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes) || minutes <= 0)
    return "";
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  const unit = (value: number, u: "hour" | "minute") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: u, unitDisplay: "narrow" }).format(value);

  return [hours > 0 ? unit(hours, "hour") : null, rest > 0 ? unit(rest, "minute") : null]
    .filter((part): part is string => part !== null)
    .join(" ");
};

/** TMDB vote average (0–10) → "7.5" / "7,5" depending on locale. */
export const formatRating = (
  value: number | null | undefined,
  locale: string,
  fractionDigits = 1,
): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? ""
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(Math.min(10, Math.max(0, value)));

/** 12345 → "12K" / "12.3K" (compact notation). */
export const formatCompactNumber = (value: number | null | undefined, locale: string): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? ""
    : new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
        value,
      );

/** ISO 639-1 code → language name in the UI locale ("fr" → "French"); falls back to the code. */
export const formatLanguage = (code: string | null | undefined, locale: string): string => {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** TMDB budgets/revenue are USD; 0 means "unknown" in TMDB. */
export const formatCurrency = (
  value: number | null | undefined,
  locale: string,
  currency = "USD",
): string =>
  value === null || value === undefined || !Number.isFinite(value) || value <= 0
    ? ""
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);

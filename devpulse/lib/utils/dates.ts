import { RANGE_DAYS } from "@/constants/analytics";
import type { RangeKey } from "@/types/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function endOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(23, 59, 59, 999);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

export function subtractDays(date: Date, amount: number): Date {
  return addDays(date, -amount);
}

export function rangeDates(
  range: Exclude<RangeKey, "ALL">,
  now = new Date(),
) {
  const days = RANGE_DAYS[range];
  const currentTo = new Date(now);
  const currentFrom = startOfUtcDay(subtractDays(currentTo, days - 1));
  const previousTo = endOfUtcDay(subtractDays(currentFrom, 1));
  const previousFrom = startOfUtcDay(subtractDays(previousTo, days - 1));

  return { currentFrom, currentTo, previousFrom, previousTo, days };
}

export function yearDates(year: number, now = new Date()) {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const naturalEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const to = year === now.getUTCFullYear() && naturalEnd > now ? new Date(now) : naturalEnd;
  return { from, to };
}

export function daysBetween(earlier: Date, later: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / DAY_MS));
}

export function daysSince(value: string | null, now = new Date()): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return daysBetween(date, now);
}

export function relativeAge(value: string | null, now = new Date(), locale = "en"): string {
  if (!value) return locale === "es" ? "desconocido" : "unknown";
  const days = daysSince(value, now);
  if (!Number.isFinite(days)) return locale === "es" ? "desconocido" : "unknown";
  if (days === 0) return locale === "es" ? "hoy" : "today";
  if (days === 1) return locale === "es" ? "ayer" : "yesterday";
  if (days < 30) return locale === "es" ? `hace ${days} d` : `${days}d ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return locale === "es" ? `hace ${months} mes` : `${months}mo ago`;
  }
  const years = (days / 365.25).toFixed(1);
  return locale === "es" ? `hace ${years} a` : `${years}y ago`;
}

export function formatUtcDate(value: string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00.000Z`));
}

export function isClosedHistoricalYear(year: number, now = new Date()): boolean {
  return year < now.getUTCFullYear();
}

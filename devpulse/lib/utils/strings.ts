import type { Locale, RangeKey } from "@/types/analytics";

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLocale(value: string | string[] | undefined): Locale {
  return firstQueryValue(value)?.toLowerCase() === "es" ? "es" : "en";
}

export function parseRange(
  value: string | string[] | undefined,
  allowed: readonly RangeKey[],
): RangeKey {
  const normalized = firstQueryValue(value)?.toUpperCase() ?? "30D";
  return allowed.includes(normalized as RangeKey) ? (normalized as RangeKey) : "30D";
}

export function titleCase(value: string): string {
  return value.replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
}

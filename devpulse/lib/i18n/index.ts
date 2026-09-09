import { en, type Dictionary } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import type { Locale } from "@/types/analytics";

export function parseLocale(value: string | string[] | undefined): Locale {
  return value === "es" ? "es" : "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "es" ? es : en;
}

export function localeQuery(locale: Locale): string {
  return locale === "es" ? "lang=es" : "lang=en";
}

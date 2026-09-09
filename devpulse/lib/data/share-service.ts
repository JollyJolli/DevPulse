import "server-only";
import { getProfileDashboardData } from "@/lib/data/profile-service";
import { getYearComparison } from "@/lib/data/comparison-service";
import { trophyName, trophyTier } from "@/lib/i18n/trophies";
import type { Locale } from "@/types/analytics";
import { RANGES } from "@/constants/analytics";
import { parseRange } from "@/lib/utils/strings";

export type ShareCard = { title: string; subtitle: string; value: string; detail: string };
export async function getShareCard(username: string, kind: string, id: string, locale: Locale): Promise<ShareCard | null> {
  if (kind === "comparison") {
    const [from, to] = id.split("-").map(Number);
    const comparison = await getYearComparison(username, from, to, locale);
    if (!comparison) return null;
    return { title: locale === "es" ? "Antes y ahora" : "Then vs now", subtitle: "@" + comparison.userLogin + " · " + from + " → " + to,
      value: comparison.from.contributions + " → " + comparison.to.contributions,
      detail: (locale === "es" ? "Contribuciones · Concentración: " : "Contributions · Focus: ") + comparison.from.focus + " → " + comparison.to.focus };
  }
  if (kind !== "trophy" && kind !== "era") return null;
  const [identifier, range = "ALL"] = id.split("|");
  const data = await getProfileDashboardData(username, kind === "trophy" ? parseRange(range, RANGES) : "ALL", locale, false);
  if (!data) return null;
  if (kind === "trophy") {
    const trophy = data.trophies.highest.find((item) => item.family === identifier);
    if (!trophy) return null;
    return { title: trophyName(trophy.family, locale), subtitle: "@" + data.user.login,
      value: trophyTier(trophy.tier.name, locale), detail: trophy.formattedValue + (locale === "es" ? " · Hito observado ahora" : " · Milestone observed now") };
  }
  const era = data.eras.find((item) => item.id === id);
  if (!era) return null;
  return { title: locale === "es" ? "Era de " + era.dominantLanguage : era.title,
    subtitle: "@" + data.user.login + " · " + era.startYear + "–" + era.endYear,
    value: era.repositoryShare + "%", detail: locale === "es" ? "De los repositorios originales de la era" : "Of original repositories in this era" };
}

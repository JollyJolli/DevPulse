import { calculateActivityDNA } from "@/lib/analytics/activity";
import { calculateFocus } from "@/lib/analytics/focus-score";
import type { ContributionData, LanguageStat, PeriodSnapshot } from "@/types/analytics";

export function buildPeriodSnapshot(
  label: string,
  contributionData: ContributionData,
  languages: readonly LanguageStat[],
): PeriodSnapshot {
  const activity = calculateActivityDNA(contributionData.days);
  const focus = calculateFocus(contributionData.repoContributions);
  return {
    label,
    contributions: contributionData.totalContributions,
    commits: contributionData.totalCommits,
    pullRequests: contributionData.totalPullRequests,
    reviews: contributionData.totalReviews,
    issues: contributionData.totalIssues,
    activeDays: activity.activeDays,
    longestStreak: activity.longestStreak,
    focus: focus.score,
    activeRepositories: new Set(
      contributionData.repoContributions
        .filter((repository) => repository.count > 0)
        .map((repository) => repository.nameWithOwner.toLowerCase()),
    ).size,
    dominantLanguage: languages[0]?.name ?? null,
    languageDiversity: languages.length,
    source: contributionData.source,
    limited: contributionData.limited,
  };
}

export function profileComparisonObservations(
  left: PeriodSnapshot,
  right: PeriodSnapshot,
  locale: "en" | "es" = "en",
): string[] {
  const observations: string[] = [];
  const spanish = locale === "es";
  const focused = left.focus === right.focus ? null : left.focus > right.focus ? left : right;
  if (focused) {
    observations.push(
      spanish
        ? "La actividad medida de " + focused.label + " está más concentrada en sus repositorios dominantes."
        : focused.label + "'s measured activity is more concentrated in dominant repositories.",
    );
  }
  const broader =
    left.activeRepositories === right.activeRepositories
      ? null
      : left.activeRepositories > right.activeRepositories
        ? left
        : right;
  if (broader) {
    observations.push(
      spanish
        ? broader.label + " registró actividad en más repositorios durante este periodo."
        : broader.label + " touched more repositories in this period.",
    );
  }
  if (left.dominantLanguage && right.dominantLanguage && left.dominantLanguage !== right.dominantLanguage) {
    observations.push(
      spanish
        ? "El lenguaje activo principal de " + left.label + " es " + left.dominantLanguage + "; el de " + right.label + " es " + right.dominantLanguage + "."
        : left.label + "'s leading active language is " + left.dominantLanguage + "; " + right.label + "'s is " + right.dominantLanguage + ".",
    );
  }
  const active = left.activeDays === right.activeDays ? null : left.activeDays > right.activeDays ? left : right;
  if (active) {
    observations.push(
      spanish
        ? active.label + " tuvo actividad en más días del calendario durante el periodo seleccionado."
        : active.label + " was active on more calendar days in the selected period.",
    );
  }
  return observations.slice(0, 4);
}

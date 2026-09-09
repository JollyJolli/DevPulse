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
    activeRepositories: contributionData.repoContributions.length,
    dominantLanguage: languages[0]?.name ?? null,
    languageDiversity: languages.length,
    source: contributionData.source,
    limited: contributionData.limited,
  };
}

export function profileComparisonObservations(left: PeriodSnapshot, right: PeriodSnapshot): string[] {
  const observations: string[] = [];
  const focused = left.focus === right.focus ? null : left.focus > right.focus ? left : right;
  if (focused) {
    observations.push(`${focused.label}'s measured activity is concentrated across fewer or more dominant repositories.`);
  }
  const broader =
    left.activeRepositories === right.activeRepositories
      ? null
      : left.activeRepositories > right.activeRepositories
        ? left
        : right;
  if (broader) observations.push(`${broader.label} touched more repositories in this period.`);
  if (left.dominantLanguage && right.dominantLanguage && left.dominantLanguage !== right.dominantLanguage) {
    observations.push(
      `${left.label}'s leading active language is ${left.dominantLanguage}; ${right.label}'s is ${right.dominantLanguage}.`,
    );
  }
  const active = left.activeDays === right.activeDays ? null : left.activeDays > right.activeDays ? left : right;
  if (active) observations.push(`${active.label} was active on more calendar days in the selected period.`);
  return observations.slice(0, 4);
}

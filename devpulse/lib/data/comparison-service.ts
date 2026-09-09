import "server-only";

import { cache } from "react";
import { buildPeriodSnapshot, profileComparisonObservations } from "@/lib/analytics/comparisons";
import { calculateLanguageDistribution } from "@/lib/analytics/languages";
import { getContributionRange } from "@/lib/github/contributions";
import { getRepositories } from "@/lib/github/repositories";
import { getGitHubUser } from "@/lib/github/users";
import { yearDates } from "@/lib/utils/dates";
import { normalizeUsername } from "@/lib/utils/username";
import type { Locale, PeriodSnapshot, RangeKey } from "@/types/analytics";
import type { ProfileComparison } from "@/types/profile";
import { getProfileDashboardData } from "@/lib/data/profile-service";

async function loadProfileComparison(
  leftUsername: string,
  rightUsername: string,
  range: RangeKey,
  locale: Locale,
): Promise<ProfileComparison | null> {
  const [left, right] = await Promise.all([
    getProfileDashboardData(leftUsername, range, locale, false),
    getProfileDashboardData(rightUsername, range, locale, false),
  ]);
  if (!left || !right) return null;
  const leftSnapshot = buildPeriodSnapshot(`@${left.user.login}`, left.contributionData, left.languages);
  const rightSnapshot = buildPeriodSnapshot(`@${right.user.login}`, right.contributionData, right.languages);
  return {
    left,
    right,
    observations: leftSnapshot.source === rightSnapshot.source
      ? profileComparisonObservations(leftSnapshot, rightSnapshot, locale)
      : [],
  };
}

export const getProfileComparison = cache(loadProfileComparison);

export type YearComparison = {
  userLogin: string;
  from: PeriodSnapshot;
  to: PeriodSnapshot;
  observations: string[];
};

async function loadYearComparison(
  rawUsername: string,
  fromYear: number,
  toYear: number,
  locale: Locale = "en",
): Promise<YearComparison | null> {
  const username = normalizeUsername(rawUsername);
  const currentYear = new Date().getUTCFullYear();
  if (
    !username ||
    !Number.isInteger(fromYear) ||
    !Number.isInteger(toYear) ||
    fromYear < 2008 ||
    toYear > currentYear ||
    fromYear >= toYear
  ) return null;
  const [user, repositories] = await Promise.all([
    getGitHubUser(username),
    getRepositories(username),
  ]);
  if (!user) return null;
  const fromDates = yearDates(fromYear);
  const toDates = yearDates(toYear);
  const [fromData, toData] = await Promise.all([
    getContributionRange(user.login, fromDates.from, fromDates.to),
    getContributionRange(user.login, toDates.from, toDates.to),
  ]);
  if (!fromData || !toData) return null;
  const fromLanguages = calculateLanguageDistribution(repositories, fromData.repoContributions);
  const toLanguages = calculateLanguageDistribution(repositories, toData.repoContributions);
  const from = buildPeriodSnapshot(String(fromYear), fromData, fromLanguages);
  const to = buildPeriodSnapshot(String(toYear), toData, toLanguages);
  return {
    userLogin: user.login,
    from,
    to,
    observations: profileComparisonObservations(from, to, locale),
  };
}

export const getYearComparison = cache(loadYearComparison);

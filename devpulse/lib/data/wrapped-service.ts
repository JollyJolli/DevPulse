import "server-only";

import { cache } from "react";
import { calculateActivityDNA } from "@/lib/analytics/activity";
import { detectDeveloperEras, eraForYear } from "@/lib/analytics/eras";
import { calculateFocus } from "@/lib/analytics/focus-score";
import { buildTechJourney, calculateLanguageDistribution } from "@/lib/analytics/languages";
import { buildActiveProjects } from "@/lib/analytics/repositories";
import { buildTrophyFamilies, unlockTrophies } from "@/lib/analytics/trophies";
import { hasGitHubToken } from "@/lib/github/client";
import {
  buildEventFallback,
  getContributionRange,
  getContributionYears,
} from "@/lib/github/contributions";
import { getPublicEvents } from "@/lib/github/events";
import { getRepositories } from "@/lib/github/repositories";
import { getGitHubUser } from "@/lib/github/users";
import { yearDates } from "@/lib/utils/dates";
import { percentage, sum } from "@/lib/utils/numbers";
import { normalizeUsername } from "@/lib/utils/username";
import type { ContributionData } from "@/types/analytics";
import type { WrappedSummary } from "@/types/profile";

function emptyYear(): ContributionData {
  return {
    source: "events",
    limited: true,
    totalContributions: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalPullRequests: 0,
    totalReviews: 0,
    totalRepositoriesCreated: 0,
    days: [],
    repoContributions: [],
  };
}

async function loadWrappedSummary(
  rawUsername: string,
  year: number,
  refresh: boolean,
): Promise<WrappedSummary | null> {
  const username = normalizeUsername(rawUsername);
  const currentYear = new Date().getUTCFullYear();
  if (!username || !Number.isInteger(year) || year < 2008 || year > currentYear) return null;
  const [user, repositories] = await Promise.all([
    getGitHubUser(username, refresh),
    getRepositories(username, refresh),
  ]);
  if (!user || year < new Date(user.created_at).getUTCFullYear()) return null;

  let contributionData: ContributionData | null = null;
  let availableYears = hasGitHubToken() ? await getContributionYears(user.login, refresh) : [];
  if (hasGitHubToken()) {
    const dates = yearDates(year);
    contributionData = await getContributionRange(user.login, dates.from, dates.to, refresh);
  } else if (year === currentYear) {
    contributionData = buildEventFallback(await getPublicEvents(user.login, refresh), "30D");
  }
  contributionData ??= emptyYear();
  if (!availableYears.length) {
    availableYears = [
      ...new Set([
        currentYear,
        ...repositories.map((repo) => new Date(repo.created_at).getUTCFullYear()),
      ]),
    ].sort((a, b) => b - a);
  }

  const activity = calculateActivityDNA(contributionData.days);
  const focus = calculateFocus(contributionData.repoContributions);
  const languages = calculateLanguageDistribution(repositories, contributionData.repoContributions);
  const activeProjects = buildActiveProjects(repositories, contributionData.repoContributions);
  const projectsStarted = repositories.filter(
    (repo) => !repo.fork && new Date(repo.created_at).getUTCFullYear() === year,
  );
  const externalCount = sum(
    contributionData.repoContributions
      .filter((repo) => repo.nameWithOwner.split("/")[0]?.toLowerCase() !== user.login.toLowerCase())
      .map((repo) => repo.count),
  );
  const totalRepoActivity = sum(contributionData.repoContributions.map((repo) => repo.count));
  const journey = buildTechJourney(repositories);
  const eras = detectDeveloperEras(journey, repositories);
  const trophyFamilies = buildTrophyFamilies({
    user,
    repositories,
    contributionData,
    activity,
    languages,
    externalContributionPercentage: percentage(externalCount, totalRepoActivity),
  });

  return {
    user,
    year,
    contributionData,
    activity,
    focus,
    languages,
    topProject: activeProjects.find((project) => project.count > 0) ?? null,
    projectsStarted,
    trophies: unlockTrophies(trophyFamilies),
    era: eraForYear(eras, year),
    availableYears,
  };
}

export const getWrappedSummary = cache(loadWrappedSummary);

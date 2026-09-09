import "server-only";

import { cache } from "react";
import { allowRefresh } from "@/lib/cache/refresh";
import { calculateActivityDNA, contributionBuckets } from "@/lib/analytics/activity";
import { detectDeveloperEras } from "@/lib/analytics/eras";
import { calculateFocus } from "@/lib/analytics/focus-score";
import { buildTechJourney, calculateLanguageDistribution } from "@/lib/analytics/languages";
import {
  buildActiveProjects,
  calculateRepositoryHealth,
  classifyGraveyard,
} from "@/lib/analytics/repositories";
import { buildDeveloperTimeline } from "@/lib/analytics/timeline";
import { buildTrophyFamilies, unlockTrophies } from "@/lib/analytics/trophies";
import { hasGitHubToken } from "@/lib/github/client";
import {
  buildEventFallback,
  getAllTimeContributions,
  getContributionRange,
} from "@/lib/github/contributions";
import { GitHubApiError, publicGitHubErrorMessage } from "@/lib/github/errors";
import { getPublicEvents } from "@/lib/github/events";
import { getRepositories } from "@/lib/github/repositories";
import { getGitHubUser } from "@/lib/github/users";
import { rangeDates } from "@/lib/utils/dates";
import { percentage, sum } from "@/lib/utils/numbers";
import { normalizeUsername } from "@/lib/utils/username";
import type { ContributionData, Locale, RangeKey } from "@/types/analytics";
import type { ProfileDashboardData } from "@/types/profile";

function safeWebsite(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function fallbackYears(createdAt: string, repositories: ProfileDashboardData["repositories"]): number[] {
  const currentYear = new Date().getUTCFullYear();
  const createdYear = new Date(createdAt).getUTCFullYear();
  return [
    ...new Set([
      currentYear,
      createdYear,
      ...repositories.map((repo) => new Date(repo.created_at).getUTCFullYear()),
    ]),
  ]
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a);
}

async function loadProfileDashboardData(
  rawUsername: string,
  range: RangeKey,
  locale: Locale,
  refresh: boolean,
): Promise<ProfileDashboardData | null> {
  const username = normalizeUsername(rawUsername);
  if (!username) return null;
  refresh = allowRefresh("profile:" + username, refresh);
  const [user, repositories] = await Promise.all([
    getGitHubUser(username, refresh),
    getRepositories(username, refresh),
  ]);
  if (!user) return null;

  let contributionData: ContributionData | null = null;
  let previousContributionData: ContributionData | null = null;
  let availableYears: number[] = [];
  let dataNotice: ProfileDashboardData["dataNotice"] = "deep";
  let dataNoticeMessage: string | null = null;

  if (hasGitHubToken()) {
    try {
      if (range === "ALL") {
        const allTime = await getAllTimeContributions(user.login, refresh);
        contributionData = allTime.data;
        availableYears = allTime.years;
      } else {
        const dates = rangeDates(range);
        [contributionData, previousContributionData] = await Promise.all([
          getContributionRange(user.login, dates.currentFrom, dates.currentTo, refresh),
          getContributionRange(user.login, dates.previousFrom, dates.previousTo, refresh),
        ]);
      }
    } catch (error) {
      dataNotice =
        error instanceof GitHubApiError && error.kind === "rate-limit" ? "rate-limit" : "partial";
      dataNoticeMessage = publicGitHubErrorMessage(error);
    }
  } else {
    dataNotice = "basic";
  }

  if (!contributionData) {
    const events = await getPublicEvents(user.login, refresh);
    contributionData = buildEventFallback(events, range);
  }

  if (!availableYears.length) availableYears = fallbackYears(user.created_at, repositories);
  const activeProjects = buildActiveProjects(
    repositories,
    contributionData.repoContributions,
    previousContributionData?.repoContributions,
  );
  const focus = calculateFocus(contributionData.repoContributions);
  const activity = calculateActivityDNA(contributionData.days);
  const languages = calculateLanguageDistribution(repositories, contributionData.repoContributions);
  const originalRepositories = repositories.filter((repo) => !repo.fork);
  const forkedRepositories = repositories.filter((repo) => repo.fork);
  const totalStars = sum(repositories.map((repo) => repo.stargazers_count));
  const totalForks = sum(repositories.map((repo) => repo.forks_count));
  const totalProjectActivity = sum(contributionData.repoContributions.map((repo) => repo.count));
  const externalContributionCount = sum(
    contributionData.repoContributions
      .filter(
        (repo) =>
          repo.nameWithOwner.split("/")[0]?.toLowerCase() !== user.login.toLowerCase(),
      )
      .map((repo) => repo.count),
  );
  const externalContributionPercentage = percentage(
    externalContributionCount,
    totalProjectActivity,
  );
  const techJourney = buildTechJourney(repositories);
  const eras = detectDeveloperEras(techJourney, repositories);
  const trophyFamilies = buildTrophyFamilies({
    user,
    repositories,
    contributionData,
    activity,
    languages,
    externalContributionPercentage,
  });
  const previousFocus = previousContributionData
    ? calculateFocus(previousContributionData.repoContributions)
    : null;
  const sortedByStars = [...repositories].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  const sortedByForks = [...repositories].sort((a, b) => b.forks_count - a.forks_count);
  const sortedByCreated = [...repositories].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const sortedByPush = [...repositories].sort(
    (a, b) =>
      new Date(b.pushed_at ?? 0).getTime() - new Date(a.pushed_at ?? 0).getTime(),
  );

  return {
    user,
    repositories,
    range,
    locale,
    refreshed: refresh,
    dataNotice,
    dataNoticeMessage,
    contributionData,
    previousContributionData,
    activeProjects,
    currentFocus: activeProjects.filter((project) => project.count > 0).slice(0, 3),
    focus,
    activity,
    languages,
    contributionBars: contributionBuckets(contributionData.days, 28),
    heatmapDays: range === "ALL" ? contributionData.days.slice(-365) : contributionData.days,
    totalStars,
    totalForks,
    originalRepositories,
    forkedRepositories,
    graveyard: classifyGraveyard(repositories),
    mostStarredRepository: sortedByStars[0],
    mostForkedRepository: sortedByForks[0],
    newestRepository: sortedByCreated.at(-1),
    oldestRepository: sortedByCreated[0],
    latestRepository: sortedByPush[0],
    coverage: {
      descriptions: percentage(
        repositories.filter((repo) => Boolean(repo.description)).length,
        repositories.length,
      ),
      licenses: percentage(
        originalRepositories.filter((repo) => Boolean(repo.license)).length,
        originalRepositories.length,
      ),
      topics: percentage(
        repositories.filter((repo) => repo.topics.length > 0).length,
        repositories.length,
      ),
      websites: percentage(
        repositories.filter((repo) => Boolean(repo.homepage)).length,
        repositories.length,
      ),
    },
    externalContributionPercentage,
    trends: {
      activity:
        previousContributionData && previousContributionData.totalContributions > 0
          ? Math.round(
              ((contributionData.totalContributions -
                previousContributionData.totalContributions) /
                previousContributionData.totalContributions) *
                100,
            )
          : null,
      focus: previousFocus ? focus.score - previousFocus.score : null,
      activeRepositories: previousContributionData
        ? contributionData.repoContributions.length -
          previousContributionData.repoContributions.length
        : null,
    },
    trophies: unlockTrophies(trophyFamilies),
    website: safeWebsite(user.blog),
    eras,
    techJourney,
    timeline: buildDeveloperTimeline({ user, repositories, eras, techJourney }),
    availableYears,
  };
}

export const getProfileDashboardData = cache(loadProfileDashboardData);

export function averageRepositoryHealth(data: ProfileDashboardData): number {
  if (!data.repositories.length) return 0;
  return Math.round(
    sum(data.repositories.map((repo) => calculateRepositoryHealth(repo).score)) /
      data.repositories.length,
  );
}

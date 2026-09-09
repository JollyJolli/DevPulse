import "server-only";

import { cache } from "react";
import { allowRefresh } from "@/lib/cache/refresh";
import { buildWrappedSummary } from "@/lib/analytics/wrapped";
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
  refresh = allowRefresh("wrapped:" + username, refresh);
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
    const events = (await getPublicEvents(user.login, refresh)).filter((event) => new Date(event.created_at).getUTCFullYear() === year);
    contributionData = { ...buildEventFallback(events, "30D"), limited: true };
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

  return buildWrappedSummary(user, repositories, contributionData, year, availableYears);
}

export const getWrappedSummary = cache(loadWrappedSummary);

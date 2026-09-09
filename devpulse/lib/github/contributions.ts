import "server-only";

import { CACHE_SECONDS, RANGE_DAYS } from "@/constants/analytics";
import { githubGraphQL } from "@/lib/github/client";
import { CONTRIBUTION_QUERY, CONTRIBUTION_YEARS_QUERY } from "@/lib/github/queries";
import { addDays, isoDay, isClosedHistoricalYear, startOfUtcDay, yearDates } from "@/lib/utils/dates";
import type { ContributionData, RangeKey, RepoContribution } from "@/types/analytics";
import type {
  GitHubEvent,
  GqlContributionCollection,
  GqlRangeResponse,
  GqlYearsResponse,
} from "@/types/github";

export function convertContributionCollection(
  collection: GqlContributionCollection,
): ContributionData {
  const days = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));
  const repoContributions = collection.commitContributionsByRepository
    .map((item) => ({
      name: item.repository.name,
      nameWithOwner: item.repository.nameWithOwner,
      url: item.repository.url,
      count: item.contributions.totalCount,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    source: "graphql",
    limited: false,
    totalContributions: collection.contributionCalendar.totalContributions,
    totalCommits: collection.totalCommitContributions,
    totalIssues: collection.totalIssueContributions,
    totalPullRequests: collection.totalPullRequestContributions,
    totalReviews: collection.totalPullRequestReviewContributions,
    totalRepositoriesCreated: collection.totalRepositoryContributions,
    days,
    repoContributions,
  };
}

export async function getContributionRange(
  username: string,
  from: Date,
  to: Date,
  refresh = false,
): Promise<ContributionData | null> {
  const revalidate = isClosedHistoricalYear(to.getUTCFullYear())
    ? CACHE_SECONDS.historicalYear
    : CACHE_SECONDS.currentYear;
  const data = await githubGraphQL<GqlRangeResponse>(
    CONTRIBUTION_QUERY,
    { login: username, from: from.toISOString(), to: to.toISOString() },
    { refresh, revalidate, allowNotFound: true },
  );
  const collection = data?.user?.contributionsCollection;
  return collection ? convertContributionCollection(collection) : null;
}

export async function getContributionYears(
  username: string,
  refresh = false,
): Promise<number[]> {
  const data = await githubGraphQL<GqlYearsResponse>(
    CONTRIBUTION_YEARS_QUERY,
    { login: username },
    { refresh, revalidate: CACHE_SECONDS.profile, allowNotFound: true },
  );
  return [...(data?.user?.contributionsCollection.contributionYears ?? [])].sort(
    (a, b) => b - a,
  );
}

export function mergeContributionData(pieces: readonly ContributionData[]): ContributionData {
  const dayMap = new Map<string, number>();
  const repoMap = new Map<string, RepoContribution>();
  const totals = {
    totalContributions: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalPullRequests: 0,
    totalReviews: 0,
    totalRepositoriesCreated: 0,
  };

  for (const piece of pieces) {
    totals.totalContributions += piece.totalContributions;
    totals.totalCommits += piece.totalCommits;
    totals.totalIssues += piece.totalIssues;
    totals.totalPullRequests += piece.totalPullRequests;
    totals.totalReviews += piece.totalReviews;
    totals.totalRepositoriesCreated += piece.totalRepositoriesCreated;
    for (const day of piece.days) {
      dayMap.set(day.date, Math.max(dayMap.get(day.date) ?? 0, day.contributionCount));
    }
    for (const repo of piece.repoContributions) {
      const key = repo.nameWithOwner.toLowerCase();
      const existing = repoMap.get(key);
      repoMap.set(key, existing ? { ...existing, count: existing.count + repo.count } : { ...repo });
    }
  }

  return {
    source: "graphql",
    limited: false,
    ...totals,
    days: [...dayMap.entries()]
      .map(([date, contributionCount]) => ({ date, contributionCount }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    repoContributions: [...repoMap.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getAllTimeContributions(
  username: string,
  refresh = false,
): Promise<{ data: ContributionData | null; years: number[] }> {
  const years = await getContributionYears(username, refresh);
  const pieces: ContributionData[] = [];

  // Three requests at a time avoids a burst on long-lived accounts.
  for (let index = 0; index < years.length; index += 3) {
    const batch = years.slice(index, index + 3);
    const results = await Promise.all(
      batch.map((year) => {
        const { from, to } = yearDates(year);
        return getContributionRange(username, from, to, refresh);
      }),
    );
    pieces.push(...results.filter((piece): piece is ContributionData => piece !== null));
  }

  return { data: pieces.length ? mergeContributionData(pieces) : null, years };
}

export function buildEventFallback(
  events: readonly GitHubEvent[],
  range: RangeKey,
  now = new Date(),
): ContributionData {
  const requestedDays = range === "ALL" ? 30 : RANGE_DAYS[range];
  const daysAvailable = Math.min(requestedDays, 30);
  const from = startOfUtcDay(addDays(now, -(daysAvailable - 1)));
  const filtered = events.filter((event) => new Date(event.created_at) >= from);
  const dayMap = new Map<string, number>();

  for (let offset = daysAvailable - 1; offset >= 0; offset -= 1) {
    dayMap.set(isoDay(addDays(now, -offset)), 0);
  }

  const repoMap = new Map<string, RepoContribution>();
  for (const event of filtered) {
    const date = event.created_at.slice(0, 10);
    dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
    const key = event.repo.name.toLowerCase();
    const existing = repoMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      const [, repoName = event.repo.name] = event.repo.name.split("/");
      repoMap.set(key, {
        name: repoName,
        nameWithOwner: event.repo.name,
        url: `https://github.com/${event.repo.name}`,
        count: 1,
      });
    }
  }

  return {
    source: "events",
    limited: range !== "7D" && range !== "30D",
    totalContributions: filtered.length,
    totalCommits: filtered.filter((event) => event.type === "PushEvent").length,
    totalIssues: filtered.filter((event) => event.type === "IssuesEvent").length,
    totalPullRequests: filtered.filter((event) => event.type === "PullRequestEvent").length,
    totalReviews: filtered.filter((event) => event.type === "PullRequestReviewEvent").length,
    totalRepositoriesCreated: filtered.filter((event) => event.type === "CreateEvent").length,
    days: [...dayMap.entries()].map(([date, contributionCount]) => ({
      date,
      contributionCount,
    })),
    repoContributions: [...repoMap.values()].sort((a, b) => b.count - a.count),
  };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Code2,
  GitBranch,
  RefreshCw,
} from "lucide-react";

/* =========================================================
   TYPES
   ========================================================= */

type RangeKey = "7D" | "30D" | "90D" | "1Y" | "ALL";

type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  homepage: string | null;
  topics?: string[];
  license: {
    spdx_id: string;
  } | null;
};

type GitHubEvent = {
  id: string;
  type: string;
  repo: {
    name: string;
    url: string;
  };
  created_at: string;
};

type ContributionDay = {
  date: string;
  contributionCount: number;
};

type RepoContribution = {
  name: string;
  nameWithOwner: string;
  url: string;
  count: number;
};

type ContributionData = {
  source: "graphql" | "events";
  limited: boolean;

  totalContributions: number;
  totalCommits: number;
  totalIssues: number;
  totalPullRequests: number;
  totalReviews: number;
  totalRepositoriesCreated: number;

  days: ContributionDay[];
  repoContributions: RepoContribution[];
};

type GqlContributionCollection = {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoryContributions: number;

  contributionCalendar: {
    totalContributions: number;
    weeks: {
      contributionDays: ContributionDay[];
    }[];
  };

  commitContributionsByRepository: {
    repository: {
      name: string;
      nameWithOwner: string;
      url: string;
    };

    contributions: {
      totalCount: number;
    };
  }[];
};

type GqlRangeResponse = {
  user: {
    contributionsCollection: GqlContributionCollection;
  } | null;
};

type GqlYearsResponse = {
  user: {
    contributionsCollection: {
      contributionYears: number[];
    };
  } | null;
};

type TrophyTier = {
  name: string;
  color: string;
};

type TrophyFamily = {
  name: string;
  description: string;
  value: number;
  thresholds: number[];
  formatter?: (value: number) => string;
};

type UnlockedTrophy = {
  family: string;
  description: string;
  tier: TrophyTier;
  tierIndex: number;
  threshold: number;
  value: number;
  formattedValue: string;
};

/* =========================================================
   CONFIG
   ========================================================= */

const RANGES: RangeKey[] = ["7D", "30D", "90D", "1Y", "ALL"];

const TROPHY_TIERS: TrophyTier[] = [
  { name: "Bronze", color: "#CD7F32" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "Gold", color: "#FFD84D" },
  { name: "Emerald", color: "#50C878" },
  { name: "Platinum", color: "#E5E4E2" },
  { name: "Diamond", color: "#78E6D0" },
  { name: "Master", color: "#FF6B8A" },
  { name: "Mythic", color: "#8B5CF6" },
];

const CACHE_SECONDS = 15 * 60;

/* =========================================================
   GITHUB API
   ========================================================= */

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubRest<T>(
  url: string,
  refresh = false,
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
      ...(refresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: CACHE_SECONDS } }),
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      console.error(
        `GitHub REST error ${response.status}: ${await response.text()}`,
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("GitHub REST request failed:", error);
    return null;
  }
}

async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  refresh = false,
): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) return null;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      ...(refresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: CACHE_SECONDS } }),
    });

    if (!response.ok) {
      console.error(
        `GitHub GraphQL error ${response.status}: ${await response.text()}`,
      );
      return null;
    }

    const result = (await response.json()) as {
      data?: T;
      errors?: {
        message: string;
      }[];
    };

    if (result.errors?.length) {
      console.error("GitHub GraphQL:", result.errors);
      return null;
    }

    return result.data ?? null;
  } catch (error) {
    console.error("GitHub GraphQL request failed:", error);
    return null;
  }
}

async function getUser(
  username: string,
  refresh: boolean,
): Promise<GitHubUser | null> {
  return githubRest<GitHubUser>(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    refresh,
  );
}

async function getAllRepos(
  username: string,
  refresh: boolean,
): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];

  // Cap at 1000 public repositories to avoid absurd API usage.
  for (let page = 1; page <= 10; page += 1) {
    const repos = await githubRest<GitHubRepo[]>(
      `https://api.github.com/users/${encodeURIComponent(
        username,
      )}/repos?type=owner&sort=pushed&direction=desc&per_page=100&page=${page}`,
      refresh,
    );

    if (!repos) break;

    allRepos.push(...repos);

    if (repos.length < 100) break;
  }

  return allRepos;
}

async function getPublicEvents(
  username: string,
  refresh: boolean,
): Promise<GitHubEvent[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      githubRest<GitHubEvent[]>(
        `https://api.github.com/users/${encodeURIComponent(
          username,
        )}/events/public?per_page=100&page=${page}`,
        refresh,
      ),
    ),
  );

  return pages.flatMap((page) => page ?? []);
}

/* =========================================================
   CONTRIBUTIONS
   ========================================================= */

const CONTRIBUTION_QUERY = `
  query DevPulseContributionRange(
    $login: String!,
    $from: DateTime!,
    $to: DateTime!
  ) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions

        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }

        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            url
          }

          contributions(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;

const CONTRIBUTION_YEARS_QUERY = `
  query DevPulseContributionYears($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

function subtractDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - amount);
  return copy;
}

function rangeDates(range: Exclude<RangeKey, "ALL">) {
  const days =
    range === "7D"
      ? 7
      : range === "30D"
        ? 30
        : range === "90D"
          ? 90
          : 365;

  const now = new Date();

  const currentFrom = subtractDays(now, days - 1);
  currentFrom.setUTCHours(0, 0, 0, 0);

  const currentTo = new Date(now);

  const previousTo = subtractDays(currentFrom, 1);
  previousTo.setUTCHours(23, 59, 59, 999);

  const previousFrom = subtractDays(previousTo, days - 1);
  previousFrom.setUTCHours(0, 0, 0, 0);

  return {
    currentFrom,
    currentTo,
    previousFrom,
    previousTo,
  };
}

function convertContributionCollection(
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

async function getContributionRange(
  username: string,
  from: Date,
  to: Date,
  refresh: boolean,
): Promise<ContributionData | null> {
  const data = await githubGraphQL<GqlRangeResponse>(
    CONTRIBUTION_QUERY,
    {
      login: username,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    refresh,
  );

  const collection = data?.user?.contributionsCollection;

  if (!collection) return null;

  return convertContributionCollection(collection);
}

function mergeContributionData(
  pieces: ContributionData[],
): ContributionData {
  const dayMap = new Map<string, number>();
  const repoMap = new Map<string, RepoContribution>();

  let totalContributions = 0;
  let totalCommits = 0;
  let totalIssues = 0;
  let totalPullRequests = 0;
  let totalReviews = 0;
  let totalRepositoriesCreated = 0;

  for (const piece of pieces) {
    totalContributions += piece.totalContributions;
    totalCommits += piece.totalCommits;
    totalIssues += piece.totalIssues;
    totalPullRequests += piece.totalPullRequests;
    totalReviews += piece.totalReviews;
    totalRepositoriesCreated += piece.totalRepositoriesCreated;

    for (const day of piece.days) {
      const current = dayMap.get(day.date) ?? 0;
      dayMap.set(day.date, Math.max(current, day.contributionCount));
    }

    for (const repo of piece.repoContributions) {
      const existing = repoMap.get(repo.nameWithOwner.toLowerCase());

      if (existing) {
        existing.count += repo.count;
      } else {
        repoMap.set(repo.nameWithOwner.toLowerCase(), { ...repo });
      }
    }
  }

  return {
    source: "graphql",
    limited: false,

    totalContributions,
    totalCommits,
    totalIssues,
    totalPullRequests,
    totalReviews,
    totalRepositoriesCreated,

    days: [...dayMap.entries()]
      .map(([date, contributionCount]) => ({
        date,
        contributionCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),

    repoContributions: [...repoMap.values()].sort(
      (a, b) => b.count - a.count,
    ),
  };
}

async function getAllTimeContributions(
  username: string,
  refresh: boolean,
): Promise<ContributionData | null> {
  const yearsData = await githubGraphQL<GqlYearsResponse>(
    CONTRIBUTION_YEARS_QUERY,
    {
      login: username,
    },
    refresh,
  );

  const years =
    yearsData?.user?.contributionsCollection.contributionYears ?? [];

  if (!years.length) return null;

  const now = new Date();

  const pieces = await Promise.all(
    years.map(async (year) => {
      const from = new Date(`${year}-01-01T00:00:00.000Z`);

      const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

      const to =
        year === now.getUTCFullYear() && yearEnd > now ? now : yearEnd;

      return getContributionRange(username, from, to, refresh);
    }),
  );

  const validPieces = pieces.filter(
    (piece): piece is ContributionData => piece !== null,
  );

  if (!validPieces.length) return null;

  return mergeContributionData(validPieces);
}

/* =========================================================
   FALLBACK EVENTS
   ========================================================= */

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildEventFallback(
  events: GitHubEvent[],
  range: RangeKey,
): ContributionData {
  const requestedDays =
    range === "7D"
      ? 7
      : range === "30D"
        ? 30
        : range === "90D"
          ? 90
          : range === "1Y"
            ? 365
            : 30;

  // Public Events API only gives recent activity.
  const daysAvailable = Math.min(requestedDays, 30);

  const now = new Date();

  const from = subtractDays(now, daysAvailable - 1);
  from.setUTCHours(0, 0, 0, 0);

  const filtered = events.filter(
    (event) => new Date(event.created_at) >= from,
  );

  const dayMap = new Map<string, number>();

  for (let i = 0; i < daysAvailable; i += 1) {
    dayMap.set(isoDay(subtractDays(now, daysAvailable - 1 - i)), 0);
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

    // In fallback mode this is push events, NOT real commit count.
    totalCommits: filtered.filter((event) => event.type === "PushEvent")
      .length,

    totalIssues: filtered.filter((event) => event.type === "IssuesEvent")
      .length,

    totalPullRequests: filtered.filter(
      (event) => event.type === "PullRequestEvent",
    ).length,

    totalReviews: filtered.filter(
      (event) => event.type === "PullRequestReviewEvent",
    ).length,

    totalRepositoriesCreated: 0,

    days: [...dayMap.entries()].map(([date, contributionCount]) => ({
      date,
      contributionCount,
    })),

    repoContributions: [...repoMap.values()].sort(
      (a, b) => b.count - a.count,
    ),
  };
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function sum(numbers: number[]) {
  return numbers.reduce((total, value) => total + value, 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function daysSince(date: string | null) {
  if (!date) return Number.POSITIVE_INFINITY;

  return Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

function relativeAge(date: string | null) {
  if (!date) return "unknown";

  const days = daysSince(date);

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;

  return `${(days / 365).toFixed(1)}y ago`;
}

function calculateFocus(repoContributions: RepoContribution[]) {
  const counts = repoContributions
    .map((repo) => repo.count)
    .filter((count) => count > 0);

  const total = sum(counts);

  if (!total) {
    return {
      score: 0,
      topThreeShare: 0,
      label: "No activity",
    };
  }

  const shares = counts.map((count) => count / total);

  // Herfindahl-style concentration.
  const concentration = sum(shares.map((share) => share * share));

  const score = Math.round(concentration * 100);

  const topThreeShare = Math.round(
    (sum(counts.slice(0, 3)) / total) * 100,
  );

  return {
    score,
    topThreeShare,
    label:
      score >= 70
        ? "Highly focused"
        : score >= 40
          ? "Balanced focus"
          : "Highly distributed",
  };
}

function calculateStreaks(days: ContributionDay[]) {
  const sorted = [...days].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  let longest = 0;
  let running = 0;

  for (const day of sorted) {
    if (day.contributionCount > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let index = sorted.length - 1;

  const today = isoDay(new Date());

  if (
    index >= 0 &&
    sorted[index].date === today &&
    sorted[index].contributionCount === 0
  ) {
    index -= 1;
  }

  let current = 0;

  while (index >= 0 && sorted[index].contributionCount > 0) {
    current += 1;
    index -= 1;
  }

  return {
    current,
    longest,
  };
}

function contributionBuckets(
  days: ContributionDay[],
  maxBuckets = 28,
) {
  if (!days.length) return [];

  const bucketSize = Math.max(
    1,
    Math.ceil(days.length / maxBuckets),
  );

  const buckets: number[] = [];

  for (let i = 0; i < days.length; i += bucketSize) {
    buckets.push(
      sum(
        days
          .slice(i, i + bucketSize)
          .map((day) => day.contributionCount),
      ),
    );
  }

  return buckets;
}

function weekdayActivity(days: ContributionDay[]) {
  const values = [0, 0, 0, 0, 0, 0, 0];

  for (const day of days) {
    const weekday = new Date(`${day.date}T12:00:00Z`).getUTCDay();

    // Convert Sun=0 to Monday-first.
    const index = weekday === 0 ? 6 : weekday - 1;

    values[index] += day.contributionCount;
  }

  return ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
    (day, index) => ({
      day,
      value: values[index],
    }),
  );
}

function calculateLanguageDistribution(
  repos: GitHubRepo[],
  activeProjects: RepoContribution[],
) {
  const repoMap = new Map(
    repos.map((repo) => [repo.full_name.toLowerCase(), repo]),
  );

  const activeLanguageMap = new Map<string, number>();

  for (const project of activeProjects) {
    const repo = repoMap.get(project.nameWithOwner.toLowerCase());

    if (!repo?.language) continue;

    activeLanguageMap.set(
      repo.language,
      (activeLanguageMap.get(repo.language) ?? 0) + project.count,
    );
  }

  let entries = [...activeLanguageMap.entries()];

  // If contribution data does not map to owned repos,
  // fall back to primary languages across owned repositories.
  if (!entries.length) {
    const fallback = new Map<string, number>();

    for (const repo of repos) {
      if (!repo.language) continue;

      fallback.set(
        repo.language,
        (fallback.get(repo.language) ?? 0) + 1,
      );
    }

    entries = [...fallback.entries()];
  }

  entries.sort((a, b) => b[1] - a[1]);

  const total = sum(entries.map((entry) => entry[1]));

  return entries.slice(0, 8).map(([name, value]) => ({
    name,
    value,
    percentage: total
      ? Math.round((value / total) * 100)
      : 0,
  }));
}

function contributionIntensity(
  count: number,
  max: number,
) {
  if (count === 0) return "#FFFFFF22";

  const ratio = max ? count / max : 0;

  if (ratio < 0.25) return "#78E6D0";
  if (ratio < 0.5) return "#D8FF54";
  if (ratio < 0.75) return "#FFD84D";

  return "#FF6B8A";
}

/* =========================================================
   TROPHIES
   ========================================================= */

function trophyFamilies(args: {
  user: GitHubUser;
  repos: GitHubRepo[];
  contributionData: ContributionData;
}) {
  const { user, repos, contributionData } = args;

  const originalRepos = repos.filter((repo) => !repo.fork);
  const forkedRepos = repos.filter((repo) => repo.fork);

  const totalStars = sum(
    repos.map((repo) => repo.stargazers_count),
  );

  const totalForks = sum(repos.map((repo) => repo.forks_count));

  const maxStars = Math.max(
    0,
    ...repos.map((repo) => repo.stargazers_count),
  );

  const maxForks = Math.max(
    0,
    ...repos.map((repo) => repo.forks_count),
  );

  const languages = new Set(
    repos
      .map((repo) => repo.language)
      .filter((language): language is string => Boolean(language)),
  );

  const active30 = repos.filter(
    (repo) => daysSince(repo.pushed_at) <= 30,
  ).length;

  const active90 = repos.filter(
    (repo) => daysSince(repo.pushed_at) <= 90,
  ).length;

  const active365 = repos.filter(
    (repo) => daysSince(repo.pushed_at) <= 365,
  ).length;

  const accountYears =
    daysSince(user.created_at) / 365.25;

  const oldestRepoYears = repos.length
    ? Math.max(
        ...repos.map(
          (repo) => daysSince(repo.created_at) / 365.25,
        ),
      )
    : 0;

  // GitHub repo size is reported in KB.
  // This is NOT total lines of code.
  const totalSizeMb =
    sum(repos.map((repo) => repo.size)) / 1024;

  const stableFamilies: TrophyFamily[] = [
    {
      name: "Builder",
      description: "Public repositories created",
      value: repos.length,
      thresholds: [1, 2, 5, 10, 20, 35, 60, 100],
    },
    {
      name: "Original Builder",
      description: "Original non-fork repositories",
      value: originalRepos.length,
      thresholds: [1, 2, 5, 10, 20, 35, 60, 100],
    },
    {
      name: "Fork Explorer",
      description: "Forked repositories",
      value: forkedRepos.length,
      thresholds: [1, 2, 5, 10, 20, 40, 75, 150],
    },
    {
      name: "Star Power",
      description: "Total stars received",
      value: totalStars,
      thresholds: [1, 5, 10, 25, 50, 100, 500, 1000],
    },
    {
      name: "Spotlight",
      description: "Stars on the most-starred project",
      value: maxStars,
      thresholds: [1, 5, 10, 25, 50, 100, 500, 1000],
    },
    {
      name: "Fork Magnet",
      description: "Total forks received",
      value: totalForks,
      thresholds: [1, 3, 5, 10, 25, 50, 100, 250],
    },
    {
      name: "Remix Magnet",
      description: "Forks on the most-forked project",
      value: maxForks,
      thresholds: [1, 3, 5, 10, 25, 50, 100, 250],
    },
    {
      name: "Audience",
      description: "GitHub followers",
      value: user.followers,
      thresholds: [1, 5, 10, 25, 50, 100, 500, 1000],
    },
    {
      name: "Networker",
      description: "Developers followed",
      value: user.following,
      thresholds: [1, 5, 10, 25, 50, 100, 250, 500],
    },
    {
      name: "Gist Crafter",
      description: "Public Gists",
      value: user.public_gists,
      thresholds: [1, 2, 5, 10, 20, 50, 100, 250],
    },
    {
      name: "Veteran",
      description: "Years on GitHub",
      value: accountYears,
      thresholds: [0.25, 0.5, 1, 2, 3, 5, 8, 12],
      formatter: (value) => `${value.toFixed(1)}y`,
    },
    {
      name: "Polyglot",
      description: "Primary languages across public repos",
      value: languages.size,
      thresholds: [1, 2, 3, 5, 7, 10, 15, 20],
    },
    {
      name: "Active Arsenal",
      description: "Repositories pushed in the last 90 days",
      value: active90,
      thresholds: [1, 2, 3, 5, 8, 12, 20, 30],
    },
    {
      name: "On Fire",
      description: "Repositories pushed in the last 30 days",
      value: active30,
      thresholds: [1, 2, 3, 5, 8, 12, 20, 30],
    },
    {
      name: "Code Footprint",
      description:
        "Public repository size reported by GitHub — not LOC",
      value: totalSizeMb,
      thresholds: [0.01, 0.1, 1, 5, 10, 25, 50, 100],
      formatter: (value) =>
        value < 1
          ? `${Math.round(value * 1024)} KB`
          : `${value.toFixed(1)} MB`,
    },
    {
      name: "Popular Portfolio",
      description: "Repositories with at least one star",
      value: repos.filter((repo) => repo.stargazers_count >= 1)
        .length,
      thresholds: [1, 2, 3, 5, 10, 15, 25, 50],
    },
    {
      name: "Breakout Projects",
      description: "Repositories with 10+ stars",
      value: repos.filter((repo) => repo.stargazers_count >= 10)
        .length,
      thresholds: [1, 2, 3, 5, 8, 12, 20, 30],
    },
    {
      name: "Long Haul",
      description: "Age of the oldest public repository",
      value: oldestRepoYears,
      thresholds: [0.25, 0.5, 1, 2, 3, 5, 8, 12],
      formatter: (value) => `${value.toFixed(1)}y`,
    },
    {
      name: "Maintainer",
      description: "Repositories touched in the last year",
      value: active365,
      thresholds: [1, 2, 5, 10, 20, 35, 60, 100],
    },
    {
      name: "Archivist",
      description: "Archived public repositories",
      value: repos.filter((repo) => repo.archived).length,
      thresholds: [1, 2, 5, 10, 20, 35, 60, 100],
    },
  ];

  // Add activity trophies only when GraphQL gives real contribution data.
  if (contributionData.source === "graphql") {
    stableFamilies.push(
      {
        name: "Committer",
        description: "Commits in the selected period",
        value: contributionData.totalCommits,
        thresholds: [1, 10, 25, 50, 100, 250, 500, 1000],
      },
      {
        name: "Contributor",
        description: "GitHub contributions in the selected period",
        value: contributionData.totalContributions,
        thresholds: [1, 25, 50, 100, 250, 500, 1000, 2500],
      },
      {
        name: "PR Pilot",
        description: "Pull requests opened in the selected period",
        value: contributionData.totalPullRequests,
        thresholds: [1, 3, 5, 10, 25, 50, 100, 250],
      },
      {
        name: "Reviewer",
        description: "Pull request reviews in the selected period",
        value: contributionData.totalReviews,
        thresholds: [1, 3, 5, 10, 25, 50, 100, 250],
      },
      {
        name: "Issue Hunter",
        description: "Issues opened in the selected period",
        value: contributionData.totalIssues,
        thresholds: [1, 3, 5, 10, 25, 50, 100, 250],
      },
    );
  }

  return stableFamilies;
}

function unlockTrophies(families: TrophyFamily[]) {
  const all: UnlockedTrophy[] = [];

  for (const family of families) {
    family.thresholds.forEach((threshold, index) => {
      if (family.value >= threshold) {
        all.push({
          family: family.name,
          description: family.description,
          tier: TROPHY_TIERS[index],
          tierIndex: index,
          threshold,
          value: family.value,
          formattedValue: family.formatter
            ? family.formatter(family.value)
            : formatNumber(family.value),
        });
      }
    });
  }

  const highest = families
    .map((family) => {
      let highestIndex = -1;

      family.thresholds.forEach((threshold, index) => {
        if (family.value >= threshold) {
          highestIndex = index;
        }
      });

      if (highestIndex === -1) return null;

      return {
        family: family.name,
        description: family.description,
        tier: TROPHY_TIERS[highestIndex],
        tierIndex: highestIndex,
        threshold: family.thresholds[highestIndex],
        value: family.value,
        formattedValue: family.formatter
          ? family.formatter(family.value)
          : formatNumber(family.value),
      } satisfies UnlockedTrophy;
    })
    .filter(
      (trophy): trophy is UnlockedTrophy => trophy !== null,
    )
    .sort((a, b) => {
      if (b.tierIndex !== a.tierIndex) {
        return b.tierIndex - a.tierIndex;
      }

      return b.value - a.value;
    });

  const next = families
    .map((family) => {
      const nextIndex = family.thresholds.findIndex(
        (threshold) => family.value < threshold,
      );

      if (nextIndex === -1) return null;

      const threshold = family.thresholds[nextIndex];

      return {
        family: family.name,
        tier: TROPHY_TIERS[nextIndex],
        value: family.value,
        threshold,
        progress: Math.min(
          100,
          Math.round((family.value / threshold) * 100),
        ),
        formattedValue: family.formatter
          ? family.formatter(family.value)
          : formatNumber(family.value),
        formattedTarget: family.formatter
          ? family.formatter(threshold)
          : formatNumber(threshold),
      };
    })
    .filter(
      (
        item,
      ): item is {
        family: string;
        tier: TrophyTier;
        value: number;
        threshold: number;
        progress: number;
        formattedValue: string;
        formattedTarget: string;
      } => item !== null,
    )
    .sort((a, b) => b.progress - a.progress);

  return {
    all,
    highest,
    next,
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    range?: string | string[];
    refresh?: string | string[];
  }>;
}) {
  const { username: rawUsername } = await params;
  const query = await searchParams;

  const requestedRange =
    typeof query.range === "string"
      ? query.range.toUpperCase()
      : "30D";

  const range: RangeKey = RANGES.includes(
    requestedRange as RangeKey,
  )
    ? (requestedRange as RangeKey)
    : "30D";

  const refresh = query.refresh === "1";

  const username = decodeURIComponent(rawUsername);

  const [user, repos, publicEvents] = await Promise.all([
    getUser(username, refresh),
    getAllRepos(username, refresh),
    getPublicEvents(username, refresh),
  ]);

  if (!user) {
    notFound();
  }

  let contributionData: ContributionData | null = null;
  let previousContributionData: ContributionData | null = null;

  if (process.env.GITHUB_TOKEN) {
    if (range === "ALL") {
      contributionData = await getAllTimeContributions(
        user.login,
        refresh,
      );
    } else {
      const dates = rangeDates(range);

      [contributionData, previousContributionData] =
        await Promise.all([
          getContributionRange(
            user.login,
            dates.currentFrom,
            dates.currentTo,
            refresh,
          ),

          getContributionRange(
            user.login,
            dates.previousFrom,
            dates.previousTo,
            refresh,
          ),
        ]);
    }
  }

  if (!contributionData) {
    contributionData = buildEventFallback(publicEvents, range);
  }

  const repoMap = new Map(
    repos.map((repo) => [repo.full_name.toLowerCase(), repo]),
  );

  const previousRepoMap = new Map(
    (previousContributionData?.repoContributions ?? []).map(
      (repo) => [repo.nameWithOwner.toLowerCase(), repo.count],
    ),
  );

  const totalProjectActivity = sum(
    contributionData.repoContributions.map((repo) => repo.count),
  );

  let activeProjects = contributionData.repoContributions
    .map((project) => {
      const repo = repoMap.get(project.nameWithOwner.toLowerCase());

      const previous =
        previousRepoMap.get(project.nameWithOwner.toLowerCase()) ?? 0;

      const trend =
        previous > 0
          ? Math.round(
              ((project.count - previous) / previous) * 100,
            )
          : null;

      return {
        ...project,
        repo,
        percentage: totalProjectActivity
          ? Math.round(
              (project.count / totalProjectActivity) * 100,
            )
          : 0,
        trend,
      };
    })
    .slice(0, 8);

  // If GitHub reports no contribution-per-repo data,
  // still show recently pushed owned repositories.
  if (!activeProjects.length) {
    activeProjects = repos
      .filter((repo) => !repo.archived)
      .slice(0, 8)
      .map((repo) => ({
        name: repo.name,
        nameWithOwner: repo.full_name,
        url: repo.html_url,
        count: 0,
        repo,
        percentage: 0,
        trend: null,
      }));
  }

  const focus = calculateFocus(
    contributionData.repoContributions,
  );

  const streaks = calculateStreaks(contributionData.days);

  const activeDays = contributionData.days.filter(
    (day) => day.contributionCount > 0,
  ).length;

  const bestDay = contributionData.days.reduce<
    ContributionDay | null
  >((best, day) => {
    if (!best || day.contributionCount > best.contributionCount) {
      return day;
    }

    return best;
  }, null);

  const averageActiveDay =
    activeDays > 0
      ? contributionData.totalContributions / activeDays
      : 0;

  const weekdays = weekdayActivity(contributionData.days);

  const maxWeekday = Math.max(
    1,
    ...weekdays.map((day) => day.value),
  );

  const languages = calculateLanguageDistribution(
    repos,
    contributionData.repoContributions,
  );

  const contributionBars = contributionBuckets(
    contributionData.days,
    28,
  );

  const maxContributionBar = Math.max(
    1,
    ...contributionBars,
  );

  const heatmapDays =
    range === "ALL"
      ? contributionData.days.slice(-365)
      : contributionData.days;

  const maxHeatmapContribution = Math.max(
    1,
    ...heatmapDays.map((day) => day.contributionCount),
  );

  const totalStars = sum(
    repos.map((repo) => repo.stargazers_count),
  );

  const totalForks = sum(
    repos.map((repo) => repo.forks_count),
  );

  const originalRepos = repos.filter((repo) => !repo.fork);
  const forkedRepos = repos.filter((repo) => repo.fork);

  const graveyard = repos
    .filter(
      (repo) =>
        !repo.fork &&
        !repo.archived &&
        repo.size > 0 &&
        daysSince(repo.pushed_at) >= 180,
    )
    .sort(
      (a, b) =>
        daysSince(b.pushed_at) - daysSince(a.pushed_at),
    )
    .slice(0, 8);

  const mostStarredRepo = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  )[0];

  const mostForkedRepo = [...repos].sort(
    (a, b) => b.forks_count - a.forks_count,
  )[0];

  const newestRepo = [...repos].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  )[0];

  const oldestRepo = [...repos].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime(),
  )[0];

  const latestRepo = [...repos].sort(
    (a, b) =>
      new Date(b.pushed_at ?? 0).getTime() -
      new Date(a.pushed_at ?? 0).getTime(),
  )[0];

  const descriptionCoverage = repos.length
    ? Math.round(
        (repos.filter((repo) => Boolean(repo.description)).length /
          repos.length) *
          100,
      )
    : 0;

  const licenseCoverage = originalRepos.length
    ? Math.round(
        (originalRepos.filter((repo) => repo.license).length /
          originalRepos.length) *
          100,
      )
    : 0;

  const topicsCoverage = repos.length
    ? Math.round(
        (repos.filter((repo) => (repo.topics?.length ?? 0) > 0)
          .length /
          repos.length) *
          100,
      )
    : 0;

  const homepageCoverage = repos.length
    ? Math.round(
        (repos.filter((repo) => Boolean(repo.homepage)).length /
          repos.length) *
          100,
      )
    : 0;

  const externalContributionCount = sum(
    contributionData.repoContributions
      .filter(
        (repo) =>
          repo.nameWithOwner
            .split("/")[0]
            ?.toLowerCase() !== user.login.toLowerCase(),
      )
      .map((repo) => repo.count),
  );

  const externalContributionPercentage = totalProjectActivity
    ? Math.round(
        (externalContributionCount / totalProjectActivity) * 100,
      )
    : 0;

  const previousFocus = previousContributionData
    ? calculateFocus(previousContributionData.repoContributions)
    : null;

  const activityTrend =
    previousContributionData &&
    previousContributionData.totalContributions > 0
      ? Math.round(
          ((contributionData.totalContributions -
            previousContributionData.totalContributions) /
            previousContributionData.totalContributions) *
            100,
        )
      : null;

  const focusTrend = previousFocus
    ? focus.score - previousFocus.score
    : null;

  const activeRepoTrend = previousContributionData
    ? contributionData.repoContributions.length -
      previousContributionData.repoContributions.length
    : null;

  const trophyFamilyList = trophyFamilies({
    user,
    repos,
    contributionData,
  });

  const trophies = unlockTrophies(trophyFamilyList);

  const totalPossibleTrophies =
    trophyFamilyList.length * TROPHY_TIERS.length;

  const website =
    user.blog &&
    (user.blog.startsWith("http://") ||
      user.blog.startsWith("https://"))
      ? user.blog
      : user.blog
        ? `https://${user.blog}`
        : null;

  const metricLabel =
    contributionData.source === "graphql"
      ? "Contributions"
      : "Public events";

  const commitLabel =
    contributionData.source === "graphql"
      ? "Commits"
      : "Push events";

  return (
    <main className="min-h-screen bg-[#F4F1E8] text-[#111111]">
      {/* NAV */}
      <nav className="flex min-h-16 items-center justify-between border-b-2 border-black px-5 py-3 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#FF5C35]">
            <Activity size={18} strokeWidth={2.5} />
          </div>

          <span className="text-lg font-black tracking-tight">
            DevPulse
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm font-bold transition-opacity hover:opacity-50"
        >
          Analyze another profile →
        </Link>
      </nav>

      <div className="mx-auto max-w-[1500px]">
        {/* PROFILE HEADER */}
        <section className="relative min-h-[360px] overflow-hidden border-x-2 border-b-2 border-black">
          <div
            className="absolute inset-[-140px] scale-125 bg-cover bg-center opacity-80 blur-[90px]"
            style={{
              backgroundImage: `url("${user.avatar_url}")`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

          <div className="relative flex min-h-[360px] flex-col justify-between p-6 text-white md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-5">
                <img
                  src={user.avatar_url}
                  alt={`${user.login} avatar`}
                  className="h-24 w-24 shrink-0 border-2 border-white/80 object-cover md:h-28 md:w-28"
                />

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                    GitHub profile
                  </p>

                  <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] md:text-6xl">
                    {user.name || user.login}
                  </h1>

                  <p className="mt-1 text-xl font-bold text-white/65">
                    @{user.login}
                  </p>

                  {user.bio && (
                    <p className="mt-4 max-w-xl font-medium leading-relaxed text-white/80">
                      {user.bio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/60">
                    {user.location && <span>{user.location}</span>}
                    {user.company && <span>{user.company}</span>}

                    <span>
                      {formatNumber(user.followers)} followers
                    </span>

                    <span>
                      {formatNumber(user.following)} following
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-white/75 hover:text-white"
                    >
                      GitHub
                      <ArrowUpRight size={15} />
                    </a>

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-white/75 hover:text-white"
                      >
                        Website
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/u/${encodeURIComponent(
                  user.login,
                )}?range=${range}&refresh=1`}
                className="flex w-fit items-center gap-2 border border-white/30 bg-black/20 px-4 py-2 text-sm font-bold backdrop-blur-sm hover:bg-black/35"
              >
                <RefreshCw size={15} />
                Refresh
              </Link>
            </div>

            <div className="mt-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div>
                  <p className="text-xs font-bold uppercase text-white/45">
                    Public repos
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {formatNumber(user.public_repos)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-white/45">
                    Stars received
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {formatNumber(totalStars)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-white/45">
                    On GitHub since
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {new Date(user.created_at).getUTCFullYear()}
                  </p>
                </div>
              </div>

              <div className="flex w-fit border border-white/30 bg-black/20 backdrop-blur-md">
                {RANGES.map((item) => (
                  <Link
                    key={item}
                    href={`/u/${encodeURIComponent(
                      user.login,
                    )}?range=${item}`}
                    className={`px-4 py-2 text-xs font-black transition ${
                      range === item
                        ? "bg-[#FFD84D] text-black"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API STATUS */}
        <section
          className={`border-x-2 border-b-2 border-black px-6 py-3 text-sm font-bold ${
            contributionData.source === "graphql"
              ? "bg-[#D8FF54]"
              : "bg-[#FFD84D]"
          }`}
        >
          {contributionData.source === "graphql" ? (
            <span>
              Deep GitHub analytics enabled · real contribution
              history loaded.
            </span>
          ) : (
            <span>
              Basic GitHub mode · profile and repository data are
              live. Add GITHUB_TOKEN to unlock full contribution
              history, real commit totals, PR reviews and accurate
              90D / 1Y / ALL activity.
            </span>
          )}
        </section>

        {/* THE PULSE */}
        <section className="border-x-2 border-b-2 border-black bg-[#3567FF] p-6 text-white md:p-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                The Pulse · {range}
              </p>

              <div className="mt-4 flex items-end gap-4">
                <span className="text-7xl font-black tracking-[-0.07em] md:text-9xl">
                  {formatNumber(
                    contributionData.totalContributions,
                  )}
                </span>

                <span className="mb-4 font-bold text-white/60">
                  {metricLabel.toLowerCase()}
                </span>
              </div>

              {activityTrend !== null && (
                <p className="mt-3 font-black">
                  {activityTrend >= 0 ? "+" : ""}
                  {activityTrend}% vs previous {range}
                </p>
              )}
            </div>

            <BarChart3 size={32} />
          </div>

          {/* BAR TIMELINE */}
          <div className="mt-14 flex h-44 items-end gap-1 md:gap-2">
            {contributionBars.map((value, index) => {
              const height =
                value === 0
                  ? 4
                  : Math.max(
                      8,
                      (value / maxContributionBar) * 100,
                    );

              return (
                <div
                  key={index}
                  title={`${value} contributions`}
                  className="flex-1 bg-white/30 transition hover:bg-[#D8FF54]"
                  style={{
                    height: `${height}%`,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-4 flex justify-between text-xs font-black text-white/40">
            <span>Start</span>
            <span>Today</span>
          </div>

          {/* HEATMAP */}
          <div className="mt-10 border-t border-white/20 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                Activity map
              </p>

              {range === "ALL" && (
                <p className="text-xs font-bold text-white/40">
                  latest 365 days shown
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {heatmapDays.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.contributionCount}`}
                  className="h-3.5 w-3.5 transition-transform hover:scale-150"
                  style={{
                    backgroundColor: contributionIntensity(
                      day.contributionCount,
                      maxHeatmapContribution,
                    ),
                  }}
                />
              ))}
            </div>
          </div>

          {/* CORE METRICS */}
          <div className="mt-12 grid gap-y-8 border-t border-white/25 pt-8 sm:grid-cols-2 lg:grid-cols-6">
            <Metric
              label={commitLabel}
              value={contributionData.totalCommits}
            />

            <Metric
              label="Pull requests"
              value={contributionData.totalPullRequests}
            />

            <Metric
              label="Reviews"
              value={contributionData.totalReviews}
            />

            <Metric
              label="Issues"
              value={contributionData.totalIssues}
            />

            <Metric label="Active days" value={activeDays} />

            <Metric
              label="Current streak"
              value={streaks.current}
              suffix="d"
            />
          </div>
        </section>

        {/* ACTIVITY DNA */}
        <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.42fr_0.58fr]">
          <div className="border-black bg-[#FFD84D] p-7 lg:border-r-2 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
              Activity DNA
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Personal records
            </h2>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9">
              <Record
                label="Longest streak"
                value={`${streaks.longest} days`}
              />

              <Record
                label="Best day"
                value={
                  bestDay
                    ? `${bestDay.contributionCount}`
                    : "0"
                }
                subvalue={bestDay?.date}
              />

              <Record
                label="Active-day average"
                value={averageActiveDay.toFixed(1)}
              />

              <Record
                label="Active days"
                value={`${activeDays}`}
              />

              <Record
                label="External activity"
                value={`${externalContributionPercentage}%`}
              />

              <Record
                label="Repositories touched"
                value={`${contributionData.repoContributions.length}`}
              />
            </div>
          </div>

          <div className="bg-[#F4F1E8] p-7 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
              Weekly pattern
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Activity Rhythm
            </h2>

            <div className="mt-10 space-y-5">
              {weekdays.map((day) => (
                <div
                  key={day.day}
                  className="grid grid-cols-[48px_1fr_60px] items-center gap-4"
                >
                  <span className="text-xs font-black">
                    {day.day}
                  </span>

                  <div className="h-7 bg-black/10">
                    <div
                      className="h-full bg-black"
                      style={{
                        width: `${
                          (day.value / maxWeekday) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <span className="text-right font-black">
                    {formatNumber(day.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TROPHIES */}
        <section className="border-x-2 border-b-2 border-black bg-[#FF6B8A] p-7 md:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
                DevPulse trophies
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-tight">
                Trophy Cabinet
              </h2>

              <p className="mt-3 max-w-2xl font-semibold text-black/60">
                Real milestones calculated from this profile.
                Each trophy has eight levels from Bronze to
                Mythic.
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-5xl font-black tracking-[-0.05em]">
                {trophies.all.length}
              </p>

              <p className="text-sm font-bold text-black/55">
                of {totalPossibleTrophies} milestones unlocked
              </p>
            </div>
          </div>

          {/* CURRENT HIGHEST TROPHY PER FAMILY */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trophies.highest.map((trophy) => (
              <div
                key={trophy.family}
                className="border-2 border-black bg-[#F4F1E8] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black font-black"
                    style={{
                      backgroundColor: trophy.tier.color,
                    }}
                  >
                    ◆
                  </div>

                  <span className="text-xs font-black uppercase tracking-wider text-black/40">
                    {trophy.tier.name}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-black">
                  {trophy.family}
                </h3>

                <p className="mt-1 text-sm font-semibold text-black/50">
                  {trophy.description}
                </p>

                <p className="mt-5 text-3xl font-black">
                  {trophy.formattedValue}
                </p>
              </div>
            ))}
          </div>

          {/* NEXT TROPHIES */}
          {trophies.next.length > 0 && (
            <div className="mt-12 border-t-2 border-black pt-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
                Closest unlocks
              </p>

              <div className="mt-5 grid gap-6 md:grid-cols-3">
                {trophies.next.slice(0, 3).map((next) => (
                  <div key={next.family}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {next.family}
                        </p>

                        <p className="text-sm font-bold text-black/45">
                          {next.tier.name}
                        </p>
                      </div>

                      <p className="text-sm font-black">
                        {next.formattedValue} /{" "}
                        {next.formattedTarget}
                      </p>
                    </div>

                    <div className="mt-3 h-3 border border-black bg-black/10">
                      <div
                        className="h-full bg-black"
                        style={{
                          width: `${next.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-10 border-t border-black/20 pt-5 text-xs font-bold text-black/45">
            Code Footprint uses repository size reported by
            GitHub. DevPulse does not pretend that repository
            size equals lines of code.
          </p>
        </section>

        {/* FOCUS + PROJECTS */}
        <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.34fr_0.66fr]">
          <div className="flex min-h-[500px] flex-col justify-between border-black bg-[#78E6D0] p-7 lg:border-r-2 md:p-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
                Project concentration
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Focus Score
              </h2>

              <p className="mt-10 text-[110px] font-black leading-none tracking-[-0.08em]">
                {focus.score}
              </p>

              <p className="mt-2 text-xl font-black">/ 100</p>
            </div>

            <div>
              <p className="text-xl font-black">
                {focus.label}
              </p>

              <p className="mt-3 max-w-sm font-semibold leading-relaxed text-black/55">
                {focus.topThreeShare}% of measurable repository
                activity is concentrated in the top three
                projects.
              </p>

              <p className="mt-5 text-xs font-bold text-black/45">
                Calculated using a transparent concentration
                index. This is not a developer quality score.
              </p>
            </div>
          </div>

          <div className="bg-[#F4F1E8] p-7 md:p-10">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
                  Repository activity
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight">
                  Active Projects
                </h2>
              </div>

              <GitBranch size={26} />
            </div>

            <div>
              {activeProjects.map((project) => (
                <div
                  key={project.nameWithOwner}
                  className="border-t-2 border-black py-6 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      {/* CLICKABLE REPOSITORY */}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xl font-black underline decoration-transparent underline-offset-4 transition hover:decoration-black"
                      >
                        {project.name}

                        <ArrowUpRight size={17} />
                      </a>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-black/45">
                        {project.repo?.language && (
                          <span>{project.repo.language}</span>
                        )}

                        {project.repo?.language && <span>·</span>}

                        {project.repo && (
                          <span>
                            pushed{" "}
                            {relativeAge(project.repo.pushed_at)}
                          </span>
                        )}

                        {project.repo?.stargazers_count !==
                          undefined && (
                          <>
                            <span>·</span>

                            <span>
                              ★{" "}
                              {formatNumber(
                                project.repo.stargazers_count,
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {project.repo?.description && (
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-black/55">
                          {project.repo.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      {project.count > 0 ? (
                        <>
                          <p className="text-3xl font-black">
                            {project.percentage}%
                          </p>

                          <p className="text-xs font-bold text-black/45">
                            of measured activity
                          </p>

                          {project.trend !== null && (
                            <p
                              className={`mt-1 text-sm font-black ${
                                project.trend >= 0
                                  ? "text-green-700"
                                  : "text-red-600"
                              }`}
                            >
                              {project.trend >= 0 ? "+" : ""}
                              {project.trend}%
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-black text-black/45">
                          recently pushed
                        </p>
                      )}
                    </div>
                  </div>

                  {project.count > 0 && (
                    <div className="mt-5 h-2 bg-black/10">
                      <div
                        className="h-full bg-black"
                        style={{
                          width: `${project.percentage}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LANGUAGE DNA */}
        <section className="border-x-2 border-b-2 border-black bg-[#D8FF54] p-7 md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
                Technology
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Language DNA
              </h2>
            </div>

            <Code2 size={28} />
          </div>

          <div className="mt-10 space-y-6">
            {languages.map((language) => (
              <div
                key={language.name}
                className="grid items-center gap-3 md:grid-cols-[160px_1fr_70px]"
              >
                <span className="font-black">
                  {language.name}
                </span>

                <div className="h-6 bg-black/10">
                  <div
                    className="h-full bg-black"
                    style={{
                      width: `${language.percentage}%`,
                    }}
                  />
                </div>

                <span className="text-right text-xl font-black">
                  {language.percentage}%
                </span>
              </div>
            ))}
          </div>

          {!languages.length && (
            <p className="mt-8 font-bold text-black/50">
              No primary language data available.
            </p>
          )}
        </section>

        {/* REPOSITORY LANDSCAPE */}
        <section className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
            Repository landscape
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Public Portfolio
          </h2>

          <div className="mt-10 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <BigStat
              label="Original projects"
              value={originalRepos.length}
            />

            <BigStat
              label="Forked projects"
              value={forkedRepos.length}
            />

            <BigStat
              label="Stars received"
              value={totalStars}
            />

            <BigStat
              label="Forks received"
              value={totalForks}
            />
          </div>

          <div className="mt-12 grid border-t-2 border-black pt-8 md:grid-cols-4">
            <Coverage
              label="Descriptions"
              value={descriptionCoverage}
            />

            <Coverage
              label="Licenses"
              value={licenseCoverage}
            />

            <Coverage
              label="Topics"
              value={topicsCoverage}
            />

            <Coverage
              label="Project websites"
              value={homepageCoverage}
            />
          </div>
        </section>

        {/* PROJECT RECORDS */}
        <section className="grid border-x-2 border-b-2 border-black md:grid-cols-2 lg:grid-cols-4">
          <ProjectRecord
            label="Most starred"
            repo={mostStarredRepo}
            stat={
              mostStarredRepo
                ? `★ ${formatNumber(
                    mostStarredRepo.stargazers_count,
                  )}`
                : "—"
            }
            background="#3567FF"
            light
          />

          <ProjectRecord
            label="Most forked"
            repo={mostForkedRepo}
            stat={
              mostForkedRepo
                ? `${formatNumber(
                    mostForkedRepo.forks_count,
                  )} forks`
                : "—"
            }
            background="#FF6B8A"
          />

          <ProjectRecord
            label="Newest project"
            repo={newestRepo}
            stat={
              newestRepo
                ? new Date(
                    newestRepo.created_at,
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : "—"
            }
            background="#FFD84D"
          />

          <ProjectRecord
            label="Last touched"
            repo={latestRepo}
            stat={
              latestRepo
                ? relativeAge(latestRepo.pushed_at)
                : "—"
            }
            background="#78E6D0"
          />
        </section>

        {/* GRAVEYARD */}
        <section className="border-x-2 border-b-2 border-black bg-[#171717] p-7 text-white md:p-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                Dormant projects
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-tight">
                Project Graveyard
              </h2>

              <p className="mt-3 max-w-xl font-medium text-white/45">
                Non-archived original repositories with no push
                activity for at least 180 days.
              </p>
            </div>

            <p className="text-5xl font-black text-white/20">
              {graveyard.length.toString().padStart(2, "0")}
            </p>
          </div>

          <div className="mt-10">
            {graveyard.map((repo) => (
              <div
                key={repo.id}
                className="grid gap-4 border-t border-white/20 py-6 first:border-t-0 first:pt-0 md:grid-cols-[1fr_180px_160px]"
              >
                <div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xl font-black hover:underline"
                  >
                    {repo.name}
                    <ArrowUpRight size={17} />
                  </a>

                  <p className="mt-2 text-sm font-medium text-white/40">
                    {repo.description ||
                      "No repository description."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-white/30">
                    Language
                  </p>

                  <p className="mt-1 font-black">
                    {repo.language || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-white/30">
                    Inactive
                  </p>

                  <p className="mt-1 font-black">
                    {daysSince(repo.pushed_at)} days
                  </p>
                </div>
              </div>
            ))}

            {!graveyard.length && (
              <p className="border-t border-white/20 pt-8 text-lg font-bold text-white/50">
                Nothing buried here. Nice.
              </p>
            )}
          </div>
        </section>

        {/* WHAT CHANGED */}
        <section className="border-x-2 border-b-2 border-black bg-[#FFD84D] p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
            Period comparison
          </p>

          <h2 className="mt-2 text-3xl font-black">
            What changed?
          </h2>

          {previousContributionData ? (
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <TrendStat
                label="Activity"
                value={
                  activityTrend === null
                    ? "—"
                    : `${activityTrend >= 0 ? "+" : ""}${activityTrend}%`
                }
              />

              <TrendStat
                label="Focus"
                value={
                  focusTrend === null
                    ? "—"
                    : `${focusTrend >= 0 ? "+" : ""}${focusTrend}`
                }
              />

              <TrendStat
                label="Active repos"
                value={
                  activeRepoTrend === null
                    ? "—"
                    : `${
                        activeRepoTrend >= 0 ? "+" : ""
                      }${activeRepoTrend}`
                }
              />

              <TrendStat
                label="Top language"
                value={languages[0]?.name ?? "—"}
              />
            </div>
          ) : (
            <div className="mt-8 border-t-2 border-black pt-7">
              <p className="max-w-3xl text-xl font-bold leading-relaxed">
                {range === "ALL"
                  ? "All-time mode shows the complete public contribution history available through GitHub instead of comparing it with a previous period."
                  : "Previous-period comparison requires deep GitHub contribution data."}
              </p>
            </div>
          )}
        </section>

        {/* ACCOUNT TIMELINE */}
        <section className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
            Timeline
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Developer Timeline
          </h2>

          <div className="mt-10 border-l-2 border-black pl-7">
            <TimelineItem
              year={new Date(user.created_at)
                .getUTCFullYear()
                .toString()}
              title="Joined GitHub"
              description={`@${user.login} account created.`}
            />

            {oldestRepo && (
              <TimelineItem
                year={new Date(oldestRepo.created_at)
                  .getUTCFullYear()
                  .toString()}
                title={`Created ${oldestRepo.name}`}
                description="Oldest public repository currently visible."
                href={oldestRepo.html_url}
              />
            )}

            {newestRepo &&
              newestRepo.id !== oldestRepo?.id && (
                <TimelineItem
                  year={new Date(newestRepo.created_at)
                    .getUTCFullYear()
                    .toString()}
                  title={`Created ${newestRepo.name}`}
                  description="Newest public repository."
                  href={newestRepo.html_url}
                />
              )}

            {mostStarredRepo &&
              mostStarredRepo.stargazers_count > 0 && (
                <TimelineItem
                  year="NOW"
                  title={`${mostStarredRepo.name} leads the portfolio`}
                  description={`${formatNumber(
                    mostStarredRepo.stargazers_count,
                  )} stars · ${formatNumber(
                    mostStarredRepo.forks_count,
                  )} forks`}
                  href={mostStarredRepo.html_url}
                />
              )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col justify-between gap-3 border-x-2 border-black px-6 py-8 text-xs font-bold text-black/40 sm:flex-row">
          <span>DevPulse</span>

          <span>
            Public GitHub analytics · devpulse.formen.cc
          </span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Metric({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-white/45">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {formatNumber(value)}
        {suffix}
      </p>
    </div>
  );
}

function Record({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/40">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>

      {subvalue && (
        <p className="mt-1 text-xs font-bold text-black/40">
          {subvalue}
        </p>
      )}
    </div>
  );
}

function BigStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-black/45">
        {label}
      </p>

      <p className="mt-2 text-5xl font-black tracking-[-0.05em]">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function Coverage({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-black py-3 md:border-r-2 md:px-5 md:first:pl-0 md:last:border-r-0">
      <p className="text-sm font-bold text-black/45">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}%</p>

      <div className="mt-3 h-2 bg-black/10">
        <div
          className="h-full bg-black"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function TrendStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-black/50">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black tracking-tight">
        {value}
      </p>
    </div>
  );
}

function ProjectRecord({
  label,
  repo,
  stat,
  background,
  light = false,
}: {
  label: string;
  repo: GitHubRepo | undefined;
  stat: string;
  background: string;
  light?: boolean;
}) {
  return (
    <div
      className={`min-h-[260px] border-b-2 border-black p-7 last:border-b-0 md:border-b-0 md:border-r-2 md:last:border-r-0 ${
        light ? "text-white" : "text-black"
      }`}
      style={{
        backgroundColor: background,
      }}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.18em] ${
          light ? "text-white/55" : "text-black/45"
        }`}
      >
        {label}
      </p>

      <div className="mt-16">
        {repo ? (
          <>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xl font-black hover:underline"
            >
              {repo.name}
              <ArrowUpRight size={16} />
            </a>

            <p className="mt-3 text-4xl font-black">
              {stat}
            </p>
          </>
        ) : (
          <p className="text-4xl font-black">—</p>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  year,
  title,
  description,
  href,
}: {
  year: string;
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="relative pb-10 last:pb-0">
      <div className="absolute -left-[35px] top-1 h-4 w-4 border-2 border-black bg-[#FF5C35]" />

      <p className="text-xs font-black uppercase tracking-wider text-black/40">
        {year}
      </p>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-2 text-xl font-black hover:underline"
        >
          {title}
          <ArrowUpRight size={16} />
        </a>
      ) : (
        <p className="mt-1 text-xl font-black">{title}</p>
      )}

      <p className="mt-2 font-medium text-black/50">
        {description}
      </p>
    </div>
  );
}
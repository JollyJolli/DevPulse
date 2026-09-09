import { TROPHY_TIERS } from "@/constants/trophies";
import { calculateRepositoryHealth } from "@/lib/analytics/repositories";
import { daysSince } from "@/lib/utils/dates";
import { formatNumber, mean, percentage, sum } from "@/lib/utils/numbers";
import type {
  ActivityDNA,
  ContributionData,
  LanguageStat,
  TrophyFamily,
  TrophyProgress,
  UnlockedTrophy,
} from "@/types/analytics";
import type { GitHubRepository, GitHubUser } from "@/types/github";

type TrophyInputs = {
  user: GitHubUser;
  repositories: readonly GitHubRepository[];
  contributionData: ContributionData;
  activity: ActivityDNA;
  languages: readonly LanguageStat[];
  externalContributionPercentage: number;
  now?: Date;
};

const countThresholds = [1, 2, 5, 10, 20, 35, 60, 100] as const;
const activityThresholds = [1, 10, 25, 50, 100, 250, 500, 1000] as const;
const percentThresholds = [5, 10, 20, 35, 50, 65, 80, 95] as const;

export function buildTrophyFamilies(inputs: TrophyInputs): TrophyFamily[] {
  const now = inputs.now ?? new Date();
  const { user, repositories, contributionData, activity, languages } = inputs;
  const original = repositories.filter((repo) => !repo.fork);
  const forked = repositories.filter((repo) => repo.fork);
  const totalStars = sum(repositories.map((repo) => repo.stargazers_count));
  const totalForks = sum(repositories.map((repo) => repo.forks_count));
  const healthScores = repositories.map((repo) => calculateRepositoryHealth(repo, now).score);
  const active30 = repositories.filter((repo) => daysSince(repo.pushed_at, now) <= 30).length;
  const active90 = repositories.filter((repo) => daysSince(repo.pushed_at, now) <= 90).length;
  const active365 = original.filter((repo) => daysSince(repo.pushed_at, now) <= 365).length;
  const descriptionCoverage = percentage(
    repositories.filter((repo) => Boolean(repo.description)).length,
    repositories.length,
  );
  const licenseCoverage = percentage(original.filter((repo) => Boolean(repo.license)).length, original.length);
  const topicCoverage = percentage(
    repositories.filter((repo) => repo.topics.length > 0).length,
    repositories.length,
  );
  const freshCoverage = percentage(active365, original.length);
  const accountYears = daysSince(user.created_at, now) / 365.25;
  const oldestRepositoryYears = repositories.length
    ? Math.max(...repositories.map((repo) => daysSince(repo.created_at, now) / 365.25))
    : 0;

  const families: TrophyFamily[] = [
    { name: "Builder", description: "Public repositories", value: repositories.length, thresholds: countThresholds },
    { name: "Original Builder", description: "Original non-fork repositories", value: original.length, thresholds: countThresholds },
    { name: "Fork Explorer", description: "Forked repositories", value: forked.length, thresholds: countThresholds },
    { name: "Star Power", description: "Total stars received", value: totalStars, thresholds: [1, 5, 10, 25, 50, 100, 500, 1000] },
    { name: "Spotlight", description: "Stars on the most-starred project", value: Math.max(0, ...repositories.map((repo) => repo.stargazers_count)), thresholds: [1, 5, 10, 25, 50, 100, 500, 1000] },
    { name: "Fork Magnet", description: "Total forks received", value: totalForks, thresholds: [1, 3, 5, 10, 25, 50, 100, 250] },
    { name: "Remix Magnet", description: "Forks on the most-forked project", value: Math.max(0, ...repositories.map((repo) => repo.forks_count)), thresholds: [1, 3, 5, 10, 25, 50, 100, 250] },
    { name: "Audience", description: "GitHub followers", value: user.followers, thresholds: [1, 5, 10, 25, 50, 100, 500, 1000] },
    { name: "Networker", description: "Developers followed", value: user.following, thresholds: [1, 5, 10, 25, 50, 100, 250, 500] },
    { name: "Gist Crafter", description: "Public gists", value: user.public_gists, thresholds: [1, 2, 5, 10, 20, 50, 100, 250] },
    { name: "Veteran", description: "Years on GitHub", value: accountYears, thresholds: [0.25, 0.5, 1, 2, 3, 5, 8, 12], formatter: (value) => `${value.toFixed(1)}y` },
    { name: "Polyglot", description: "Languages across public repositories", value: languages.length, thresholds: [1, 2, 3, 5, 7, 10, 15, 20] },
    { name: "Language Explorer", description: "Languages appearing in the public portfolio", value: new Set(repositories.map((repo) => repo.language).filter(Boolean)).size, thresholds: [1, 2, 4, 6, 8, 12, 16, 24] },
    { name: "Active Arsenal", description: "Repositories pushed in the last 90 days", value: active90, thresholds: countThresholds },
    { name: "On Fire", description: "Repositories pushed in the last 30 days", value: active30, thresholds: countThresholds },
    { name: "Maintainer", description: "Repositories touched in the last year", value: active365, thresholds: countThresholds },
    { name: "Archivist", description: "Archived public repositories", value: repositories.filter((repo) => repo.archived).length, thresholds: countThresholds },
    { name: "Popular Portfolio", description: "Repositories with at least one star", value: repositories.filter((repo) => repo.stargazers_count > 0).length, thresholds: countThresholds },
    { name: "Breakout Projects", description: "Repositories with at least ten stars", value: repositories.filter((repo) => repo.stargazers_count >= 10).length, thresholds: countThresholds },
    { name: "Long Haul", description: "Age of the oldest public repository", value: oldestRepositoryYears, thresholds: [0.25, 0.5, 1, 2, 3, 5, 8, 12], formatter: (value) => `${value.toFixed(1)}y` },
    { name: "Documentation", description: "Repositories with descriptions", value: descriptionCoverage, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Licensed Portfolio", description: "Original repositories with licenses", value: licenseCoverage, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Topic Mapper", description: "Repositories with GitHub topics", value: topicCoverage, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Portfolio Freshness", description: "Original repositories touched in the last year", value: freshCoverage, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Project Health", description: "Average transparent repository health", value: mean(healthScores), thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Consistency", description: "Regularity of activity in the selected period", value: activity.consistency, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
    { name: "Streak", description: "Longest streak in the selected period", value: activity.longestStreak, thresholds: [1, 3, 7, 14, 30, 60, 100, 365] },
    { name: "External Contributor", description: "Share of measured activity outside owned repositories", value: inputs.externalContributionPercentage, thresholds: percentThresholds, formatter: (value) => `${Math.round(value)}%` },
  ];

  if (contributionData.source === "graphql") {
    families.push(
      { name: "Committer", description: "Commits in the selected period", value: contributionData.totalCommits, thresholds: activityThresholds },
      { name: "Contributor", description: "Contributions in the selected period", value: contributionData.totalContributions, thresholds: [1, 25, 50, 100, 250, 500, 1000, 2500] },
      { name: "PR Pilot", description: "Pull requests opened in the selected period", value: contributionData.totalPullRequests, thresholds: [1, 3, 5, 10, 25, 50, 100, 250] },
      { name: "Reviewer", description: "Pull request reviews in the selected period", value: contributionData.totalReviews, thresholds: [1, 3, 5, 10, 25, 50, 100, 250] },
      { name: "Issue Hunter", description: "Issues opened in the selected period", value: contributionData.totalIssues, thresholds: [1, 3, 5, 10, 25, 50, 100, 250] },
    );
  }
  return families;
}

export function unlockTrophies(families: readonly TrophyFamily[]): TrophyProgress {
  const all: UnlockedTrophy[] = [];
  for (const family of families) {
    family.thresholds.forEach((threshold, tierIndex) => {
      if (family.value >= threshold) {
        all.push({
          family: family.name,
          description: family.description,
          tier: TROPHY_TIERS[tierIndex],
          tierIndex,
          threshold,
          value: family.value,
          formattedValue: family.formatter?.(family.value) ?? formatNumber(family.value),
        });
      }
    });
  }

  const highest = families
    .map((family) => {
      const tierIndex = family.thresholds.findLastIndex((threshold) => family.value >= threshold);
      if (tierIndex < 0) return null;
      return {
        family: family.name,
        description: family.description,
        tier: TROPHY_TIERS[tierIndex],
        tierIndex,
        threshold: family.thresholds[tierIndex],
        value: family.value,
        formattedValue: family.formatter?.(family.value) ?? formatNumber(family.value),
      } satisfies UnlockedTrophy;
    })
    .filter((item): item is UnlockedTrophy => item !== null)
    .sort((a, b) => b.tierIndex - a.tierIndex || b.value - a.value);

  const next = families
    .map((family) => {
      const tierIndex = family.thresholds.findIndex((threshold) => family.value < threshold);
      if (tierIndex < 0) return null;
      const threshold = family.thresholds[tierIndex];
      const previousThreshold = tierIndex > 0 ? family.thresholds[tierIndex - 1] : 0;
      const distance = threshold - previousThreshold;
      const progress = distance > 0
        ? Math.min(100, Math.max(0, Math.round(((family.value - previousThreshold) / distance) * 100)))
        : 0;
      return {
        family: family.name,
        description: family.description,
        tier: TROPHY_TIERS[tierIndex],
        value: family.value,
        threshold,
        progress,
        formattedValue: family.formatter?.(family.value) ?? formatNumber(family.value),
        formattedTarget: family.formatter?.(threshold) ?? formatNumber(threshold),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.progress - a.progress || a.family.localeCompare(b.family));

  return {
    all,
    highest,
    next,
    totalPossible: sum(families.map((family) => family.thresholds.length)),
  };
}

import { GITHUB_REQUEST_BUDGET, REVIVAL_GAP_DAYS } from "@/constants/analytics";
import { classifyProjectLifecycle } from "@/lib/analytics/repositories";
import { daysBetween, daysSince } from "@/lib/utils/dates";
import { mean, median, percentage, sum } from "@/lib/utils/numbers";
import type { ProjectLifecycle, Revival } from "@/types/analytics";
import type {
  GitHubCommit,
  GitHubCommitDetails,
  GitHubCommunityProfile,
  GitHubPullRequest,
  GitHubRepository,
  GitHubTreeEntry,
} from "@/types/github";
import type {
  CommitImpact,
  EngineeringPractice,
  PullRequestAnalytics,
} from "@/types/repository";

export function calculateLanguageBytes(languageBytes: Record<string, number>) {
  const total = sum(Object.values(languageBytes));
  return Object.entries(languageBytes)
    .map(([name, bytes]) => ({ name, bytes, percentage: percentage(bytes, total) }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function detectEngineeringPractices(
  tree: readonly GitHubTreeEntry[],
  community: GitHubCommunityProfile | null,
): EngineeringPractice[] {
  const paths = tree.map((entry) => entry.path.toLowerCase());
  const has = (pattern: RegExp) => paths.some((path) => pattern.test(path));
  return [
    { id: "readme", label: "README", detected: Boolean(community?.files.readme) || has(/(^|\/)readme\./), evidence: community?.files.readme ? "GitHub community profile" : has(/(^|\/)readme\./) ? "Repository tree" : null },
    { id: "tests", label: "Tests", detected: has(/(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\.[a-z]+$/), evidence: has(/(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\.[a-z]+$/) ? "Test paths found" : null },
    { id: "ci", label: "CI / Actions", detected: has(/^\.github\/workflows\//), evidence: has(/^\.github\/workflows\//) ? ".github/workflows" : null },
    { id: "lint", label: "Linting", detected: has(/(^|\/)\.?((eslint|biome|ruff|pylint|golangci))/), evidence: has(/(^|\/)\.?((eslint|biome|ruff|pylint|golangci))/) ? "Lint configuration" : null },
    { id: "format", label: "Formatting", detected: has(/(^|\/)\.?(prettier|biome|editorconfig)/), evidence: has(/(^|\/)\.?(prettier|biome|editorconfig)/) ? "Formatting configuration" : null },
    { id: "docker", label: "Container setup", detected: has(/(^|\/)(dockerfile|(?:docker-)?compose\.ya?ml)$/), evidence: has(/(^|\/)(dockerfile|(?:docker-)?compose\.ya?ml)$/) ? "Docker configuration" : null },
    { id: "typescript", label: "TypeScript config", detected: has(/(^|\/)tsconfig\.json$/), evidence: has(/(^|\/)tsconfig\.json$/) ? "tsconfig.json" : null },
    { id: "contributing", label: "Contributing guide", detected: Boolean(community?.files.contributing) || has(/(^|\/)contributing\./), evidence: community?.files.contributing ? "GitHub community profile" : has(/(^|\/)contributing\./) ? "Repository tree" : null },
  ];
}

export function calculateCommitImpact(details: readonly GitHubCommitDetails[]): CommitImpact {
  const sampled = details.filter((commit) => commit.stats).slice(0, GITHUB_REQUEST_BUDGET.deepCommitDetails);
  const sizes = sampled.map((commit) => commit.stats?.total ?? 0);
  const additions = sum(sampled.map((commit) => commit.stats?.additions ?? 0));
  const deletions = sum(sampled.map((commit) => commit.stats?.deletions ?? 0));
  const largestCommit = sampled.reduce<GitHubCommitDetails | null>(
    (largest, commit) =>
      !largest || (commit.stats?.total ?? 0) > (largest.stats?.total ?? 0) ? commit : largest,
    null,
  );
  const conventional = sampled.filter((commit) =>
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?:\s/i.test(
      commit.commit.message.split("\n")[0],
    ),
  ).length;
  const verified = sampled.filter((commit) => commit.commit.verification?.verified).length;
  return {
    sampledCommits: sampled.length,
    additions,
    deletions,
    changedLines: additions + deletions,
    netChange: additions - deletions,
    averageSize: Math.round(mean(sizes)),
    medianSize: Math.round(median(sizes)),
    largestCommit,
    conventionalCommitPercentage: percentage(conventional, sampled.length),
    verifiedCommitPercentage: percentage(verified, sampled.length),
    averageMessageLength: Math.round(
      mean(sampled.map((commit) => commit.commit.message.split("\n")[0].length)),
    ),
  };
}

export function calculatePullRequestAnalytics(
  pullRequests: readonly GitHubPullRequest[],
): PullRequestAnalytics {
  const merged = pullRequests.filter((pull) => Boolean(pull.merged_at));
  const mergeHours = merged.map((pull) =>
    (new Date(pull.merged_at!).getTime() - new Date(pull.created_at).getTime()) / 3_600_000,
  );
  return {
    measured: pullRequests.length,
    open: pullRequests.filter((pull) => pull.state === "open").length,
    merged: merged.length,
    closedWithoutMerge: pullRequests.filter(
      (pull) => pull.state === "closed" && !pull.merged_at,
    ).length,
    mergeRate: percentage(merged.length, pullRequests.filter((pull) => pull.state === "closed").length),
    averageMergeHours: mergeHours.length ? Math.round(mean(mergeHours)) : null,
    medianMergeHours: mergeHours.length ? Math.round(median(mergeHours)) : null,
  };
}

export function detectRevival(
  repository: GitHubRepository,
  commits: readonly GitHubCommit[],
): Revival | null {
  const dated = commits
    .map((commit) => commit.commit.author?.date ?? commit.commit.committer?.date)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let result: Revival | null = null;
  for (let index = 1; index < dated.length; index += 1) {
    const gap = daysBetween(new Date(dated[index - 1]), new Date(dated[index]));
    if (gap >= REVIVAL_GAP_DAYS && (!result || gap > result.dormantDays)) {
      result = { repo: repository, dormantDays: gap, resumedAt: dated[index] };
    }
  }
  return result;
}

export function repositoryLifecycleFromEvidence(
  repository: GitHubRepository,
  commits: readonly GitHubCommit[],
  revival: Revival | null,
): ProjectLifecycle {
  return classifyProjectLifecycle(repository, commits.length, {
    revived: Boolean(revival && daysSince(revival.resumedAt) <= 30 && daysSince(repository.pushed_at) <= 30),
  });
}

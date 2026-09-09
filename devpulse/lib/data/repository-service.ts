import "server-only";

import { cache } from "react";
import { GITHUB_REQUEST_BUDGET } from "@/constants/analytics";
import {
  calculateCommitImpact,
  calculateLanguageBytes,
  calculatePullRequestAnalytics,
  detectEngineeringPractices,
  detectRevival,
  repositoryLifecycleFromEvidence,
} from "@/lib/analytics/repository-intelligence";
import { calculateRepositoryHealth } from "@/lib/analytics/repositories";
import {
  getCommitDetails,
  getCommits,
  getCommunityProfile,
  getIssues,
  getPullRequests,
  getReleases,
  getRepository,
  getRepositoryLanguages,
  getRepositoryTree,
  getWorkflowRuns,
} from "@/lib/github/repository-intelligence";
import { rangeDates } from "@/lib/utils/dates";
import { normalizeUsername } from "@/lib/utils/username";
import type { GitHubCommitDetails } from "@/types/github";
import type { RepositoryInsight } from "@/types/repository";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

async function loadRepositoryInsight(
  rawOwner: string,
  rawRepository: string,
  refresh: boolean,
): Promise<RepositoryInsight | null> {
  const owner = normalizeUsername(rawOwner);
  let repositoryName = "";
  try {
    repositoryName = decodeURIComponent(rawRepository).trim();
  } catch {
    return null;
  }
  if (!owner || !/^[\w.-]{1,100}$/.test(repositoryName)) return null;
  const repository = await getRepository(owner, repositoryName, refresh);
  if (!repository || repository.owner?.login.toLowerCase() !== owner) return null;
  const dates = rangeDates("90D");
  const [languageBytes, commits, pullRequests, issues, releases, workflowRuns, tree, community] =
    await Promise.all([
      safe(getRepositoryLanguages(owner, repository.name, refresh), {}),
      safe(
        getCommits(owner, repository.name, {
          author: owner,
          from: dates.currentFrom,
          to: dates.currentTo,
          perPage: 100,
          refresh,
        }),
        [],
      ),
      safe(getPullRequests(owner, repository.name, refresh), []),
      safe(getIssues(owner, repository.name, refresh), []),
      safe(getReleases(owner, repository.name, refresh), []),
      safe(getWorkflowRuns(owner, repository.name, refresh), []),
      safe(getRepositoryTree(owner, repository.name, repository.default_branch, refresh), {
        entries: [],
        truncated: false,
      }),
      safe(getCommunityProfile(owner, repository.name, refresh), null),
    ]);
  const commitDetails = (
    await Promise.all(
      commits.slice(0, GITHUB_REQUEST_BUDGET.deepCommitDetails).map((commit) =>
        safe(getCommitDetails(owner, repository.name, commit.sha, refresh), null),
      ),
    )
  ).filter((commit): commit is GitHubCommitDetails => commit !== null);
  const revival = detectRevival(repository, commits);
  const practices = detectEngineeringPractices(tree.entries, community);

  return {
    repository,
    languages: calculateLanguageBytes(languageBytes),
    commits,
    commitImpact: calculateCommitImpact(commitDetails),
    pullRequests,
    pullRequestAnalytics: calculatePullRequestAnalytics(pullRequests),
    issues,
    releases,
    workflowRuns,
    community,
    practices,
    health: calculateRepositoryHealth(repository),
    lifecycle: repositoryLifecycleFromEvidence(repository, commits, revival),
    revival,
    scopeNote:
      "Commit impact uses up to 12 recent authored commits from the last 90 days. Pull requests, issues, releases and workflow runs use the latest public API page. These scoped values are not lifetime totals.",
  };
}

export const getRepositoryInsight = cache(loadRepositoryInsight);

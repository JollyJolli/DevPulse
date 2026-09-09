import "server-only";

import { CACHE_SECONDS } from "@/constants/analytics";
import { githubRest } from "@/lib/github/client";
import type {
  GitHubCommit,
  GitHubCommitDetails,
  GitHubCommunityProfile,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRateLimit,
  GitHubRelease,
  GitHubRepository,
  GitHubTreeEntry,
  GitHubWorkflowRun,
} from "@/types/github";

function repositoryPath(owner: string, repository: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
}

export function getRepository(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubRepository | null> {
  return githubRest<GitHubRepository>(repositoryPath(owner, repository), {
    refresh,
    revalidate: CACHE_SECONDS.repositoryDetail,
    allowNotFound: true,
  });
}

export async function getRepositoryLanguages(
  owner: string,
  repository: string,
  refresh = false,
): Promise<Record<string, number>> {
  return (
    (await githubRest<Record<string, number>>(
      `${repositoryPath(owner, repository)}/languages`,
      { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? {}
  );
}

export async function getCommits(
  owner: string,
  repository: string,
  options: {
    author?: string;
    from?: Date;
    to?: Date;
    perPage?: number;
    refresh?: boolean;
  } = {},
): Promise<GitHubCommit[]> {
  const query = new URLSearchParams({
    per_page: String(Math.min(100, Math.max(1, options.perPage ?? 100))),
  });
  if (options.author) query.set("author", options.author);
  if (options.from) query.set("since", options.from.toISOString());
  if (options.to) query.set("until", options.to.toISOString());
  return (
    (await githubRest<GitHubCommit[]>(
      `${repositoryPath(owner, repository)}/commits?${query}`,
      { refresh: options.refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? []
  );
}

export function getCommitDetails(
  owner: string,
  repository: string,
  sha: string,
  refresh = false,
): Promise<GitHubCommitDetails | null> {
  return githubRest<GitHubCommitDetails>(
    `${repositoryPath(owner, repository)}/commits/${encodeURIComponent(sha)}`,
    { refresh, revalidate: CACHE_SECONDS.repositoryDetail, allowNotFound: true },
  );
}

export async function getPullRequests(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubPullRequest[]> {
  return (
    (await githubRest<GitHubPullRequest[]>(
      `${repositoryPath(owner, repository)}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
      { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? []
  );
}

export async function getPullRequestReviews(
  owner: string,
  repository: string,
  pullNumber: number,
  refresh = false,
): Promise<Array<{ id: number; state: string; submitted_at: string; user: { login: string } | null }>> {
  return (
    (await githubRest<
      Array<{ id: number; state: string; submitted_at: string; user: { login: string } | null }>
    >(`${repositoryPath(owner, repository)}/pulls/${pullNumber}/reviews?per_page=100`, {
      refresh,
      revalidate: CACHE_SECONDS.repositoryDetail,
    })) ?? []
  );
}

export async function getIssues(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubIssue[]> {
  const items =
    (await githubRest<GitHubIssue[]>(
      `${repositoryPath(owner, repository)}/issues?state=all&sort=updated&direction=desc&per_page=100`,
      { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? [];
  return items.filter((item) => !item.pull_request);
}

export async function getIssueComments(
  owner: string,
  repository: string,
  refresh = false,
): Promise<Array<{ id: number; created_at: string; user: { login: string } | null }>> {
  return (
    (await githubRest<Array<{ id: number; created_at: string; user: { login: string } | null }>>(
      `${repositoryPath(owner, repository)}/issues/comments?sort=created&direction=desc&per_page=100`,
      { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? []
  );
}

export async function getReleases(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubRelease[]> {
  return (
    (await githubRest<GitHubRelease[]>(
      `${repositoryPath(owner, repository)}/releases?per_page=100`,
      { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
    )) ?? []
  );
}

export async function getWorkflowRuns(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubWorkflowRun[]> {
  const result = await githubRest<{ workflow_runs: GitHubWorkflowRun[] }>(
    `${repositoryPath(owner, repository)}/actions/runs?per_page=50`,
    { refresh, revalidate: CACHE_SECONDS.repositoryDetail },
  );
  return result?.workflow_runs ?? [];
}

export async function getRepositoryTree(
  owner: string,
  repository: string,
  branch: string,
  refresh = false,
): Promise<{ entries: GitHubTreeEntry[]; truncated: boolean }> {
  const result = await githubRest<{ tree: GitHubTreeEntry[]; truncated: boolean }>(
    `${repositoryPath(owner, repository)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { refresh, revalidate: CACHE_SECONDS.repositoryTree },
  );
  return { entries: result?.tree ?? [], truncated: result?.truncated ?? false };
}

export function getCommunityProfile(
  owner: string,
  repository: string,
  refresh = false,
): Promise<GitHubCommunityProfile | null> {
  return githubRest<GitHubCommunityProfile>(
    `${repositoryPath(owner, repository)}/community/profile`,
    { refresh, revalidate: CACHE_SECONDS.repositoryTree, allowNotFound: true },
  );
}

export async function getStarredRepositories(
  username: string,
  refresh = false,
): Promise<GitHubRepository[]> {
  return (
    (await githubRest<GitHubRepository[]>(
      `/users/${encodeURIComponent(username)}/starred?sort=created&direction=desc&per_page=100`,
      { refresh, revalidate: CACHE_SECONDS.profile },
    )) ?? []
  );
}

export async function getRateLimit(refresh = false): Promise<GitHubRateLimit | null> {
  const response = await githubRest<{ resources: { core: GitHubRateLimit } }>("/rate_limit", {
    refresh,
    revalidate: 60,
  });
  return response?.resources.core ?? null;
}

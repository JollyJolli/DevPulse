import "server-only";

import { CACHE_SECONDS, GITHUB_REQUEST_BUDGET } from "@/constants/analytics";
import { githubGraphQL, githubRest } from "@/lib/github/client";
import { PINNED_REPOSITORIES_QUERY } from "@/lib/github/queries";
import type {
  GqlPinnedRepositoriesResponse,
  GitHubRepository,
} from "@/types/github";

export async function getRepositories(
  username: string,
  refresh = false,
): Promise<GitHubRepository[]> {
  const all: GitHubRepository[] = [];
  for (let page = 1; page <= GITHUB_REQUEST_BUDGET.repositoryPages; page += 1) {
    const repos = await githubRest<GitHubRepository[]>(
      `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&direction=desc&per_page=100&page=${page}`,
      { refresh, revalidate: CACHE_SECONDS.repositories, allowNotFound: true },
    );
    if (!repos) break;
    all.push(...repos.map((repo) => ({ ...repo, topics: repo.topics ?? [] })));
    if (repos.length < 100) break;
  }
  return all;
}

export async function getPinnedRepositories(username: string, refresh = false) {
  const data = await githubGraphQL<GqlPinnedRepositoriesResponse>(
    PINNED_REPOSITORIES_QUERY,
    { login: username },
    { refresh, revalidate: CACHE_SECONDS.repositories, allowNotFound: true },
  );
  return data?.user?.pinnedItems.nodes ?? [];
}

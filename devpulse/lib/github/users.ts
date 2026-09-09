import "server-only";

import { CACHE_SECONDS } from "@/constants/analytics";
import { githubRest } from "@/lib/github/client";
import type { GitHubUser } from "@/types/github";

export function getGitHubUser(username: string, refresh = false): Promise<GitHubUser | null> {
  return githubRest<GitHubUser>(`/users/${encodeURIComponent(username)}`, {
    refresh,
    revalidate: CACHE_SECONDS.profile,
    allowNotFound: true,
  });
}

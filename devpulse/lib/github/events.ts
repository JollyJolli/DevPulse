import "server-only";

import { CACHE_SECONDS, GITHUB_REQUEST_BUDGET } from "@/constants/analytics";
import { githubRest } from "@/lib/github/client";
import type { GitHubEvent } from "@/types/github";

export async function getPublicEvents(username: string, refresh = false): Promise<GitHubEvent[]> {
  const pages = await Promise.all(
    Array.from({ length: GITHUB_REQUEST_BUDGET.publicEventPages }, (_, index) => index + 1).map(
      (page) =>
        githubRest<GitHubEvent[]>(
          `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
          { refresh, revalidate: CACHE_SECONDS.publicEvents },
        ),
    ),
  );
  return pages.flatMap((page) => page ?? []);
}

import type { GitHubCommit } from "@/types/github";

export function commitTiming(commits: readonly GitHubCommit[]) {
  const cells = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  let sampled = 0;
  for (const commit of commits) {
    const date = new Date(commit.commit.author?.date ?? commit.commit.committer?.date ?? "");
    if (Number.isNaN(date.getTime())) continue;
    cells[(date.getUTCDay() + 6) % 7][date.getUTCHours()] += 1;
    sampled += 1;
  }
  return { cells, sampled, maximum: Math.max(1, ...cells.flat()) };
}


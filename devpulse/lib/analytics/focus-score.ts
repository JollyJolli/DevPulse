import { clamp, sum } from "@/lib/utils/numbers";
import type { FocusResult, RepoContribution } from "@/types/analytics";

export function calculateFocus(repoContributions: readonly RepoContribution[]): FocusResult {
  const totalsByRepository = new Map<string, number>();
  for (const repository of repoContributions) {
    if (repository.count <= 0) continue;
    const key = repository.nameWithOwner.toLowerCase();
    totalsByRepository.set(key, (totalsByRepository.get(key) ?? 0) + repository.count);
  }
  const counts = [...totalsByRepository.values()].sort((a, b) => b - a);
  const total = sum(counts);
  if (!total) {
    return {
      score: 0,
      label: "none",
      hhi: 0,
      normalizedEntropy: 0,
      topProjectShare: 0,
      topThreeShare: 0,
      activeRepositories: 0,
      fragmentation: 0,
    };
  }
  const shares = counts.map((count) => count / total);
  const hhi = sum(shares.map((share) => share ** 2));
  const entropy = -sum(shares.map((share) => share * Math.log(share)));
  const normalizedEntropy = shares.length > 1 ? entropy / Math.log(shares.length) : 0;
  const score = Math.round(clamp(hhi * 100, 0, 100));
  return {
    score,
    label: score >= 70 ? "focused" : score >= 40 ? "balanced" : "distributed",
    hhi,
    normalizedEntropy,
    topProjectShare: Math.round(shares[0] * 100),
    topThreeShare: Math.round((sum(counts.slice(0, 3)) / total) * 100),
    activeRepositories: counts.length,
    fragmentation: Math.round(normalizedEntropy * 100),
  };
}

export const FOCUS_FORMULA =
  "Each repository's share of measured activity is squared and the results are added, then multiplied by 100 and rounded. One repository holding all activity scores 100; activity spread evenly across many repositories approaches 0.";

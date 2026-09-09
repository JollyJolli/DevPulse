import type { RangeKey } from "@/types/analytics";

export const RANGES: readonly RangeKey[] = ["7D", "30D", "90D", "1Y", "ALL"];

export const RANGE_DAYS: Record<Exclude<RangeKey, "ALL">, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
};

export const CACHE_SECONDS = {
  profile: 6 * 60 * 60,
  repositories: 60 * 60,
  recentActivity: 15 * 60,
  publicEvents: 5 * 60,
  currentYear: 30 * 60,
  historicalYear: 30 * 24 * 60 * 60,
  repositoryDetail: 6 * 60 * 60,
  repositoryTree: 24 * 60 * 60,
} as const;

export const GITHUB_REQUEST_BUDGET = {
  repositoryPages: 10,
  publicEventPages: 3,
  deepCommitDetails: 12,
  repositoryTreeEntries: 100_000,
} as const;

export const GRAVEYARD_DAYS = 180;
export const ABANDONED_DAYS = 730;
export const REVIVAL_GAP_DAYS = 120;
export const REFRESH_COOLDOWN_SECONDS = 60;

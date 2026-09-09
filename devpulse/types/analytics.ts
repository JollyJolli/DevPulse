import type { GitHubRepository } from "@/types/github";

export type RangeKey = "7D" | "30D" | "90D" | "1Y" | "ALL";
export type Locale = "en" | "es";

export type ContributionDay = {
  date: string;
  contributionCount: number;
};

export type RepoContribution = {
  name: string;
  nameWithOwner: string;
  url: string;
  count: number;
};

export type ContributionData = {
  source: "graphql" | "events";
  limited: boolean;
  totalContributions: number;
  totalCommits: number;
  totalIssues: number;
  totalPullRequests: number;
  totalReviews: number;
  totalRepositoriesCreated: number;
  days: ContributionDay[];
  repoContributions: RepoContribution[];
};

export type FocusResult = {
  score: number;
  label: "none" | "focused" | "balanced" | "distributed";
  hhi: number;
  normalizedEntropy: number;
  topProjectShare: number;
  topThreeShare: number;
  activeRepositories: number;
  fragmentation: number;
};

export type ActivityRecord = {
  label: string;
  value: number;
};

export type WeekdayActivity = {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  value: number;
};

export type ActivityDNA = {
  activeDays: number;
  inactiveDays: number;
  activeDayPercentage: number;
  currentStreak: number;
  longestStreak: number;
  averageStreak: number;
  longestInactivityGap: number;
  contributionsPerActiveDay: number;
  medianContributionsPerActiveDay: number;
  variance: number;
  consistency: number;
  burstiness: number;
  pattern: "consistent" | "balanced" | "burst-heavy" | "insufficient";
  weekendPercentage: number;
  bestDay: ActivityRecord | null;
  bestWeek: ActivityRecord | null;
  bestMonth: ActivityRecord | null;
  bestYear: ActivityRecord | null;
  weekdays: WeekdayActivity[];
};

export type LanguageStat = {
  name: string;
  value: number;
  percentage: number;
  repositoryCount: number;
  firstSeenYear: number;
};

export type ProjectLifecycle =
  | "created"
  | "growing"
  | "peak"
  | "stable"
  | "cooling"
  | "dormant"
  | "abandoned"
  | "archived"
  | "revived";

export type RepositoryHealth = {
  score: number;
  checks: {
    description: boolean;
    license: boolean;
    topics: boolean;
    homepage: boolean;
    maintained: boolean;
    issuesEnabled: boolean;
  };
};

export type ActiveProject = RepoContribution & {
  repo?: GitHubRepository;
  percentage: number;
  trend: number | null;
  lifecycle: ProjectLifecycle;
  health: RepositoryHealth;
};

export type GraveyardEntry = {
  repo: GitHubRepository;
  classification: "dormant" | "abandoned" | "archived";
  inactiveDays: number;
  evidence: string[];
};

export type Revival = {
  repo: GitHubRepository;
  dormantDays: number;
  resumedAt: string;
};

export type TrophyTier = {
  name:
    | "Bronze"
    | "Silver"
    | "Gold"
    | "Emerald"
    | "Platinum"
    | "Diamond"
    | "Master"
    | "Mythic";
  color: string;
};

export type TrophyFamily = {
  name: string;
  description: string;
  value: number;
  thresholds: readonly number[];
  formatter?: (value: number) => string;
};

export type UnlockedTrophy = {
  family: string;
  description: string;
  tier: TrophyTier;
  tierIndex: number;
  threshold: number;
  value: number;
  formattedValue: string;
};

export type NextTrophy = {
  family: string;
  description: string;
  tier: TrophyTier;
  value: number;
  threshold: number;
  progress: number;
  formattedValue: string;
  formattedTarget: string;
};

export type TrophyProgress = {
  all: UnlockedTrophy[];
  highest: UnlockedTrophy[];
  next: NextTrophy[];
  totalPossible: number;
};

export type DeveloperEra = {
  id: string;
  startYear: number;
  endYear: number;
  dominantLanguage: string;
  title: string;
  repositoryShare: number;
  repositories: Array<Pick<GitHubRepository, "name" | "html_url" | "language">>;
  explanation: string;
};

export type TechJourneyYear = {
  year: number;
  totalRepositories: number;
  languages: Array<{
    name: string;
    count: number;
    percentage: number;
    firstAppearance: boolean;
  }>;
};

export type TimelineEvent = {
  id: string;
  date: string;
  year: string;
  title: string;
  description: string;
  href?: string;
  kind: "account" | "repository" | "language" | "era" | "record" | "revival";
  rank: number;
};

export type TrendValue = {
  current: number;
  previous: number;
  delta: number;
  percent: number | null;
};

export type PeriodSnapshot = {
  label: string;
  contributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  activeDays: number;
  longestStreak: number;
  focus: number;
  activeRepositories: number;
  dominantLanguage: string | null;
  languageDiversity: number;
  source: ContributionData["source"];
  limited: boolean;
};

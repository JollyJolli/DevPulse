import type {
  ActivityDNA,
  ActiveProject,
  ContributionData,
  DeveloperEra,
  FocusResult,
  GraveyardEntry,
  LanguageStat,
  Locale,
  RangeKey,
  TechJourneyYear,
  TimelineEvent,
  TrophyProgress,
} from "@/types/analytics";
import type { GitHubRepository, GitHubUser } from "@/types/github";

export type PortfolioCoverage = {
  descriptions: number;
  licenses: number;
  topics: number;
  websites: number;
};

export type ProfileTrends = {
  activity: number | null;
  focus: number | null;
  activeRepositories: number | null;
};

export type ProfileDashboardData = {
  user: GitHubUser;
  repositories: GitHubRepository[];
  range: RangeKey;
  locale: Locale;
  refreshed: boolean;
  dataNotice: "deep" | "basic" | "partial" | "rate-limit";
  dataNoticeMessage: string | null;
  contributionData: ContributionData;
  previousContributionData: ContributionData | null;
  activeProjects: ActiveProject[];
  currentFocus: ActiveProject[];
  focus: FocusResult;
  activity: ActivityDNA;
  languages: LanguageStat[];
  contributionBars: number[];
  heatmapDays: ContributionData["days"];
  totalStars: number;
  totalForks: number;
  originalRepositories: GitHubRepository[];
  forkedRepositories: GitHubRepository[];
  graveyard: GraveyardEntry[];
  mostStarredRepository?: GitHubRepository;
  mostForkedRepository?: GitHubRepository;
  newestRepository?: GitHubRepository;
  oldestRepository?: GitHubRepository;
  latestRepository?: GitHubRepository;
  coverage: PortfolioCoverage;
  externalContributionPercentage: number;
  trends: ProfileTrends;
  trophies: TrophyProgress;
  website: string | null;
  eras: DeveloperEra[];
  techJourney: TechJourneyYear[];
  timeline: TimelineEvent[];
  availableYears: number[];
};

export type WrappedSummary = {
  user: GitHubUser;
  year: number;
  contributionData: ContributionData;
  activity: ActivityDNA;
  focus: FocusResult;
  languages: LanguageStat[];
  topProject: ActiveProject | null;
  projectsStarted: GitHubRepository[];
  trophies: TrophyProgress;
  era: DeveloperEra | null;
  availableYears: number[];
};

export type ProfileComparison = {
  left: ProfileDashboardData;
  right: ProfileDashboardData;
  observations: string[];
};

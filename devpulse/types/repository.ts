import type {
  GitHubCommit,
  GitHubCommitDetails,
  GitHubCommunityProfile,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  GitHubRepository,
  GitHubWorkflowRun,
} from "@/types/github";
import type { ProjectLifecycle, RepositoryHealth, Revival } from "@/types/analytics";

export type EngineeringPractice = {
  id: string;
  label: string;
  detected: boolean;
  evidence: string | null;
};

export type CommitImpact = {
  sampledCommits: number;
  additions: number;
  deletions: number;
  changedLines: number;
  netChange: number;
  averageSize: number;
  medianSize: number;
  largestCommit: GitHubCommitDetails | null;
  conventionalCommitPercentage: number;
  verifiedCommitPercentage: number;
  averageMessageLength: number;
};

export type PullRequestAnalytics = {
  measured: number;
  open: number;
  merged: number;
  closedWithoutMerge: number;
  mergeRate: number;
  averageMergeHours: number | null;
  medianMergeHours: number | null;
};

export type RepositoryInsight = {
  repository: GitHubRepository;
  languages: Array<{ name: string; bytes: number; percentage: number }>;
  commits: GitHubCommit[];
  commitImpact: CommitImpact;
  pullRequests: GitHubPullRequest[];
  pullRequestAnalytics: PullRequestAnalytics;
  issues: GitHubIssue[];
  releases: GitHubRelease[];
  workflowRuns: GitHubWorkflowRun[];
  community: GitHubCommunityProfile | null;
  practices: EngineeringPractice[];
  health: RepositoryHealth;
  lifecycle: ProjectLifecycle;
  revival: Revival | null;
  scopeNote: string;
};

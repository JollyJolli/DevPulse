export type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  disabled?: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  homepage: string | null;
  topics: string[];
  default_branch: string;
  has_issues?: boolean;
  license: {
    spdx_id: string;
    name?: string;
  } | null;
  owner?: {
    login: string;
  };
};

export type GitHubEvent = {
  id: string;
  type: string;
  repo: {
    name: string;
    url: string;
  };
  created_at: string;
};

export type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
    committer: {
      date: string;
    } | null;
    verification?: {
      verified: boolean;
    };
  };
  author: {
    login: string;
  } | null;
};

export type GitHubCommitDetails = GitHubCommit & {
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
};

export type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  merged_at: string | null;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  user: {
    login: string;
  } | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  commits?: number;
};

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  comments: number;
  pull_request?: unknown;
  user: {
    login: string;
  } | null;
};

export type GitHubRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
  assets: Array<{
    id: number;
    download_count: number;
  }>;
};

export type GitHubWorkflowRun = {
  id: number;
  name: string | null;
  html_url: string;
  status: string | null;
  conclusion: string | null;
  created_at: string;
};

export type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

export type GitHubCommunityProfile = {
  health_percentage: number;
  files: {
    code_of_conduct: { html_url: string } | null;
    contributing: { html_url: string } | null;
    issue_template: { html_url: string } | null;
    pull_request_template: { html_url: string } | null;
    license: { html_url: string } | null;
    readme: { html_url: string } | null;
  };
};

export type GitHubRateLimit = {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
};

export type GqlContributionCollection = {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoryContributions: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: Array<{
      contributionDays: Array<{
        date: string;
        contributionCount: number;
      }>;
    }>;
  };
  commitContributionsByRepository: Array<{
    repository: {
      name: string;
      nameWithOwner: string;
      url: string;
    };
    contributions: {
      totalCount: number;
    };
  }>;
};

export type GqlRangeResponse = {
  user: {
    contributionsCollection: GqlContributionCollection;
  } | null;
};

export type GqlYearsResponse = {
  user: {
    contributionsCollection: {
      contributionYears: number[];
    };
  } | null;
};

export type GqlPinnedRepositoriesResponse = {
  user: {
    pinnedItems: {
      nodes: Array<{
        name: string;
        nameWithOwner: string;
        url: string;
      }>;
    };
  } | null;
};

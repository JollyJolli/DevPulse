export const CONTRIBUTION_QUERY = `
  query DevPulseContributionRange($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          repository { name nameWithOwner url }
          contributions(first: 1) { totalCount }
        }
      }
    }
  }
`;

export const CONTRIBUTION_YEARS_QUERY = `
  query DevPulseContributionYears($login: String!) {
    user(login: $login) {
      contributionsCollection { contributionYears }
    }
  }
`;

export const PINNED_REPOSITORIES_QUERY = `
  query DevPulsePinnedRepositories($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository { name nameWithOwner url }
        }
      }
    }
  }
`;

import { calculateActivityDNA } from "@/lib/analytics/activity";
import { detectDeveloperEras, eraForYear } from "@/lib/analytics/eras";
import { calculateFocus } from "@/lib/analytics/focus-score";
import { buildTechJourney, calculateLanguageDistribution } from "@/lib/analytics/languages";
import { buildActiveProjects } from "@/lib/analytics/repositories";
import { buildTrophyFamilies, unlockTrophies } from "@/lib/analytics/trophies";
import { percentage, sum } from "@/lib/utils/numbers";
import type { ContributionData } from "@/types/analytics";
import type { GitHubUser, GitHubRepository } from "@/types/github";
import type { WrappedSummary } from "@/types/profile";

export function buildWrappedSummary(user: GitHubUser, repositories: GitHubRepository[], contributionData: ContributionData, year: number, availableYears: number[]): WrappedSummary {
  const activity = calculateActivityDNA(contributionData.days);
  const focus = calculateFocus(contributionData.repoContributions);
  const languages = calculateLanguageDistribution(repositories, contributionData.repoContributions);
  const activeProjects = buildActiveProjects(repositories, contributionData.repoContributions);
  const projectsStarted = repositories.filter(
    (repo) => !repo.fork && new Date(repo.created_at).getUTCFullYear() === year,
  );
  const externalCount = sum(
    contributionData.repoContributions
      .filter((repo) => repo.nameWithOwner.split("/")[0]?.toLowerCase() !== user.login.toLowerCase())
      .map((repo) => repo.count),
  );
  const totalRepoActivity = sum(contributionData.repoContributions.map((repo) => repo.count));
  const journey = buildTechJourney(repositories);
  const eras = detectDeveloperEras(journey, repositories);
  const trophyFamilies = buildTrophyFamilies({
    user,
    repositories,
    contributionData,
    activity,
    languages,
    externalContributionPercentage: percentage(externalCount, totalRepoActivity),
  }).filter((family) => ["Committer", "Contributor", "PR Pilot", "Reviewer", "Issue Hunter", "Streak", "Consistency", "External Contributor"].includes(family.name));

  return {
    user,
    year,
    contributionData,
    activity,
    focus,
    languages,
    topProject: activeProjects.find((project) => project.count > 0) ?? null,
    projectsStarted,
    trophies: unlockTrophies(trophyFamilies),
    era: eraForYear(eras, year),
    availableYears,
  };
}


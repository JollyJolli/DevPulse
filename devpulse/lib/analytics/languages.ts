import { percentage, sum } from "@/lib/utils/numbers";
import type { LanguageStat, RepoContribution, TechJourneyYear } from "@/types/analytics";
import type { GitHubRepository } from "@/types/github";

export function calculateLanguageDistribution(
  repositories: readonly GitHubRepository[],
  activeProjects: readonly RepoContribution[],
  allowPortfolioFallback = false,
): LanguageStat[] {
  const repoMap = new Map(repositories.map((repo) => [repo.full_name.toLowerCase(), repo]));
  const active = new Map<string, { value: number; repositories: Set<number>; firstYear: number }>();

  for (const project of activeProjects) {
    const repo = repoMap.get(project.nameWithOwner.toLowerCase());
    if (!repo?.language || project.count <= 0) continue;
    const existing = active.get(repo.language) ?? {
      value: 0,
      repositories: new Set<number>(),
      firstYear: new Date(repo.created_at).getUTCFullYear(),
    };
    existing.value += project.count;
    existing.repositories.add(repo.id);
    existing.firstYear = Math.min(existing.firstYear, new Date(repo.created_at).getUTCFullYear());
    active.set(repo.language, existing);
  }

  if (!active.size && allowPortfolioFallback) {
    for (const repo of repositories) {
      if (!repo.language || repo.archived || repo.fork) continue;
      const existing = active.get(repo.language) ?? {
        value: 0,
        repositories: new Set<number>(),
        firstYear: new Date(repo.created_at).getUTCFullYear(),
      };
      existing.value += 1;
      existing.repositories.add(repo.id);
      existing.firstYear = Math.min(existing.firstYear, new Date(repo.created_at).getUTCFullYear());
      active.set(repo.language, existing);
    }
  }

  const total = sum([...active.values()].map((item) => item.value));
  return [...active.entries()]
    .map(([name, item]) => ({
      name,
      value: item.value,
      percentage: percentage(item.value, total),
      repositoryCount: item.repositories.size,
      firstSeenYear: item.firstYear,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function buildTechJourney(repositories: readonly GitHubRepository[]): TechJourneyYear[] {
  const firstSeen = new Map<string, number>();
  const byYear = new Map<number, Map<string, number>>();
  for (const repo of repositories) {
    if (!repo.language || repo.fork) continue;
    const year = new Date(repo.created_at).getUTCFullYear();
    firstSeen.set(repo.language, Math.min(firstSeen.get(repo.language) ?? year, year));
    const languages = byYear.get(year) ?? new Map<string, number>();
    languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1);
    byYear.set(year, languages);
  }
  return [...byYear.entries()]
    .map(([year, languages]) => {
      const totalRepositories = sum([...languages.values()]);
      return {
        year,
        totalRepositories,
        languages: [...languages.entries()]
          .map(([name, count]) => ({
            name,
            count,
            percentage: percentage(count, totalRepositories),
            firstAppearance: firstSeen.get(name) === year,
          }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.year - b.year);
}

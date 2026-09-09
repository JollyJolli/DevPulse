import { percentage, sum } from "@/lib/utils/numbers";
import type { DeveloperEra, TechJourneyYear } from "@/types/analytics";
import type { GitHubRepository } from "@/types/github";

function eraTitle(language: string): string {
  return `${language} era`;
}

export function detectDeveloperEras(
  journey: readonly TechJourneyYear[],
  repositories: readonly GitHubRepository[],
): DeveloperEra[] {
  const original = repositories.filter((repo) => !repo.fork && repo.language);
  const candidates = journey
    .filter((year) => year.languages.length > 0)
    .map((year) => ({ year: year.year, dominantLanguage: year.languages[0].name }));
  if (!candidates.length) return [];

  const groups: Array<{ startYear: number; endYear: number; dominantLanguage: string }> = [];
  for (const candidate of candidates) {
    const current = groups.at(-1);
    if (
      current &&
      current.dominantLanguage === candidate.dominantLanguage &&
      candidate.year <= current.endYear + 1
    ) {
      current.endYear = candidate.year;
    } else {
      groups.push({
        startYear: candidate.year,
        endYear: candidate.year,
        dominantLanguage: candidate.dominantLanguage,
      });
    }
  }

  return groups.map((group) => {
    const eraRepositories = original
      .filter((repo) => {
        const year = new Date(repo.created_at).getUTCFullYear();
        return year >= group.startYear && year <= group.endYear;
      })
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at ?? b.updated_at).getTime() -
            new Date(a.pushed_at ?? a.updated_at).getTime(),
      );
    const matching = eraRepositories.filter((repo) => repo.language === group.dominantLanguage).length;
    const range =
      group.startYear === group.endYear
        ? String(group.startYear)
        : `${group.startYear}–${group.endYear}`;
    return {
      id: `${group.startYear}-${group.endYear}-${group.dominantLanguage.toLowerCase()}`,
      startYear: group.startYear,
      endYear: group.endYear,
      dominantLanguage: group.dominantLanguage,
      title: eraTitle(group.dominantLanguage),
      repositoryShare: percentage(matching, eraRepositories.length),
      repositories: eraRepositories.slice(0, 4).map((repo) => ({
        name: repo.name,
        html_url: repo.html_url,
        language: repo.language,
      })),
      explanation: `${group.dominantLanguage} was the most common primary language among original repositories created in ${range}.`,
    };
  });
}

export function eraForYear(eras: readonly DeveloperEra[], year: number): DeveloperEra | null {
  return eras.find((era) => year >= era.startYear && year <= era.endYear) ?? null;
}

export function languageDiversity(journey: readonly TechJourneyYear[]): number {
  return new Set(journey.flatMap((year) => year.languages.map((language) => language.name))).size;
}

export function journeyRepositoryTotal(journey: readonly TechJourneyYear[]): number {
  return sum(journey.map((year) => year.totalRepositories));
}

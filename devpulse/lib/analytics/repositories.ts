import { ABANDONED_DAYS, GRAVEYARD_DAYS } from "@/constants/analytics";
import { daysSince } from "@/lib/utils/dates";
import { percentage, sum } from "@/lib/utils/numbers";
import type {
  ActiveProject,
  GraveyardEntry,
  ProjectLifecycle,
  RepoContribution,
  RepositoryHealth,
} from "@/types/analytics";
import type { GitHubRepository } from "@/types/github";

export function calculateRepositoryHealth(repo: GitHubRepository, now = new Date()): RepositoryHealth {
  const checks = {
    description: Boolean(repo.description),
    license: Boolean(repo.license),
    topics: repo.topics.length > 0,
    homepage: Boolean(repo.homepage),
    maintained: daysSince(repo.pushed_at, now) <= 180 && !repo.archived,
    issuesEnabled: repo.has_issues !== false,
  };
  const weights: Record<keyof typeof checks, number> = {
    description: 15,
    license: 20,
    topics: 10,
    homepage: 10,
    maintained: 35,
    issuesEnabled: 10,
  };
  const score = (Object.keys(checks) as Array<keyof typeof checks>).reduce(
    (total, key) => total + (checks[key] ? weights[key] : 0),
    0,
  );
  return { score, checks };
}

export function classifyProjectLifecycle(
  repo: GitHubRepository,
  recentActivity = 0,
  options: { revived?: boolean; now?: Date } = {},
): ProjectLifecycle {
  const now = options.now ?? new Date();
  const age = daysSince(repo.created_at, now);
  const inactive = daysSince(repo.pushed_at, now);
  if (repo.archived) return "archived";
  if (options.revived) return "revived";
  if (age < 60) return "created";
  if (inactive >= ABANDONED_DAYS && age >= 365) return "abandoned";
  if (inactive >= GRAVEYARD_DAYS && age >= 270) return "dormant";
  if (inactive >= 90) return "cooling";
  if (recentActivity >= 25) return "peak";
  if (recentActivity >= 8 || (age < 180 && inactive < 30)) return "growing";
  return "stable";
}

export function buildActiveProjects(
  repositories: readonly GitHubRepository[],
  current: readonly RepoContribution[],
  previous: readonly RepoContribution[] = [],
  now = new Date(),
): ActiveProject[] {
  const repoMap = new Map(repositories.map((repo) => [repo.full_name.toLowerCase(), repo]));
  const previousMap = new Map(previous.map((repo) => [repo.nameWithOwner.toLowerCase(), repo.count]));
  const total = sum(current.map((repo) => repo.count));
  let projects = current.map((project) => {
    const repo = repoMap.get(project.nameWithOwner.toLowerCase());
    const previousCount = previousMap.get(project.nameWithOwner.toLowerCase()) ?? 0;
    return {
      ...project,
      repo,
      percentage: percentage(project.count, total),
      trend:
        previousCount > 0
          ? Math.round(((project.count - previousCount) / previousCount) * 100)
          : null,
      lifecycle: repo ? classifyProjectLifecycle(repo, project.count, { now }) : ("stable" as const),
      health: repo
        ? calculateRepositoryHealth(repo, now)
        : {
            score: 0,
            checks: {
              description: false,
              license: false,
              topics: false,
              homepage: false,
              maintained: false,
              issuesEnabled: false,
            },
          },
    } satisfies ActiveProject;
  });

  if (!projects.length) {
    projects = repositories
      .filter((repo) => !repo.archived)
      .sort((a, b) => new Date(b.pushed_at ?? 0).getTime() - new Date(a.pushed_at ?? 0).getTime())
      .slice(0, 8)
      .map((repo) => ({
        name: repo.name,
        nameWithOwner: repo.full_name,
        url: repo.html_url,
        count: 0,
        repo,
        percentage: 0,
        trend: null,
        lifecycle: classifyProjectLifecycle(repo, 0, { now }),
        health: calculateRepositoryHealth(repo, now),
      }));
  }
  return projects
    .sort(
      (a, b) =>
        b.count - a.count ||
        new Date(b.repo?.pushed_at ?? 0).getTime() -
          new Date(a.repo?.pushed_at ?? 0).getTime(),
    )
    .slice(0, 8);
}

export function classifyGraveyard(
  repositories: readonly GitHubRepository[],
  now = new Date(),
): GraveyardEntry[] {
  return repositories
    .filter((repo) => !repo.fork && repo.size > 0)
    .map((repo) => {
      const inactiveDays = daysSince(repo.pushed_at, now);
      const ageDays = daysSince(repo.created_at, now);
      const classification: GraveyardEntry["classification"] | null = repo.archived
        ? "archived"
        : inactiveDays >= ABANDONED_DAYS && ageDays >= 365
          ? "abandoned"
          : inactiveDays >= GRAVEYARD_DAYS && ageDays >= 270
            ? "dormant"
            : null;
      if (!classification) return null;
      const evidence = [
        `${inactiveDays} days since the latest public push`,
        `${Math.max(1, Math.round(ageDays / 30))} months old`,
      ];
      if (repo.archived) evidence.push("marked archived on GitHub");
      if (repo.stargazers_count > 0 || repo.forks_count > 0) {
        evidence.push("has prior public adoption signals");
      }
      return { repo, classification, inactiveDays, evidence } satisfies GraveyardEntry;
    })
    .filter((entry): entry is GraveyardEntry => entry !== null)
    .sort((a, b) => b.inactiveDays - a.inactiveDays)
    .slice(0, 8);
}

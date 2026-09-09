import type { DeveloperEra, TechJourneyYear, TimelineEvent } from "@/types/analytics";
import type { GitHubRepository, GitHubUser } from "@/types/github";

export function buildDeveloperTimeline(input: {
  user: GitHubUser;
  repositories: readonly GitHubRepository[];
  eras: readonly DeveloperEra[];
  techJourney: readonly TechJourneyYear[];
}): TimelineEvent[] {
  const { user, repositories, eras, techJourney } = input;
  const events: TimelineEvent[] = [
    {
      id: "account-created",
      date: user.created_at,
      year: String(new Date(user.created_at).getUTCFullYear()),
      title: "Joined GitHub",
      description: `@${user.login} account created.`,
      href: user.html_url,
      kind: "account",
      rank: 100,
    },
  ];

  const original = repositories.filter((repo) => !repo.fork);
  const oldest = [...original].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )[0];
  const newest = [...original].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
  const mostStarred = [...original].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];

  for (const [repo, title, description, rank] of [
    [oldest, oldest ? `Created ${oldest.name}` : "", "Oldest public original repository currently visible.", 90],
    [newest, newest ? `Created ${newest.name}` : "", "Newest public original repository.", 80],
    [mostStarred, mostStarred ? `${mostStarred.name} leads the portfolio` : "", mostStarred ? `${mostStarred.stargazers_count} stars received.` : "", 85],
  ] as const) {
    if (!repo) continue;
    events.push({
      id: `repo-${repo.id}-${rank}`,
      date: rank === 85 ? repo.pushed_at ?? repo.updated_at : repo.created_at,
      year: rank === 85 ? "NOW" : String(new Date(repo.created_at).getUTCFullYear()),
      title,
      description,
      href: repo.html_url,
      kind: rank === 85 ? "record" : "repository",
      rank,
    });
  }

  for (const era of eras.slice(-4)) {
    events.push({
      id: `era-${era.id}`,
      date: `${era.startYear}-01-01T00:00:00.000Z`,
      year: era.startYear === era.endYear ? String(era.startYear) : `${era.startYear}–${era.endYear}`,
      title: era.title,
      description: era.explanation,
      href: era.repositories[0]?.html_url,
      kind: "era",
      rank: 70,
    });
  }

  const firstAppearances = new Map<string, number>();
  for (const year of techJourney) {
    for (const language of year.languages) {
      if (language.firstAppearance && !firstAppearances.has(language.name)) {
        firstAppearances.set(language.name, year.year);
      }
    }
  }
  for (const [language, year] of [...firstAppearances.entries()].slice(-4)) {
    events.push({
      id: `language-${language}-${year}`,
      date: `${year}-01-01T00:00:00.000Z`,
      year: String(year),
      title: `${language} appeared`,
      description: `First public original repository with ${language} as its primary language.`,
      kind: "language",
      rank: 50,
    });
  }

  const deduplicated = new Map<string, TimelineEvent>();
  for (const event of events) {
    const key = `${event.title.toLowerCase()}-${event.year}`;
    const existing = deduplicated.get(key);
    if (!existing || event.rank > existing.rank) deduplicated.set(key, event);
  }
  return [...deduplicated.values()]
    .sort((a, b) => {
      if (a.year === "NOW") return -1;
      if (b.year === "NOW") return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime() || b.rank - a.rank;
    })
    .slice(0, 14);
}

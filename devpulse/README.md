# DevPulse

[devpulse.formen.cc](https://devpulse.formen.cc) · public GitHub analytics, without user accounts.

DevPulse explains public development activity through project focus, contribution patterns, languages, repository evidence, developer eras and yearly comparisons. The existing Next.js application is preserved inside this directory.

## Features

- Public profile dashboard with the avatar-derived header and 7D, 30D, 90D, 1Y and ALL ranges.
- Contribution calendar, activity distribution, streaks, consistency, burstiness and period changes.
- Focus Score, active projects, portfolio coverage, deterministic lifecycle and graveyard rules.
- Language distribution weighted by measurable repository activity, technology journey and annual eras.
- Eight trophy levels with more than 160 possible milestones; progress toward the next threshold.
- Project Radar: scoped commit diffs, PR merge statistics, languages, engineering practices, releases, CI links, revival evidence and commit timestamp matrix.
- Yearly Wrapped, Then vs Now, and two-profile comparison.
- English and Spanish dictionaries, recent profiles and favorites stored on the current device.
- Dynamic Open Graph images for profiles and Wrapped; dedicated trophy, era and year-comparison share pages.
- Optional Supabase snapshot recording, with explicit observation timestamps.

## Architecture

```text
app/                       Thin route handlers and page composition
  u/[username]/            Profile, Wrapped, comparison, repository and share routes
  compare/                 Two public profiles
  api/share/               Server-rendered social images
components/                Home, profile, repository, Wrapped, comparison and UI
lib/github/                Server-only REST/GraphQL requests and query definitions
lib/analytics/             Deterministic business calculations
lib/data/                  Prepared application data and request orchestration
lib/cache/                 Bounded manual-refresh guard
lib/db/                    Opt-in persistence client
lib/i18n/                  English, Spanish and generated-evidence translations
lib/utils/                 Dates, numeric formatting and username parsing
types/                     GitHub, analytics, profile and repository contracts
constants/                 Cache policy, thresholds and palette
tests/                     Node business-logic and API error tests
supabase/migrations/       PostgreSQL schema and transactional ingestion function
```

UI components never call GitHub directly. The token is confined to server modules. Deep repository analysis is a separate route, so it does not delay the initial profile.

## GitHub data and limits

REST supplies public profiles, owned repositories, public events and repository details. GraphQL supplies contribution calendars, repository commit contributions and available years. All requests pass through `lib/github/client.ts`.

Without `GITHUB_TOKEN`, the dashboard uses recent public **events**. Push events are not commit totals. Event-derived ranges are explicitly limited, and historical yearly contributions are unavailable. API outages use recoverable error boundaries, not invented activity.

Repository enumeration is bounded at 1,000 repositories. GraphQL repository contributions are bounded at 100 repositories per range; Focus measures the available repository commit distribution, not all types of contribution. Primary-language evidence does not prove the language of individual changed lines or historical skill. No measured matches yields an empty language distribution.

Project Radar uses the latest 100 owner-authored commits. Diff statistics use at most 12 of those commits within the latest 90 days. Revival detection examines gaps within the 100-commit sample. PRs, issues and releases use one API page; workflow runs use at most 50. Failed or truncated deep requests show a partial-data notice. Counts are scoped observations, not lifetime totals. Commit timestamps are UTC and are never converted into hours worked.

## Formulas

**Focus Score** = round(100 × sum(repository activity share²)). One repository holding all measured activity scores 100. Repositories are aggregated case-insensitively before calculation. Top-project share, top-three share and normalized entropy provide context. This is concentration, not developer quality.

**Consistency** combines active-day percentage (65%) and regularity of active-day counts (35%). **Burstiness** uses the coefficient of variation across all calendar days, including inactivity: round(100 × CV / (CV + 1)). Missing dates between observed boundaries are filled with zero; no dates outside the available evidence are invented.

**Health** checks description (15), license (20), topics (10), website (10), recent maintenance (35) and issues enabled (10). It is an explicit repository checklist, not code quality.

**Lifecycle** considers archive status, age and inactivity. New repositories are under 60 days old. Cooling starts at 90 inactive days. Dormancy requires at least 180 inactive days and 270 days of age. Abandonment requires at least 730 inactive days and one year of age. Recent activity distinguishes stable, growing and peak. A revival requires a measured gap of at least 120 days; the revived label applies only for a recent resumption. Graveyard excludes forks and empty repositories.

**Eras** group adjacent repository-creation years with the same dominant primary language. Shares refer to original repositories created during that era. They do not claim historical activity shares.

## Trophies and Wrapped

Trophy families have Bronze, Silver, Gold, Emerald, Platinum, Diamond, Master and Mythic thresholds. Every satisfied level is counted, while the cabinet displays the highest unlocked level per family. Progress is measured between the previous and next thresholds.

Wrapped uses one calendar year's contributions and repositories started that year. It does not attribute today's stars or followers to a historical year. Wrapped trophies are restricted to period-based metrics; historical unlock dates require observed snapshots. Without complete contribution history, a limitation notice accompanies available data.

Then vs Now compares two years with GraphQL history. Current-year values are year-to-date; a completed year and an ongoing year have different durations. Profile comparisons describe factual differences and do not choose a winner.

## Local development

Use Node.js 24 or later for the bundled test runner.

```sh
cd devpulse
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` only when creating a new local configuration; preserve an existing `.env.local`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Tests use Node's test runner and the already-installed TypeScript compiler. The test-only loader resolves application aliases and neutralizes the `server-only` marker; production imports retain the server boundary. Business tests cover focus, ranges, ALL aggregation, streaks, distributions, languages, graveyard, revival, diffs, PRs, trophies, eras, Wrapped, comparisons, usernames, API failures and refresh cooldowns. They do not require live GitHub credentials.

## Environment

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Server-only GitHub token for GraphQL and higher API limits |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin; defaults to https://devpulse.formen.cc |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved; the current server persistence path does not use it |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for snapshot writes |
| `DEVPULSE_PERSIST_SNAPSHOTS` | Explicit opt-in, default false |

Never prefix the GitHub token or service-role key with `NEXT_PUBLIC_`. Never commit credentials.

## Supabase

Apply `supabase/migrations/001_initial_schema.sql` to a new Supabase project, configure the server credentials, then set `DEVPULSE_PERSIST_SNAPSHOTS=true`. No Supabase Auth is used. RLS is enabled and anonymous/authenticated roles have no access to these tables. The service role invokes the transactional `record_profile_snapshot` function.

After a successful deep profile response, DevPulse records profile observations, daily contributions, repository activity, language snapshots, trophy observations and sync completion. Recording is skipped for limited or failed GitHub data. Errors do not break the delivered dashboard.

The schema also prepares repository metadata/snapshots, eras, timeline and Wrapped tables for future ingestion. Those prepared tables are not yet populated by the current profile writer. Snapshot history is persisted but historical database-driven views are a follow-up; current comparisons use GitHub contribution history.

Daily profile snapshots are unique per profile, date and range. Trophy `first_observed_at` is when tracking first observed a milestone, not its original achievement date. No historical star growth is fabricated.

The SQL migration has not been applied to a live database as part of this repository change. Validate it in your Supabase staging project before enabling writes.

## Caching and production

Profile metadata: 6 hours. Owned repositories: 1 hour. Current contribution periods: 30 minutes. Closed historical years: 30 days. Repository details: 6 hours. Repository trees: 24 hours. ALL fetches years in groups of three. React request memoization avoids duplicate prepared-data work during rendering.

Manual refresh uses a 60-second client cooldown plus a bounded per-process server guard. For multi-instance production, add an edge/distributed rate limit; an in-memory guard alone is not a global abuse-control system.

For Vercel, import the repository with **Root Directory = devpulse**, configure environment variables, use the standard Next.js build, and attach `devpulse.formen.cc`. Keep preview and production credentials separate. This change does not publish a deployment or modify DNS.

## Known boundaries and follow-up work

- GitHub provides incomplete public evidence; private work and deleted repositories are not reconstructed.
- Snapshots cannot reveal history before tracking began. Star growth, historical trophy unlocks and repository health changes require future observations.
- Recent-event fallback, repository enumeration and deep samples are capped.
- Eras use repository creation and primary-language evidence, not month-by-month historical code analysis.
- Snapshot read views, background synchronization, broader collaboration networks and richer release history can build on the current schema.
- Static checks and HTTP smoke checks do not substitute for a full browser accessibility/mobile review.

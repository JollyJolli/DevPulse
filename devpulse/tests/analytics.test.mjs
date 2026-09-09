import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFocus } from '@/lib/analytics/focus-score';
import { calculateActivityDNA, calculateStreaks } from '@/lib/analytics/activity';
import { calculateLanguageDistribution, buildTechJourney } from '@/lib/analytics/languages';
import { classifyGraveyard, buildActiveProjects } from '@/lib/analytics/repositories';
import { detectRevival, calculateCommitImpact, calculatePullRequestAnalytics } from '@/lib/analytics/repository-intelligence';
import { detectDeveloperEras } from '@/lib/analytics/eras';
import { unlockTrophies, buildTrophyFamilies } from '@/lib/analytics/trophies';
import { buildPeriodSnapshot, profileComparisonObservations } from '@/lib/analytics/comparisons';
import { mergeContributionData, buildEventFallback } from '@/lib/github/contributions';
import { normalizeUsername } from '@/lib/utils/username';
import { rangeDates, yearDates, isoDay } from '@/lib/utils/dates';

const now = new Date('2026-09-09T12:00:00Z');
const repo = (overrides = {}) => ({
  id: 1, name: 'one', full_name: 'dev/one', html_url: 'https://github.com/dev/one',
  fork: false, archived: false, created_at: '2024-01-01T00:00:00Z',
  pushed_at: '2026-09-09T00:00:00Z', updated_at: '2026-09-09T00:00:00Z',
  description: 'Test repository', topics: [], language: 'TypeScript',
  license: null, homepage: null, size: 10, stargazers_count: 0, forks_count: 0,
  ...overrides,
});
const contribution = (name, count) => ({ name, nameWithOwner: 'dev/' + name, url: 'https://github.com/dev/' + name, count });
const day = (date, contributionCount) => ({ date, contributionCount });
const data = (overrides = {}) => ({
  source: 'graphql', limited: false, totalContributions: 0, totalCommits: 0,
  totalIssues: 0, totalPullRequests: 0, totalReviews: 0, totalRepositoriesCreated: 0,
  days: [], repoContributions: [], ...overrides,
});

test('Focus aggregates case-insensitive duplicates and does not depend on ordering', () => {
  const result = calculateFocus([contribution('two', 2), contribution('ONE', 4), contribution('one', 4)]);
  assert.equal(result.score, 68);
  assert.equal(result.topProjectShare, 80);
  assert.equal(result.activeRepositories, 2);
  assert.equal(calculateFocus([]).label, 'none');
  assert.equal(calculateFocus([contribution('one', 10)]).score, 100);
});

test('rolling periods have adjacent, non-overlapping calendar boundaries', () => {
  for (const [range, length] of [['7D', 7], ['30D', 30], ['90D', 90], ['1Y', 365]]) {
    const dates = rangeDates(range, now);
    assert.equal(dates.days, length);
    assert.equal(dates.previousTo.getTime() + 1, dates.currentFrom.getTime());
    assert.equal((dates.previousTo - dates.previousFrom + 1) / 86400000, length);
  }
  const leap = yearDates(2024, now);
  assert.equal((leap.to - leap.from + 1) / 86400000, 366);
  assert.equal(yearDates(2026, now).to.getTime(), now.getTime());
});

test('ALL merges repository totals across years and sorts the calendar', () => {
  const all = mergeContributionData([
    data({ totalContributions: 3, totalCommits: 3, days: [day('2025-01-01', 3)], repoContributions: [contribution('ONE', 3)] }),
    data({ totalContributions: 2, totalCommits: 2, days: [day('2024-01-01', 2)], repoContributions: [contribution('one', 2)] }),
  ]);
  assert.equal(all.totalContributions, 5);
  assert.equal(all.repoContributions.length, 1);
  assert.equal(all.repoContributions[0].count, 5);
  assert.equal(all.days[0].date, '2024-01-01');
});

test('streaks include yesterday, fill missing dates and exclude historic current streaks', () => {
  const days = [day('2026-09-06', 2), day('2026-09-08', 4), day('2026-09-09', 1)];
  assert.deepEqual(calculateStreaks(days, now), { current: 2, longest: 2, average: 1.5 });
  assert.equal(calculateStreaks([day('2026-09-08', 1)], now).current, 1);
  assert.equal(calculateStreaks([day('2024-01-01', 1)], now).current, 0);
});

test('regular activity and isolated bursts have different distributions', () => {
  const steady = calculateActivityDNA(Array.from({ length: 9 }, (_, index) => day('2026-09-0' + (index + 1), 3)), now);
  const burst = calculateActivityDNA([day('2026-09-01', 0), day('2026-09-09', 27)], now);
  assert.equal(steady.consistency, 100);
  assert.equal(steady.burstiness, 0);
  assert.ok(burst.burstiness > 60);
  assert.equal(burst.longestInactivityGap, 8);
  const empty = calculateActivityDNA([day('2026-09-01', 0)], now);
  assert.equal(empty.bestWeek, null);
  assert.equal(empty.bestMonth, null);
});

test('language aggregation weights activity and never invents historical languages', () => {
  const repos = [repo(), repo({ id: 2, name: 'two', full_name: 'dev/two', language: 'Python' })];
  const languages = calculateLanguageDistribution(repos, [contribution('one', 8), contribution('two', 2)]);
  assert.equal(languages[0].percentage, 80);
  assert.deepEqual(calculateLanguageDistribution(repos, []), []);
  const many = Array.from({ length: 21 }, (_, i) => repo({ id: i, name: String(i), full_name: 'dev/' + i, language: 'Language' + i }));
  assert.equal(calculateLanguageDistribution(many, [], true).length, 21);
});

test('graveyard considers age, fork status and prior repository content', () => {
  const dormant = repo({ pushed_at: '2025-01-01T00:00:00Z' });
  assert.equal(classifyGraveyard([dormant], now)[0].classification, 'dormant');
  assert.equal(classifyGraveyard([{ ...dormant, fork: true }], now).length, 0);
  assert.equal(classifyGraveyard([{ ...dormant, size: 0 }], now).length, 0);
  assert.equal(classifyGraveyard([{ ...dormant, archived: true }], now)[0].classification, 'archived');
});

test('active projects rank measured activity before truncation', () => {
  const projects = Array.from({ length: 10 }, (_, i) => contribution(String(i), i + 1));
  assert.equal(buildActiveProjects([], projects, [], now)[0].count, 10);
});

test('revival requires a real gap between dated commits', () => {
  const commit = (date) => ({ commit: { author: { date }, committer: null } });
  assert.equal(detectRevival(repo(), [commit('2026-01-01'), commit('2026-08-01')]).dormantDays, 212);
  assert.equal(detectRevival(repo(), [commit('2026-08-01'), commit('2026-08-02')]), null);
});

test('diff impact and PR merge duration use measured values', () => {
  const impact = calculateCommitImpact([{ sha: 'a', stats: { additions: 12, deletions: 5, total: 17 }, commit: { message: 'feat: test', verification: { verified: true } } }]);
  assert.equal(impact.changedLines, 17);
  assert.equal(impact.netChange, 7);
  assert.equal(impact.conventionalCommitPercentage, 100);
  const prs = calculatePullRequestAnalytics([{ state: 'closed', created_at: '2026-01-01T00:00:00Z', merged_at: '2026-01-02T00:00:00Z' }, { state: 'closed', merged_at: null }]);
  assert.equal(prs.mergeRate, 50);
  assert.equal(prs.medianMergeHours, 24);
});

test('trophy thresholds unlock cumulatively and progression resets at each level', () => {
  const result = unlockTrophies([{ name: 'Test', description: '', value: 7, thresholds: [1, 5, 10] }]);
  assert.equal(result.all.length, 2);
  assert.equal(result.highest[0].tier.name, 'Silver');
  assert.equal(result.next[0].progress, 40);
  assert.equal(result.totalPossible, 3);
  const families = buildTrophyFamilies({
    user: { created_at: '2024-01-01', followers: 0, following: 0, public_gists: 0 },
    repositories: [repo(), repo({ id: 2, fork: true })],
    contributionData: data(), activity: calculateActivityDNA([], now), languages: [],
    externalContributionPercentage: 0, now,
  });
  assert.equal(families.find((family) => family.name === 'Portfolio Freshness').value, 100);
  assert.ok(unlockTrophies(families).totalPossible >= 160);
});

test('eras merge adjacent years with the same dominant language', () => {
  const repositories = [repo(), repo({ id: 2, created_at: '2025-01-01' }), repo({ id: 3, language: 'Python', created_at: '2026-01-01' })];
  const eras = detectDeveloperEras(buildTechJourney(repositories), repositories);
  assert.equal(eras.length, 2);
  assert.equal(eras[0].startYear, 2024);
  assert.equal(eras[0].endYear, 2025);
  assert.equal(eras[1].dominantLanguage, 'Python');
});

test('year and profile comparisons report facts in both languages', () => {
  const left = buildPeriodSnapshot('2024', data({ days: [day('2024-01-01', 3)], repoContributions: [contribution('one', 3)] }), []);
  const right = buildPeriodSnapshot('2025', data(), []);
  assert.equal(left.activeRepositories, 1);
  assert.ok(profileComparisonObservations(left, right).length > 0);
  assert.ok(profileComparisonObservations(left, right, 'es').some((text) => text.includes('actividad')));
});

test('username normalization accepts digits and rejects non-GitHub hostnames', () => {
  assert.equal(normalizeUsername(' https://github.com/JollyJolli/ '), 'jollyjolli');
  assert.equal(normalizeUsername('@123dev'), '123dev');
  assert.equal(normalizeUsername('-invalid'), null);
  assert.equal(normalizeUsername('https://evil.example/user'), null);
  assert.equal(normalizeUsername('%ZZ'), null);
  assert.equal(isoDay(new Date('2024-03-01T00:00:00Z')), '2024-03-01');
});

test('event fallback counts push events, not invented commits', () => {
  const fallback = buildEventFallback([{ id: '1', type: 'PushEvent', created_at: now.toISOString(), repo: { name: 'dev/one' } }], 'ALL', now);
  assert.equal(fallback.source, 'events');
  assert.equal(fallback.totalCommits, 1);
  assert.equal(fallback.limited, true);
});


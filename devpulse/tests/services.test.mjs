import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWrappedSummary } from '@/lib/analytics/wrapped';
import { githubRest } from '@/lib/github/client';
import { allowRefresh } from '@/lib/cache/refresh';

test('Wrapped uses only the requested year and period trophy metrics', () => {
  const user = { login: 'dev', created_at: '2020-01-01', followers: 1000, following: 0, public_gists: 0 };
  const repositories = [{ id: 1, full_name: 'dev/one', name: 'one', language: 'C', fork: false, topics: [], created_at: '2024-01-01', pushed_at: '2026-01-01', stargazers_count: 900, forks_count: 0 }];
  const contributions = { source: 'graphql', limited: false, totalContributions: 10, totalCommits: 10, totalIssues: 0, totalPullRequests: 0, totalReviews: 0, totalRepositoriesCreated: 0, days: [{ date: '2025-01-01', contributionCount: 10 }], repoContributions: [] };
  const result = buildWrappedSummary(user, repositories, contributions, 2025, [2025, 2024]);
  assert.equal(result.projectsStarted.length, 0);
  assert.equal(result.contributionData.totalContributions, 10);
  assert.equal(result.languages.length, 0);
  assert.equal(result.trophies.all.some((trophy) => trophy.family === 'Star Power'), false);
});

test('GitHub client distinguishes 404, rate limits and upstream outages', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.equal(await githubRest('/users/missing', { allowNotFound: true }), null);
    globalThis.fetch = async () => new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } });
    await assert.rejects(githubRest('/users/dev'), (error) => error.kind === 'rate-limit');
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(githubRest('/users/dev'), (error) => error.kind === 'unavailable');
  } finally { globalThis.fetch = original; }
});

test('manual refresh has a server-side cooldown', () => {
  assert.equal(allowRefresh('test', true, 100), true);
  assert.equal(allowRefresh('test', true, 101), false);
  assert.equal(allowRefresh('test', true, 60101), true);
  assert.equal(allowRefresh('other', false, 60101), false);
});


import test from 'node:test';
import assert from 'node:assert/strict';
import { commitTiming } from '@/lib/analytics/commit-timing';
import { compareNumber } from '@/lib/analytics/trends';
import { detectEngineeringPractices } from '@/lib/analytics/repository-intelligence';
import { buildDeveloperTimeline } from '@/lib/analytics/timeline';

test('timestamps use UTC and ignore missing or invalid dates', () => {
  const result = commitTiming([{ commit: { author: { date: '2026-09-07T23:30:00-02:00' } } }, { commit: { author: { date: 'invalid' } } }]);
  assert.equal(result.sampled, 1);
  assert.equal(result.cells[1][1], 1);
});
test('trends avoid invented percent growth from a zero baseline', () => {
  assert.deepEqual(compareNumber(15, 10), { current: 15, previous: 10, delta: 5, percent: 50 });
  assert.equal(compareNumber(5, 0).percent, null);
  assert.equal(compareNumber(0, 10).percent, -100);
});
test('engineering practices recognize dotfiles and Docker Compose', () => {
  const result = detectEngineeringPractices(['.eslintrc.json', '.prettierrc', 'docker-compose.yml'].map(path=>({path,type:'blob'})), null);
  for (const id of ['lint','format','docker']) assert.equal(result.find(item=>item.id===id).detected, true);
});
test('timeline does not assign an achievement date to current stars', () => {
  const result = buildDeveloperTimeline({ user: { login: 'dev', created_at: '2020-01-01', html_url: 'https://github.com/dev' }, repositories: [], eras: [], techJourney: [] });
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, 'account');
  assert.equal(result[0].year, '2020');
});


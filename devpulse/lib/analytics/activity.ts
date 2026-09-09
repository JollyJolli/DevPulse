import { addDays, daysBetween, isoDay } from "@/lib/utils/dates";
import { clamp, mean, median, round, sum, variance } from "@/lib/utils/numbers";
import type {
  ActivityDNA,
  ActivityRecord,
  ContributionDay,
  WeekdayActivity,
} from "@/types/analytics";

function normalizedDays(days: readonly ContributionDay[]): ContributionDay[] {
  if (!days.length) return [];
  const values = new Map(days.map((day) => [day.date, day.contributionCount]));
  const sortedDates = [...values.keys()].sort();
  const from = new Date(`${sortedDates[0]}T00:00:00.000Z`);
  const to = new Date(`${sortedDates.at(-1)}T00:00:00.000Z`);
  const result: ContributionDay[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    const date = isoDay(cursor);
    result.push({ date, contributionCount: values.get(date) ?? 0 });
  }
  return result;
}

function streakRuns(days: readonly ContributionDay[]): number[] {
  const runs: number[] = [];
  let running = 0;
  for (const day of normalizedDays(days)) {
    if (day.contributionCount > 0) {
      running += 1;
    } else if (running > 0) {
      runs.push(running);
      running = 0;
    }
  }
  if (running > 0) runs.push(running);
  return runs;
}

export function calculateStreaks(days: readonly ContributionDay[], now = new Date()) {
  const calendar = normalizedDays(days);
  const runs = streakRuns(calendar);
  const byDate = new Map(calendar.map((day) => [day.date, day.contributionCount]));
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if ((byDate.get(isoDay(cursor)) ?? 0) === 0) cursor = addDays(cursor, -1);
  let current = 0;
  while ((byDate.get(isoDay(cursor)) ?? 0) > 0) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return {
    current,
    longest: runs.length ? Math.max(...runs) : 0,
    average: runs.length ? round(mean(runs), 1) : 0,
  };
}

function bestGroupedRecord(
  days: readonly ContributionDay[],
  keyForDay: (date: Date) => string,
): ActivityRecord | null {
  const totals = new Map<string, number>();
  for (const day of days) {
    const key = keyForDay(new Date(`${day.date}T12:00:00.000Z`));
    totals.set(key, (totals.get(key) ?? 0) + day.contributionCount);
  }
  if (![...totals.values()].some((value) => value > 0)) return null;
  return [...totals.entries()].reduce<ActivityRecord | null>(
    (best, [label, value]) => (!best || value > best.value ? { label, value } : best),
    null,
  );
}

function weekStart(date: Date): string {
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return isoDay(addDays(date, mondayOffset));
}

export function weekdayActivity(days: readonly ContributionDay[]): WeekdayActivity[] {
  const values = [0, 0, 0, 0, 0, 0, 0];
  for (const day of days) {
    const weekday = new Date(`${day.date}T12:00:00.000Z`).getUTCDay();
    values[weekday === 0 ? 6 : weekday - 1] += day.contributionCount;
  }
  const labels: WeekdayActivity["day"][] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return labels.map((day, index) => ({ day, value: values[index] }));
}

export function calculateActivityDNA(
  input: readonly ContributionDay[],
  now = new Date(),
): ActivityDNA {
  const days = normalizedDays(input);
  const active = days.filter((day) => day.contributionCount > 0);
  const inactiveDays = days.length - active.length;
  const activeValues = active.map((day) => day.contributionCount);
  const allValues = days.map((day) => day.contributionCount);
  const activeDayPercentage = days.length ? round((active.length / days.length) * 100, 1) : 0;
  const average = mean(activeValues);
  const activityVariance = variance(allValues);
  const standardDeviation = Math.sqrt(variance(activeValues));
  const coefficient = average > 0 ? standardDeviation / average : 0;
  const allAverage = mean(allValues);
  const allCoefficient =
    allAverage > 0 ? Math.sqrt(activityVariance) / allAverage : 0;
  const regularity = average > 0 ? (1 - clamp(coefficient, 0, 1)) * 100 : 0;
  const consistency = Math.round(activeDayPercentage * 0.65 + regularity * 0.35);
  const burstiness =
    allAverage > 0 ? Math.round((allCoefficient / (allCoefficient + 1)) * 100) : 0;
  const weekdays = weekdayActivity(days);
  const weekendContributions = weekdays[5].value + weekdays[6].value;
  const totalContributions = sum(allValues);
  const streaks = calculateStreaks(days, now);

  let longestInactivityGap = 0;
  let inactiveRun = 0;
  for (const day of days) {
    if (day.contributionCount === 0) {
      inactiveRun += 1;
      longestInactivityGap = Math.max(longestInactivityGap, inactiveRun);
    } else {
      inactiveRun = 0;
    }
  }

  const bestDay = active.reduce<ActivityRecord | null>(
    (best, day) =>
      !best || day.contributionCount > best.value
        ? { label: day.date, value: day.contributionCount }
        : best,
    null,
  );

  const pattern: ActivityDNA["pattern"] =
    active.length < 3
      ? "insufficient"
      : consistency >= 65 && burstiness < 45
        ? "consistent"
        : burstiness >= 60 || activeDayPercentage < 25
          ? "burst-heavy"
          : "balanced";

  return {
    activeDays: active.length,
    inactiveDays,
    activeDayPercentage,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    averageStreak: streaks.average,
    longestInactivityGap,
    contributionsPerActiveDay: round(average, 1),
    medianContributionsPerActiveDay: round(median(activeValues), 1),
    variance: round(activityVariance, 2),
    consistency,
    burstiness,
    pattern,
    weekendPercentage: totalContributions
      ? Math.round((weekendContributions / totalContributions) * 100)
      : 0,
    bestDay,
    bestWeek: bestGroupedRecord(days, weekStart),
    bestMonth: bestGroupedRecord(days, (date) => date.toISOString().slice(0, 7)),
    bestYear: bestGroupedRecord(days, (date) => String(date.getUTCFullYear())),
    weekdays,
  };
}

export function contributionBuckets(days: readonly ContributionDay[], maxBuckets = 28): number[] {
  if (!days.length) return [];
  const bucketSize = Math.max(1, Math.ceil(days.length / maxBuckets));
  const buckets: number[] = [];
  for (let index = 0; index < days.length; index += bucketSize) {
    buckets.push(sum(days.slice(index, index + bucketSize).map((day) => day.contributionCount)));
  }
  return buckets;
}

export function contributionIntensity(count: number, maximum: number): string {
  if (count === 0) return "#FFFFFF22";
  const ratio = maximum ? count / maximum : 0;
  if (ratio < 0.25) return "#78E6D0";
  if (ratio < 0.5) return "#D8FF54";
  if (ratio < 0.75) return "#FFD84D";
  return "#FF6B8A";
}

export function periodDays(days: readonly ContributionDay[]): number {
  if (days.length < 2) return days.length;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return daysBetween(
    new Date(`${sorted[0].date}T00:00:00.000Z`),
    new Date(`${sorted.at(-1)!.date}T00:00:00.000Z`),
  ) + 1;
}

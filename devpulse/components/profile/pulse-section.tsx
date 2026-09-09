import { BarChart3 } from "lucide-react";
import { contributionIntensity } from "@/lib/analytics/activity";
import { formatUtcDate } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { ContributionDay } from "@/types/analytics";
import type { ProfileDashboardData } from "@/types/profile";
import { Stat } from "@/components/ui/stat";

export function PulseSection({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const { contributionData, activity, locale } = data;
  const maximumBar = Math.max(1, ...data.contributionBars);
  const maximumHeat = Math.max(1, ...data.heatmapDays.map((day) => day.contributionCount));
  const metricLabel =
    contributionData.source === "graphql" ? t.pulse.contributions : t.pulse.publicEvents;
  const commitLabel =
    contributionData.source === "graphql" ? t.pulse.commits : t.pulse.pushEvents;
  const heatmap = alignHeatmap(data.heatmapDays);

  return (
    <section id="pulse" className="border-x-2 border-b-2 border-black bg-[#3567FF] p-6 text-white md:p-10">
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
            {t.pulse.eyebrow} · {data.range}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <span className="text-7xl font-black tracking-[-0.07em] md:text-9xl">
              {formatNumber(contributionData.totalContributions, locale)}
            </span>
            <span className="mb-3 font-bold text-white/60">{metricLabel.toLowerCase()}</span>
          </div>
          {data.trends.activity !== null ? (
            <p className="mt-3 font-black">
              {data.trends.activity >= 0 ? "+" : ""}{data.trends.activity}% {t.pulse.versusPrevious} {data.range}
            </p>
          ) : null}
        </div>
        <BarChart3 size={34} aria-hidden="true" />
      </div>

      <div className="mt-12 flex h-40 items-end gap-1 md:gap-2" role="img" aria-label={`${metricLabel}: ${contributionData.totalContributions}`}>
        {data.contributionBars.map((value, index) => {
          const height = value === 0 ? 4 : Math.max(8, (value / maximumBar) * 100);
          return (
            <span
              key={`${index}-${value}`}
              tabIndex={0}
              aria-label={`${metricLabel} ${index + 1}: ${value}`}
              className="flex-1 bg-white/30 transition-colors hover:bg-[#D8FF54] focus:bg-[#D8FF54] focus:outline-none"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
      <div className="mt-4 flex justify-between text-xs font-black text-white/45">
        <span>{t.pulse.start}</span><span>{t.pulse.today}</span>
      </div>

      <div className="mt-10 border-t border-white/25 pt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">{t.pulse.activityMap}</p>
          {data.range === "ALL" ? <p className="text-xs font-bold text-white/45">{t.pulse.latestYear}</p> : null}
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1.5" role="grid" aria-label={t.pulse.activityMap}>
            {heatmap.map((day, index) =>
              day ? (
                <span
                  key={day.date}
                  role="gridcell"
                  tabIndex={0}
                  title={`${formatUtcDate(day.date, locale)}: ${day.contributionCount}`}
                  aria-label={`${formatUtcDate(day.date, locale)}: ${day.contributionCount} ${metricLabel.toLowerCase()}`}
                  className="h-3.5 w-3.5 border border-white/10 transition-transform hover:scale-125 focus:scale-125 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-white"
                  style={{ backgroundColor: contributionIntensity(day.contributionCount, maximumHeat) }}
                />
              ) : (
                <span key={`empty-${index}`} className="h-3.5 w-3.5" aria-hidden="true" />
              ),
            )}
          </div>
        </div>
      </div>

      <dl className="mt-12 grid gap-x-6 gap-y-8 border-t border-white/25 pt-8 sm:grid-cols-2 lg:grid-cols-5">
        <Stat light label={commitLabel} value={formatNumber(contributionData.totalCommits, locale)} />
        <Stat light label={t.pulse.pullRequests} value={formatNumber(contributionData.totalPullRequests, locale)} />
        <Stat light label={t.pulse.reviews} value={formatNumber(contributionData.totalReviews, locale)} />
        <Stat light label={t.pulse.issues} value={formatNumber(contributionData.totalIssues, locale)} />
        <Stat light label={t.pulse.repositoriesCreated} value={formatNumber(contributionData.totalRepositoriesCreated, locale)} />
        <Stat light label={t.pulse.activeDays} value={activity.activeDays} />
        <Stat light label={t.pulse.currentStreak} value={`${activity.currentStreak}d`} />
        <Stat light label={t.pulse.longestStreak} value={`${activity.longestStreak}d`} />
        <Stat light label={t.pulse.repositoriesTouched} value={contributionData.repoContributions.length} />
        <Stat light label={t.pulse.averageActiveDay} value={activity.contributionsPerActiveDay.toFixed(1)} />
      </dl>
    </section>
  );
}

function alignHeatmap(days: readonly ContributionDay[]): Array<ContributionDay | null> {
  if (!days.length) return [];
  const firstWeekday = new Date(`${days[0].date}T12:00:00.000Z`).getUTCDay();
  const mondayIndex = firstWeekday === 0 ? 6 : firstWeekday - 1;
  return [...Array<null>(mondayIndex).fill(null), ...days];
}

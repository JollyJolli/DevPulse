import { Activity } from "lucide-react";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { ActivityDNA as ActivityDNAType } from "@/types/analytics";
import type { ProfileDashboardData } from "@/types/profile";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";

export function ActivityDNA({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const activity = data.activity;
  const maximumWeekday = Math.max(1, ...activity.weekdays.map((day) => day.value));
  const pattern = patternLabel(activity, t);
  return (
    <section id="activity" className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.58fr_0.42fr]">
      <div className="border-black bg-[#FFD84D] p-7 md:p-10 lg:border-r-2">
        <SectionHeading
          eyebrow={t.activity.eyebrow}
          title={t.activity.title}
          description={t.activity.note}
          action={<Activity size={30} aria-hidden="true" />}
        />
        <dl className="mt-10 grid grid-cols-2 gap-x-7 gap-y-9 md:grid-cols-4">
          <Stat label={t.activity.pattern} value={pattern} />
          <Stat label={t.activity.activeShare} value={`${activity.activeDayPercentage}%`} />
          <Stat label={t.activity.activeDays} value={activity.activeDays} />
          <Stat label={t.activity.inactiveDays} value={activity.inactiveDays} />
          <Stat label={t.activity.currentStreak} value={`${activity.currentStreak}d`} />
          <Stat label={t.activity.longestStreak} value={`${activity.longestStreak}d`} />
          <Stat label={t.activity.averageStreak} value={`${activity.averageStreak}d`} />
          <Stat label={t.activity.longestGap} value={`${activity.longestInactivityGap}d`} />
          <Stat label={t.activity.average} value={activity.contributionsPerActiveDay.toFixed(1)} />
          <Stat label={t.activity.median} value={activity.medianContributionsPerActiveDay.toFixed(1)} />
          <Stat label={t.activity.weekend} value={`${activity.weekendPercentage}%`} />
          <Stat label={t.activity.consistency} value={`${activity.consistency}/100`} />
        </dl>

        <div className="mt-12 grid border-t-2 border-black pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Record label={t.activity.bestDay} record={activity.bestDay} locale={data.locale} />
          <Record label={t.activity.bestWeek} record={activity.bestWeek} locale={data.locale} />
          <Record label={t.activity.bestMonth} record={activity.bestMonth} locale={data.locale} />
          <Record label={t.activity.bestYear} record={activity.bestYear} locale={data.locale} />
        </div>
      </div>

      <div className="bg-[#F4F1E8] p-7 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.activity.rhythm}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{t.activity.rhythm}</h2>
        <div className="mt-10 space-y-5">
          {activity.weekdays.map((day) => (
            <div key={day.day} className="grid grid-cols-[48px_1fr_64px] items-center gap-4">
              <span className="text-xs font-black">{day.day}</span>
              <div className="h-7 bg-black/10" role="img" aria-label={`${day.day}: ${day.value}`}>
                <div className="h-full bg-black" style={{ width: `${(day.value / maximumWeekday) * 100}%` }} />
              </div>
              <span className="text-right font-black">{formatNumber(day.value, data.locale)}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t-2 border-black pt-7">
          <div className="flex items-end justify-between gap-4">
            <span className="font-black">{t.activity.burstiness}</span>
            <span className="text-3xl font-black">{activity.burstiness}</span>
          </div>
          <div className="mt-3 h-3 border border-black bg-black/10">
            <div className="h-full bg-[#FF6B8A]" style={{ width: `${activity.burstiness}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function patternLabel(activity: ActivityDNAType, t: Dictionary): string {
  if (activity.pattern === "consistent") return t.activity.patterns.consistent;
  if (activity.pattern === "balanced") return t.activity.patterns.balanced;
  if (activity.pattern === "burst-heavy") return t.activity.patterns.burstHeavy;
  return t.activity.patterns.insufficient;
}

function Record({
  label,
  record,
  locale,
}: {
  label: string;
  record: { label: string; value: number } | null;
  locale: "en" | "es";
}) {
  return (
    <div className="border-black py-3 sm:border-r-2 sm:px-5 sm:first:pl-0 sm:last:border-r-0">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{record ? formatNumber(record.value, locale) : "—"}</p>
      <p className="mt-1 text-xs font-bold text-black/45">{record?.label ?? "—"}</p>
    </div>
  );
}

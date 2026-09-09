import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarRange, GitCompareArrows } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatNumber } from "@/lib/utils/numbers";
import { localizeEvidence } from "@/lib/i18n/evidence";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProfileDashboardData } from "@/types/profile";

export function EvolutionSections({
  data,
  dictionary: t,
}: {
  data: ProfileDashboardData;
  dictionary: Dictionary;
}) {
  const currentYear = data.availableYears[0] ?? new Date().getUTCFullYear();
  const previousYear = data.availableYears.find((year) => year < currentYear) ?? currentYear - 1;
  return (
    <>
      <section id="changes" className="border-x-2 border-b-2 border-black bg-[#FFD84D] p-7 md:p-10">
        <SectionHeading eyebrow={t.changes.eyebrow} title={t.changes.title} />
        {data.previousContributionData ? (
          <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Trend label={t.changes.activity} value={data.trends.activity} suffix="%" />
            <Trend label={t.changes.focus} value={data.trends.focus} />
            <Trend label={t.changes.activeRepos} value={data.trends.activeRepositories} />
            <div>
              <dt className="text-sm font-bold text-black/50">{t.changes.topLanguage}</dt>
              <dd className="mt-2 text-4xl font-black tracking-tight">{data.languages[0]?.name ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-8 border-t-2 border-black pt-7 text-xl font-bold leading-relaxed">
            {data.range === "ALL" ? t.changes.allTime : t.changes.needsDeep}
          </p>
        )}
      </section>

      <section className="grid border-x-2 border-b-2 border-black md:grid-cols-2">
        <Link
          href={`/u/${encodeURIComponent(data.user.login)}/wrapped/${currentYear}?lang=${data.locale}`}
          className="group flex min-h-64 flex-col justify-between border-b-2 border-black bg-[#3567FF] p-7 text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-white md:border-b-0 md:border-r-2 md:p-10"
        >
          <CalendarRange size={28} aria-hidden="true" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">{currentYear}</p>
            <h2 className="mt-2 text-4xl font-black">{t.navigation.wrapped}</h2>
            <ArrowRight className="mt-5 transition-transform group-hover:translate-x-2" aria-hidden="true" />
          </div>
        </Link>
        <Link
          href={`/u/${encodeURIComponent(data.user.login)}/compare?from=${previousYear}&to=${currentYear}&lang=${data.locale}`}
          className="group flex min-h-64 flex-col justify-between bg-[#78E6D0] p-7 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-black md:p-10"
        >
          <GitCompareArrows size={28} aria-hidden="true" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{previousYear} → {currentYear}</p>
            <h2 className="mt-2 text-4xl font-black">{t.navigation.thenVsNow}</h2>
            <ArrowRight className="mt-5 transition-transform group-hover:translate-x-2" aria-hidden="true" />
          </div>
        </Link>
      </section>

      <section id="timeline" className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
        <SectionHeading eyebrow={t.timeline.eyebrow} title={t.timeline.title} description={t.timeline.description} />
        <ol className="mt-10 border-l-2 border-black pl-7">
          {data.timeline.map((event) => (
            <li key={event.id} className="relative pb-10 last:pb-0">
              <span className="absolute -left-[35px] top-1 h-4 w-4 border-2 border-black bg-[#FF5C35]" aria-hidden="true" />
              <time className="text-xs font-black uppercase tracking-wider text-black/40" dateTime={event.date}>
                {event.year}
              </time>
              {event.href ? (
                <a
                  href={event.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex w-fit items-center gap-2 text-xl font-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  {localizeEvidence(event.title, data.locale)}<ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-1 text-xl font-black">{localizeEvidence(event.title, data.locale)}</p>
              )}
              <p className="mt-2 max-w-3xl font-medium text-black/55">{localizeEvidence(event.description, data.locale)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function Trend({ label, value, suffix = "" }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div>
      <dt className="text-sm font-bold text-black/50">{label}</dt>
      <dd className="mt-2 text-4xl font-black tracking-tight">
        {value === null ? "—" : `${value >= 0 ? "+" : ""}${formatNumber(value)}${suffix}`}
      </dd>
    </div>
  );
}

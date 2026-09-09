import Link from "next/link";
import { CalendarRange, Code2, Crosshair } from "lucide-react";
import { Stat } from "@/components/ui/stat";
import { ShareButton } from "@/components/ui/share-button";
import { SubpageHeader } from "@/components/ui/subpage-header";
import { trophyName, trophyTier } from "@/lib/i18n/trophies";
import { formatNumber } from "@/lib/utils/numbers";
import { localizeEvidence } from "@/lib/i18n/evidence";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/types/analytics";
import type { WrappedSummary } from "@/types/profile";

export function WrappedPage({
  data,
  dictionary: t,
  locale,
}: {
  data: WrappedSummary;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const basePath = "/u/" + encodeURIComponent(data.user.login) + "/wrapped/" + data.year;
  const observed = data.contributionData.source === "graphql" || data.contributionData.days.length > 0;
  const activityLabel = data.contributionData.source === "events" ? t.pulse.publicEvents : t.wrapped.contributions;
  return (
    <div className="min-h-screen bg-[#E7E1D4] text-[#111111]">
      <div className="mx-auto max-w-[1500px]">
        <SubpageHeader
          backHref={"/u/" + encodeURIComponent(data.user.login) + "?range=1Y&lang=" + locale}
          backLabel={t.common.backToProfile}
          locale={locale}
          hrefForLanguage={(nextLocale) => basePath + "?lang=" + nextLocale}
          action={<ShareButton label={t.profile.share} copiedLabel={t.profile.copied} title={"DevPulse Wrapped " + data.year + " · @" + data.user.login} />}
        />
        <main>
          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.7fr_0.3fr]">
            <div className="bg-[#FFD84D] p-7 md:p-12 lg:border-r-2 lg:border-black">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-black/45">
                {t.wrapped.eyebrow} · @{data.user.login}
              </p>
              <h1 className="mt-5 text-7xl font-black uppercase leading-[0.82] tracking-[-0.075em] md:text-[132px]">
                Wrapped<br /><span className="text-[#3567FF]">{data.year}</span>
              </h1>
            </div>
            <div className="flex flex-col justify-between bg-[#171717] p-7 text-white md:p-10">
              <CalendarRange size={38} aria-hidden="true" />
              <div>
                <p className="text-[96px] font-black leading-none tracking-[-0.08em]">{observed ? formatNumber(data.contributionData.totalContributions, locale) : "—"}</p>
                <p className="mt-2 font-black text-white/55">{activityLabel}</p>
              </div>
            </div>
          </section>

          {data.contributionData.limited ? (
            <p className="border-x-2 border-b-2 border-black bg-[#FF6B8A] px-6 py-4 font-bold">
              {t.wrapped.limited}
            </p>
          ) : null}

          <nav aria-label={t.wrapped.viewYear} className="flex gap-2 overflow-x-auto border-x-2 border-b-2 border-black bg-[#F4F1E8] p-4">
            {data.availableYears.map((year) => (
              <Link
                key={year}
                href={"/u/" + encodeURIComponent(data.user.login) + "/wrapped/" + year + "?lang=" + locale}
                aria-current={year === data.year ? "page" : undefined}
                className={"shrink-0 border-2 border-black px-4 py-2 text-sm font-black " + (year === data.year ? "bg-[#3567FF] text-white" : "bg-white hover:bg-[#D8FF54]")}
              >
                {year}
              </Link>
            ))}
          </nav>

          <section className="border-x-2 border-b-2 border-black bg-[#3567FF] p-7 text-white md:p-10">
            <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <Stat light label={activityLabel} value={observed ? formatNumber(data.contributionData.totalContributions, locale) : "—"} />
              <Stat light label={t.wrapped.activeDays} value={observed ? formatNumber(data.activity.activeDays, locale) : "—"} />
              <Stat light label={t.wrapped.longestStreak} value={observed ? data.activity.longestStreak + "d" : "—"} />
              <Stat light label={t.focus.title} value={observed ? data.focus.score + "/100" : "—"} />
            </dl>
          </section>

          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-3">
            <article className="min-h-72 border-b-2 border-black bg-[#FF5C35] p-7 lg:border-b-0 lg:border-r-2">
              <Crosshair size={28} aria-hidden="true" />
              <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-black/45">{t.wrapped.topProject}</p>
              <h2 className="mt-2 break-words text-3xl font-black">{data.topProject ? <a href={data.topProject.url} target="_blank" rel="noreferrer" className="underline">{data.topProject.name}</a> : t.common.none}</h2>
              {data.topProject ? <p className="mt-3 text-lg font-black">{data.topProject.percentage}%</p> : null}
            </article>
            <article className="min-h-72 border-b-2 border-black bg-[#D8FF54] p-7 lg:border-b-0 lg:border-r-2">
              <Code2 size={28} aria-hidden="true" />
              <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-black/45">{t.wrapped.topLanguage}</p>
              <h2 className="mt-2 text-3xl font-black">{data.languages[0]?.name ?? t.common.none}</h2>
              {data.languages[0] ? <p className="mt-3 text-lg font-black">{data.languages[0].percentage}%</p> : null}
            </article>
            <article className="min-h-72 bg-[#78E6D0] p-7">
              <CalendarRange size={28} aria-hidden="true" />
              <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-black/45">{t.wrapped.era}</p>
              <h2 className="mt-2 text-3xl font-black">{localizeEvidence(data.era?.title ?? t.common.none, locale)}</h2>
              {data.era ? <p className="mt-3 font-bold text-black/55">{data.era.startYear}–{data.era.endYear}</p> : null}
            </article>
          </section>

          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-2">
            <div className="border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10 lg:border-b-0 lg:border-r-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.wrapped.projectsStarted}</p>
              <p className="mt-3 text-6xl font-black">{data.projectsStarted.length}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {data.projectsStarted.slice(0, 8).map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="border-2 border-black bg-white px-3 py-2 text-sm font-black hover:bg-[#FFD84D]">
                    {repo.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-[#FF6B8A] p-7 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.trophies.title}</p>
              <p className="mt-3 text-6xl font-black">{data.trophies.all.length}</p>
              <p className="mt-3 text-sm font-semibold">{t.detail.periodMilestones}</p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                {data.trophies.highest.slice(0, 6).map((trophy) => (
                  <div key={trophy.family} className="border-2 border-black bg-[#F4F1E8] p-3">
                    <p className="font-black">{trophyName(trophy.family, locale)}</p>
                    <p className="text-xs font-bold text-black/45">{trophyTier(trophy.tier.name, locale)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

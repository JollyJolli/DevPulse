import { GitCompareArrows } from "lucide-react";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale, PeriodSnapshot } from "@/types/analytics";

export function ComparisonBoard({
  left,
  right,
  observations,
  dictionary: t,
  locale,
}: {
  left: PeriodSnapshot;
  right: PeriodSnapshot;
  observations: string[];
  dictionary: Dictionary;
  locale: Locale;
}) {
  const metrics = [
    [left.source === "events" && right.source === "events" ? t.pulse.publicEvents : t.pulse.contributions, left.contributions, right.contributions],
    [left.source === "events" && right.source === "events" ? t.pulse.pushEvents : t.pulse.commits, left.commits, right.commits],
    [t.pulse.pullRequests, left.pullRequests, right.pullRequests],
    [t.pulse.reviews, left.reviews, right.reviews],
    [t.pulse.issues, left.issues, right.issues],
    [t.pulse.activeDays, left.activeDays, right.activeDays],
    [t.pulse.longestStreak, left.longestStreak, right.longestStreak],
    [t.focus.title, left.focus, right.focus],
    [t.focus.activeRepos, left.activeRepositories, right.activeRepositories],
  ] as const;

  return (
    <>
      <section className="grid border-x-2 border-b-2 border-black md:grid-cols-[1fr_auto_1fr]">
        <SnapshotHero snapshot={left} color="bg-[#3567FF] text-white" locale={locale} />
        <div className="flex items-center justify-center border-y-2 border-black bg-[#F4F1E8] px-6 py-5 md:border-x-2 md:border-y-0">
          <div className="text-center">
            <GitCompareArrows className="mx-auto" size={28} aria-hidden="true" />
            <p className="mt-2 text-xs font-black">{t.compare.versus}</p>
          </div>
        </div>
        <SnapshotHero snapshot={right} color="bg-[#FF5C35]" locale={locale} />
      </section>

      <section className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-6 md:p-10">
        <div className="border-t-2 border-black">
          {metrics.map(([label, leftValue, rightValue]) => (
            <MetricRow
              key={label}
              label={label}
              left={leftValue}
              right={rightValue}
              locale={locale}
            />
          ))}
          <TextRow label={t.languages.dominant} left={left.dominantLanguage} right={right.dominantLanguage} />
          <TextRow label={t.languages.diversity} left={String(left.languageDiversity)} right={String(right.languageDiversity)} />
        </div>
      </section>

      <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.65fr_0.35fr]">
        <div className="border-b-2 border-black bg-[#FFD84D] p-7 md:p-10 lg:border-b-0 lg:border-r-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.compare.observations}</p>
          {observations.length ? (
            <ul className="mt-7 space-y-4">
              {observations.map((observation) => (
                <li key={observation} className="border-l-4 border-black pl-5 text-lg font-bold leading-relaxed">
                  {observation}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-7 text-lg font-bold text-black/55">{t.common.dataUnavailable}</p>
          )}
        </div>
        <div className="bg-[#78E6D0] p-7 md:p-10">
          <p className="text-2xl font-black leading-tight">{t.compare.noWinner}</p>
          {(left.limited || right.limited) ? (
            <p className="mt-6 border-t-2 border-black pt-5 text-sm font-bold text-black/55">{t.data.limited}</p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function SnapshotHero({ snapshot, color, locale }: { snapshot: PeriodSnapshot; color: string; locale: Locale }) {
  return (
    <article className={"min-h-64 p-7 md:p-10 " + color}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-55">{snapshot.label}</p>
      <p className="mt-10 text-7xl font-black tracking-[-0.065em]">{formatNumber(snapshot.contributions, locale)}</p>
      <p className="mt-2 font-black opacity-60">{snapshot.source === "events" ? (locale === "es" ? "eventos públicos" : "public events") : (locale === "es" ? "contribuciones públicas" : "public contributions")}</p>
    </article>
  );
}

function MetricRow({ label, left, right, locale }: { label: string; left: number; right: number; locale: Locale }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(110px,1.2fr)_1fr] items-center gap-4 border-b border-black/25 py-5">
      <p className="text-2xl font-black">{formatNumber(left, locale)}</p>
      <p className="text-center text-xs font-black uppercase tracking-wide text-black/45">{label}</p>
      <p className="text-right text-2xl font-black">{formatNumber(right, locale)}</p>
    </div>
  );
}

function TextRow({ label, left, right }: { label: string; left: string | null; right: string | null }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(110px,1.2fr)_1fr] items-center gap-4 border-b border-black/25 py-5 last:border-b-0">
      <p className="font-black">{left ?? "—"}</p>
      <p className="text-center text-xs font-black uppercase tracking-wide text-black/45">{label}</p>
      <p className="text-right font-black">{right ?? "—"}</p>
    </div>
  );
}

import { GitCompareArrows } from "lucide-react";
import { ComparisonBoard } from "@/components/compare/comparison-board";
import { SubpageHeader } from "@/components/ui/subpage-header";
import { RANGES } from "@/constants/analytics";
import { buildPeriodSnapshot } from "@/lib/analytics/comparisons";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale, RangeKey } from "@/types/analytics";
import type { ProfileComparison } from "@/types/profile";

export function DeveloperComparePage({
  comparison, leftUsername, rightUsername, range, dictionary: t, locale,
}: {
  comparison: ProfileComparison | null;
  leftUsername: string;
  rightUsername: string;
  range: RangeKey;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const attempted = Boolean(leftUsername && rightUsername);
  const left = comparison ? buildPeriodSnapshot("@" + comparison.left.user.login, comparison.left.contributionData, comparison.left.languages) : null;
  const right = comparison ? buildPeriodSnapshot("@" + comparison.right.user.login, comparison.right.contributionData, comparison.right.languages) : null;
  return (
    <div className="min-h-screen bg-[#E7E1D4] text-[#111111]">
      <div className="mx-auto max-w-[1500px]">
        <SubpageHeader
          backHref={"/?lang=" + locale}
          backLabel={t.navigation.home}
          locale={locale}
          hrefForLanguage={(nextLocale) => "/compare?user1=" + encodeURIComponent(leftUsername) + "&user2=" + encodeURIComponent(rightUsername) + "&range=" + range + "&lang=" + nextLocale}
        />
        <main>
          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.6fr_0.4fr]">
            <div className="bg-[#FFD84D] p-7 md:p-12 lg:border-r-2 lg:border-black">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.compare.eyebrow}</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.05em] md:text-7xl">{t.compare.title}</h1>
            </div>
            <div className="flex items-center justify-center bg-[#FF6B8A] p-10"><GitCompareArrows size={88} strokeWidth={1.5} aria-hidden="true" /></div>
          </section>
          <form className="grid border-x-2 border-b-2 border-black bg-[#F4F1E8] md:grid-cols-[1fr_1fr_150px_auto]" method="get">
            <Field label={t.compare.userOne} name="user1" defaultValue={leftUsername} />
            <Field label={t.compare.userTwo} name="user2" defaultValue={rightUsername} />
            <label className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
              <span className="block text-xs font-black uppercase text-black/45">{t.detail.range}</span>
              <select name="range" defaultValue={range} className="mt-2 h-10 w-full bg-transparent font-black outline-none">
                {RANGES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <input type="hidden" name="lang" value={locale} />
            <button type="submit" className="min-h-16 bg-[#D8FF54] px-7 font-black hover:bg-[#FF5C35] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-black">{t.compare.compare}</button>
          </form>
          {comparison && left && right ? (
            <ComparisonBoard left={left} right={right} observations={comparison.observations} dictionary={t} locale={locale} />
          ) : (
            <section className="border-x-2 border-b-2 border-black bg-[#78E6D0] p-8 md:p-12">
              <p className="max-w-2xl text-2xl font-black">{attempted ? t.compare.enterTwo : t.compare.noWinner}</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
      <span className="block text-xs font-black uppercase text-black/45">{label}</span>
      <input name={name} defaultValue={defaultValue} autoComplete="off" className="mt-2 h-10 w-full bg-transparent font-black outline-none placeholder:text-black/25" placeholder="github-username" />
    </label>
  );
}

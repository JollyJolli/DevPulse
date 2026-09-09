import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonBoard } from "@/components/compare/comparison-board";
import { getYearComparison } from "@/lib/data/comparison-service";
import { getDictionary } from "@/lib/i18n";
import { firstQueryValue, parseLocale } from "@/lib/utils/strings";

export const metadata: Metadata = { title: "Then vs now" };

export default async function YearComparisonPage({ params, searchParams }: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ from?: string | string[]; to?: string | string[]; lang?: string | string[] }>;
}) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const locale = parseLocale(query.lang);
  const currentYear = new Date().getUTCFullYear();
  const fromYear = Number(firstQueryValue(query.from) ?? currentYear - 1);
  const toYear = Number(firstQueryValue(query.to) ?? currentYear);
  const comparison = await getYearComparison(username, fromYear, toYear, locale);
  const t = getDictionary(locale);
  return (
    <main className="min-h-screen bg-[#E7E1D4] p-4 text-[#111111] md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-black bg-[#F4F1E8] px-5 py-4">
          <Link href={"/u/" + encodeURIComponent(username) + "?range=ALL&lang=" + locale} className="font-black underline">
            ← {t.common.backToProfile}
          </Link>
          <Link href={"/u/" + encodeURIComponent(username) + "/compare?from=" + fromYear + "&to=" + toYear + "&lang=" + (locale === "es" ? "en" : "es")} className="font-black underline">
            {locale === "es" ? "English" : "Español"}
          </Link>
        </div>
        <section className="border-x-2 border-b-2 border-black bg-[#78E6D0] p-7 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.compare.thenEyebrow} · @{username}</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] md:text-7xl">{t.compare.thenTitle}</h1>
        </section>
        <form method="get" className="grid border-x-2 border-b-2 border-black bg-[#F4F1E8] sm:grid-cols-[1fr_1fr_auto]">
          <YearField label={t.compare.earlierYear} name="from" value={fromYear} />
          <YearField label={t.compare.laterYear} name="to" value={toYear} />
          <input type="hidden" name="lang" value={locale} />
          <button type="submit" className="min-h-16 bg-[#FFD84D] px-7 font-black hover:bg-[#FF5C35]">{t.compare.compare}</button>
        </form>
        {comparison ? (
          <>
          <Link className="block border-x-2 border-black bg-[#FFD84D] p-4 font-black underline" href={"/u/" + encodeURIComponent(username) + "/share?" + new URLSearchParams({kind: "comparison", id: fromYear + "-" + toYear, lang: locale})}>{t.profile.share}</Link>
          <ComparisonBoard left={comparison.from} right={comparison.to} observations={comparison.observations} dictionary={t} locale={locale} />
          </>
        ) : (
          <p className="border-x-2 border-b-2 border-black bg-[#FF6B8A] p-8 text-xl font-black">{t.compare.unavailable}</p>
        )}
      </div>
    </main>
  );
}

function YearField({ label, name, value }: { label: string; name: string; value: number }) {
  return (
    <label className="border-b-2 border-black p-4 sm:border-b-0 sm:border-r-2">
      <span className="block text-xs font-black uppercase text-black/45">{label}</span>
      <input type="number" min={2008} max={new Date().getUTCFullYear()} name={name} defaultValue={value} className="mt-2 h-10 w-full bg-transparent text-2xl font-black outline-none" />
    </label>
  );
}

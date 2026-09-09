import type { Metadata } from "next";
import { HomeExplorer } from "@/components/home/home-explorer";
import { getDictionary, parseLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Public GitHub analytics",
  description:
    "Explore public GitHub activity, project focus, languages, developer eras, trophies, and year-by-year change.",
  alternates: { canonical: "/" },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const query = await searchParams;
  const locale = parseLocale(Array.isArray(query.lang) ? query.lang[0] : query.lang);
  return <HomeExplorer dictionary={getDictionary(locale)} locale={locale} />;
}

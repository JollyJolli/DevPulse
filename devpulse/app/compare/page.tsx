import type { Metadata } from "next";
import { DeveloperComparePage } from "@/components/compare/developer-compare-page";
import { RANGES } from "@/constants/analytics";
import { getProfileComparison } from "@/lib/data/comparison-service";
import { getDictionary } from "@/lib/i18n";
import { firstQueryValue, parseLocale, parseRange } from "@/lib/utils/strings";

export const metadata: Metadata = {
  title: "Compare public GitHub profiles",
  description: "Compare two public GitHub profiles through factual activity and project patterns.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const locale = parseLocale(query.lang);
  const range = parseRange(query.range, RANGES);
  const leftUsername = firstQueryValue(query.user1)?.trim() ?? "";
  const rightUsername = firstQueryValue(query.user2)?.trim() ?? "";
  const comparison = leftUsername && rightUsername
    ? await getProfileComparison(leftUsername, rightUsername, range, locale)
    : null;
  return <DeveloperComparePage
    comparison={comparison}
    leftUsername={leftUsername}
    rightUsername={rightUsername}
    range={range}
    dictionary={getDictionary(locale)}
    locale={locale}
  />;
}

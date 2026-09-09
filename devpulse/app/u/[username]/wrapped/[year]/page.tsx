import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WrappedPage } from "@/components/wrapped/wrapped-page";
import { getWrappedSummary } from "@/lib/data/wrapped-service";
import { getGitHubUser } from "@/lib/github/users";
import { getDictionary } from "@/lib/i18n";
import { parseLocale } from "@/lib/utils/strings";
import { normalizeUsername } from "@/lib/utils/username";

type WrappedPageProps = {
  params: Promise<{ username: string; year: string }>;
  searchParams: Promise<{ lang?: string | string[]; refresh?: string | string[] }>;
};

export async function generateMetadata({ params }: WrappedPageProps): Promise<Metadata> {
  const { username: rawUsername, year: rawYear } = await params;
  const username = normalizeUsername(rawUsername);
  const year = Number(rawYear);
  if (!username || !Number.isInteger(year)) return { title: "Wrapped not found" };
  const user = await getGitHubUser(username).catch(() => null);
  if (!user) return { title: "Wrapped not found" };
  const title = "GitHub Wrapped " + year + " · @" + user.login;
  const description = "A transparent year-in-review of @" + user.login + "'s public GitHub activity.";
  const image = "/u/" + encodeURIComponent(user.login) + "/wrapped/" + year + "/opengraph-image";
  return {
    title,
    description,
    alternates: { canonical: "/u/" + encodeURIComponent(user.login) + "/wrapped/" + year },
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function WrappedRoute({ params, searchParams }: WrappedPageProps) {
  const [{ username, year: rawYear }, query] = await Promise.all([params, searchParams]);
  const year = Number(rawYear);
  const locale = parseLocale(query.lang);
  const refreshValue = Array.isArray(query.refresh) ? query.refresh[0] : query.refresh;
  const data = await getWrappedSummary(username, year, refreshValue === "1");
  if (!data) notFound();
  return <WrappedPage data={data} dictionary={getDictionary(locale)} locale={locale} />;
}

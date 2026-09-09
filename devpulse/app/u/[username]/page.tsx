import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { persistProfileSnapshot } from "@/lib/db/snapshots";
import { ProfileDashboard } from "@/components/profile/profile-dashboard";
import { RANGES } from "@/constants/analytics";
import { getProfileDashboardData } from "@/lib/data/profile-service";
import { getDictionary } from "@/lib/i18n";
import { getGitHubUser } from "@/lib/github/users";
import { parseLocale, parseRange } from "@/lib/utils/strings";
import { normalizeUsername } from "@/lib/utils/username";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    range?: string | string[];
    lang?: string | string[];
    refresh?: string | string[];
  }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  if (!username) return { title: "Profile not found" };

  const user = await getGitHubUser(username).catch(() => null);
  if (!user) return { title: "Profile not found" };
  const displayName = user.name || user.login;
  const title = `${displayName} (@${user.login}) · GitHub analytics`;
  const description = `Explore @${user.login}'s public GitHub activity, projects, focus, languages, trophies, and developer history on DevPulse.`;

  return {
    title,
    description,
    alternates: { canonical: `/u/${encodeURIComponent(user.login)}` },
    openGraph: {
      title,
      description,
      type: "profile",
      images: [`/u/${encodeURIComponent(user.login)}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/u/${encodeURIComponent(user.login)}/opengraph-image`],
    },
  };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const locale = parseLocale(query.lang);
  const range = parseRange(query.range, RANGES);
  const refresh = (Array.isArray(query.refresh) ? query.refresh[0] : query.refresh) === "1";
  const data = await getProfileDashboardData(username, range, locale, refresh);

  if (!data) notFound();
  after(async () => {
    try { await persistProfileSnapshot(data); }
    catch { console.error("DevPulse: snapshot persistence unavailable."); }
  });
  return <ProfileDashboard data={data} dictionary={getDictionary(locale)} />;
}

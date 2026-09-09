import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GitCompareArrows } from "lucide-react";
import { RANGES } from "@/constants/analytics";
import { ProfileActions } from "@/components/profile/profile-actions";
import { BrandMark } from "@/components/ui/brand-mark";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/types/analytics";
import type { ProfileDashboardData } from "@/types/profile";

function profileHref(username: string, range: string, locale: Locale, section?: string) {
  const query = new URLSearchParams({ range, lang: locale });
  if (section) query.set("section", section);
  return `/u/${encodeURIComponent(username)}?${query}${section ? `#${section}` : ""}`;
}

export function ProfileHeader({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const { user, range, locale } = data;
  const wrappedYear = data.availableYears[0] ?? new Date().getUTCFullYear();

  return (
    <>
      <a
        href="#profile-content"
        className="sr-only z-50 bg-white p-3 font-bold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {t.navigation.skipToContent}
      </a>
      <nav className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b-2 border-black px-5 py-3 md:px-10">
        <Link href={`/?lang=${locale}`} aria-label={t.navigation.home}>
          <BrandMark compact />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-black">
          <Link
            href={`/compare?user1=${encodeURIComponent(user.login)}&lang=${locale}`}
            className="inline-flex items-center gap-2 underline decoration-transparent underline-offset-4 hover:decoration-black"
          >
            <GitCompareArrows size={16} aria-hidden="true" />
            {t.navigation.compare}
          </Link>
          <Link
            href={`/u/${encodeURIComponent(user.login)}/wrapped/${wrappedYear}?lang=${locale}`}
            className="underline decoration-transparent underline-offset-4 hover:decoration-black"
          >
            {t.navigation.wrapped}
          </Link>
          <LanguageSwitcher
            locale={locale}
            hrefFor={(next) => profileHref(user.login, range, next)}
          />
        </div>
      </nav>

      <section id="overview" className="relative min-h-[390px] overflow-hidden border-x-2 border-b-2 border-black">
        <div
          className="absolute inset-[-140px] scale-125 bg-cover bg-center opacity-80 blur-[90px]"
          style={{ backgroundImage: `url("${user.avatar_url}")` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" aria-hidden="true" />

        <div className="relative flex min-h-[390px] flex-col justify-between p-6 text-white md:p-10">
          <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <Image
                src={user.avatar_url}
                alt={`${user.login} avatar`}
                width={128}
                height={128}
                priority
                unoptimized
                className="h-28 w-28 shrink-0 border-2 border-white/80 object-cover md:h-32 md:w-32"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                  {t.profile.githubProfile}
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-[-0.045em] md:text-6xl">
                  {user.name || user.login}
                </h1>
                <p className="mt-1 text-xl font-bold text-white/65">@{user.login}</p>
                {user.bio ? (
                  <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/80">
                    {user.bio}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/65">
                  {user.location ? <span>{user.location}</span> : null}
                  {user.company ? <span>{user.company}</span> : null}
                  <span>{formatNumber(user.followers, locale)} {t.profile.followers}</span>
                  <span>{formatNumber(user.following, locale)} {t.profile.following}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-white/75 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t.profile.github}<ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                  {data.website ? (
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-white/75 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {t.profile.website}<ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
            <ProfileActions
              username={user.login}
              refreshLabel={t.profile.refresh}
              favoriteLabel={t.profile.favorite}
              favoritedLabel={t.profile.favorited}
              shareLabel={t.profile.share}
              copiedLabel={t.profile.copied}
            />
          </div>

          <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <dl className="flex flex-wrap gap-x-9 gap-y-3">
              <HeaderMetric label={t.profile.publicRepos} value={formatNumber(user.public_repos, locale)} />
              <HeaderMetric label={t.profile.starsReceived} value={formatNumber(data.totalStars, locale)} />
              <HeaderMetric label={t.profile.since} value={String(new Date(user.created_at).getUTCFullYear())} />
            </dl>
            <div className="flex max-w-full overflow-x-auto border border-white/35 bg-black/25 backdrop-blur-md" aria-label="Analytics range">
              {RANGES.map((item) => (
                <Link
                  key={item}
                  href={profileHref(user.login, item, locale)}
                  aria-current={range === item ? "page" : undefined}
                  className={`shrink-0 px-4 py-2 text-xs font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white ${
                    range === item ? "bg-[#FFD84D] text-black" : "text-white hover:bg-white/10"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-white/50">{label}</dt>
      <dd className="mt-1 text-xl font-black">{value}</dd>
    </div>
  );
}

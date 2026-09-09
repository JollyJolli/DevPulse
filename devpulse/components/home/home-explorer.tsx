"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowRight, BarChart3, Clock3, Code2, GitCompareArrows } from "lucide-react";
import { normalizeUsername } from "@/lib/utils/username";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/types/analytics";
import { BrandMark } from "@/components/ui/brand-mark";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const RECENT_KEY = "devpulse:recent-profiles";
const FAVORITES_KEY = "devpulse:favorite-profiles";

function readProfiles(key: string): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function HomeExplorer({ dictionary: t, locale }: { dictionary: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecent(readProfiles(RECENT_KEY));
      setFavorites(readProfiles(FAVORITES_KEY));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = normalizeUsername(input);
    if (!username) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/u/${encodeURIComponent(username)}?range=30D&lang=${locale}`);
  }

  const profileHref = (username: string) =>
    `/u/${encodeURIComponent(username)}?range=30D&lang=${locale}`;

  return (
    <main id="main-content" className="min-h-screen bg-[#F4F1E8] text-[#111111]">
      <nav className="flex items-center justify-between border-b-2 border-black px-5 py-4 md:px-10">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link
            href={`/compare?lang=${locale}`}
            className="hidden items-center gap-2 text-sm font-black underline decoration-transparent underline-offset-4 hover:decoration-black sm:flex"
          >
            <GitCompareArrows size={17} aria-hidden="true" />
            {t.navigation.compare}
          </Link>
          <LanguageSwitcher locale={locale} hrefFor={(next) => `/?lang=${next}`} />
        </div>
      </nav>

      <section className="grid min-h-[660px] border-b-2 border-black lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-between border-black p-6 md:p-10 lg:border-r-2 lg:p-14">
          <div>
            <div className="mb-9 inline-flex items-center gap-2 border-2 border-black bg-[#D8FF54] px-3 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <Activity size={14} aria-hidden="true" />
              {t.home.badge}
            </div>
            <h1 className="max-w-4xl text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] sm:text-7xl md:text-8xl xl:text-[104px]">
              {t.home.titleBefore}
              <br />
              <span className="text-[#3567FF]">{t.home.titleAccent}</span>
              <br />
              {t.home.titleAfter}
            </h1>
          </div>

          <div className="mt-14 max-w-2xl">
            <p className="mb-6 text-lg font-medium leading-relaxed text-black/65 md:text-xl">
              {t.home.description}
            </p>
            <form onSubmit={handleSubmit} noValidate className="border-2 border-black bg-white">
              <div className="flex flex-col sm:flex-row">
                <label className="flex flex-1 items-center gap-3 px-4" htmlFor="github-username">
                  <Code2 className="shrink-0" size={20} aria-hidden="true" />
                  <span className="sr-only">{t.home.inputLabel}</span>
                  <input
                    id="github-username"
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                      if (error) setError(false);
                    }}
                    placeholder={t.home.inputPlaceholder}
                    aria-invalid={error}
                    aria-describedby={error ? "username-error" : undefined}
                    autoComplete="off"
                    spellCheck="false"
                    className="h-16 w-full bg-transparent text-base font-semibold outline-none placeholder:text-black/30"
                  />
                </label>
                <button
                  type="submit"
                  className="flex h-16 items-center justify-center gap-2 border-t-2 border-black bg-[#FF5C35] px-7 font-black transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-black sm:border-l-2 sm:border-t-0"
                >
                  {t.home.analyze}
                  <ArrowRight size={19} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
              {error ? (
                <p id="username-error" role="alert" className="border-t-2 border-black bg-[#FFD84D] px-4 py-2 text-sm font-bold">
                  {t.home.invalid}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        <div className="grid min-h-[520px] grid-cols-2 grid-rows-3 lg:min-h-0">
          <ConceptBlock color="bg-[#FFD84D]" icon={<BarChart3 />} title={t.home.overview} text={t.home.overviewText} />
          <ConceptBlock color="bg-[#FF6B8A]" icon={<Code2 />} title={t.home.deepDive} text={t.home.deepDiveText} />
          <div className="col-span-2 border-y-2 border-black bg-[#3567FF] p-7 text-white md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">{t.detail.model}</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <FlowStep number="01" label={t.detail.githubData} />
              <ArrowRight className="hidden sm:block" aria-hidden="true" />
              <FlowStep number="02" label={t.detail.analytics} />
              <ArrowRight className="hidden sm:block" aria-hidden="true" />
              <FlowStep number="03" label={t.detail.history} />
            </div>
          </div>
          <ConceptBlock color="bg-[#78E6D0]" icon={<Clock3 />} title={t.home.honest} text={t.home.honestText} />
          <div className="flex flex-col justify-between bg-[#D8FF54] p-6">
            <GitCompareArrows size={25} aria-hidden="true" />
            <Link href={`/compare?lang=${locale}`} className="group text-xl font-black leading-tight">
              {t.navigation.compare}
              <ArrowRight className="mt-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid border-b-2 border-black lg:grid-cols-2">
        <SavedProfiles
          title={t.home.recent}
          profiles={recent}
          empty={t.home.noRecent}
          profileHref={profileHref}
          className="border-b-2 border-black bg-[#FFD84D] lg:border-b-0 lg:border-r-2"
        />
        <SavedProfiles
          title={t.home.favorites}
          profiles={favorites}
          empty={t.home.noRecent}
          profileHref={profileHref}
          className="bg-[#F4F1E8]"
        />
      </section>

      <footer className="flex flex-col justify-between gap-3 px-6 py-8 text-sm font-semibold md:flex-row md:px-10">
        <span>DevPulse © 2026</span>
        <span className="text-black/50">{t.home.footer} · devpulse.formen.cc</span>
      </footer>
    </main>
  );
}

function ConceptBlock({ color, icon, title, text }: { color: string; icon: ReactNode; title: string; text: string }) {
  return (
    <div className={`flex flex-col justify-between border-black p-6 first:border-r-2 ${color}`}>
      <span aria-hidden="true">{icon}</span>
      <div className="mt-10">
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-black/60">{text}</p>
      </div>
    </div>
  );
}

function FlowStep({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <span className="text-xs font-black text-white/45">{number}</span>
      <p className="mt-1 text-lg font-black">{label}</p>
    </div>
  );
}

function SavedProfiles({
  title,
  profiles,
  empty,
  profileHref,
  className,
}: {
  title: string;
  profiles: string[];
  empty: string;
  profileHref: (username: string) => string;
  className: string;
}) {
  return (
    <div className={`min-h-44 p-6 md:p-10 ${className}`}>
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{title}</h2>
      {profiles.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {profiles.map((username) => (
            <Link
              key={username}
              href={profileHref(username)}
              className="border-2 border-black bg-white px-4 py-2 font-black hover:bg-[#D8FF54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              @{username}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 max-w-lg font-semibold text-black/50">{empty}</p>
      )}
    </div>
  );
}

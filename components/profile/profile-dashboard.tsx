import Link from "next/link";
import { ActivityDNA } from "@/components/profile/activity-dna";
import { CurrentFocus, DataNotice } from "@/components/profile/current-focus";
import { EvolutionSections } from "@/components/profile/evolution-sections";
import { FocusProjects } from "@/components/profile/focus-projects";
import { LanguageHistory } from "@/components/profile/language-history";
import { PortfolioSections } from "@/components/profile/portfolio-sections";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PulseSection } from "@/components/profile/pulse-section";
import { TrophyCabinet } from "@/components/profile/trophy-cabinet";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProfileDashboardData } from "@/types/profile";

export function ProfileDashboard({
  data,
  dictionary,
}: {
  data: ProfileDashboardData;
  dictionary: Dictionary;
}) {
  const t = dictionary;
  const sections = [
    ["current-focus", t.currentFocus.eyebrow],
    ["pulse", t.pulse.eyebrow],
    ["activity", t.activity.eyebrow],
    ["projects", t.projects.eyebrow],
    ["trophies", t.trophies.eyebrow],
    ["languages", t.languages.eyebrow],
    ["portfolio", t.portfolio.eyebrow],
    ["eras", t.eras.eyebrow],
    ["timeline", t.timeline.eyebrow],
  ] as const;

  return (
    <div className="min-h-screen bg-[#E7E1D4] text-[#111111]">
      <div className="mx-auto max-w-[1600px]">
        <ProfileHeader data={data} dictionary={dictionary} />
        <main id="profile-content">
          <DataNotice data={data} dictionary={dictionary} />
          <nav
            aria-label={data.locale === "es" ? "Secciones del panel" : "Dashboard sections"}
            className="sticky top-0 z-30 flex max-w-full gap-1 overflow-x-auto border-x-2 border-b-2 border-black bg-[#F4F1E8]/95 px-3 py-3 backdrop-blur md:px-6"
          >
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="shrink-0 border border-black/30 px-3 py-2 text-xs font-black uppercase tracking-wide hover:border-black hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {label}
              </a>
            ))}
          </nav>
          <CurrentFocus data={data} dictionary={dictionary} />
          <PulseSection data={data} dictionary={dictionary} />
          <ActivityDNA data={data} dictionary={dictionary} />
          <FocusProjects data={data} dictionary={dictionary} />
          <TrophyCabinet data={data} dictionary={dictionary} />
          <LanguageHistory data={data} dictionary={dictionary} />
          <PortfolioSections data={data} dictionary={dictionary} />
          <EvolutionSections data={data} dictionary={dictionary} />
        </main>
        <footer className="flex flex-col justify-between gap-3 border-x-2 border-b-2 border-black bg-[#F4F1E8] px-6 py-8 text-sm font-semiboldHamilton md:flex-row md:px-10">
          <Link href={`/?lang=${data.locale}`} className="font-black hover:underline">
            DevPulse
          </Link>
          <a href={data.user.html_url} target="_blank" rel="noreferrer" className="text-black/50 hover:text-black">
            GitHub · @{data.user.login}
          </a>
        </footer>
      </div>
    </div>
  );
}

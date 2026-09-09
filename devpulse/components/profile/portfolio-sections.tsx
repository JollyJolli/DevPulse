import { ArrowUpRight, Archive } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";
import { relativeAge } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { GitHubRepository } from "@/types/github";
import type { ProfileDashboardData } from "@/types/profile";

export function PortfolioSections({
  data,
  dictionary: t,
}: {
  data: ProfileDashboardData;
  dictionary: Dictionary;
}) {
  return (
    <>
      <section id="portfolio" className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
        <SectionHeading eyebrow={t.portfolio.eyebrow} title={t.portfolio.title} />
        <dl className="mt-10 grid grid-cols-2 gap-y-9 md:grid-cols-4">
          <Stat label={t.portfolio.original} value={formatNumber(data.originalRepositories.length, data.locale)} />
          <Stat label={t.portfolio.forked} value={formatNumber(data.forkedRepositories.length, data.locale)} />
          <Stat label={t.portfolio.stars} value={formatNumber(data.totalStars, data.locale)} />
          <Stat label={t.portfolio.forks} value={formatNumber(data.totalForks, data.locale)} />
        </dl>
        <div className="mt-12 grid border-t-2 border-black pt-8 md:grid-cols-4">
          <Coverage label={t.portfolio.descriptions} value={data.coverage.descriptions} />
          <Coverage label={t.portfolio.licenses} value={data.coverage.licenses} />
          <Coverage label={t.portfolio.topics} value={data.coverage.topics} />
          <Coverage label={t.portfolio.websites} value={data.coverage.websites} />
        </div>
      </section>

      <section className="grid border-x-2 border-b-2 border-black sm:grid-cols-2 xl:grid-cols-4">
        <RepositoryRecord
          label={t.portfolio.mostStarred}
          repository={data.mostStarredRepository}
          value={data.mostStarredRepository ? `★ ${formatNumber(data.mostStarredRepository.stargazers_count, data.locale)}` : "—"}
          color="bg-[#3567FF] text-white"
          light
        />
        <RepositoryRecord
          label={t.portfolio.mostForked}
          repository={data.mostForkedRepository}
          value={data.mostForkedRepository ? `${formatNumber(data.mostForkedRepository.forks_count, data.locale)} forks` : "—"}
          color="bg-[#FF6B8A]"
        />
        <RepositoryRecord
          label={t.portfolio.newest}
          repository={data.newestRepository}
          value={
            data.newestRepository
              ? new Date(data.newestRepository.created_at).toLocaleDateString(data.locale === "es" ? "es-ES" : "en-US", {
                  year: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })
              : "—"
          }
          color="bg-[#FFD84D]"
        />
        <RepositoryRecord
          label={t.portfolio.lastTouched}
          repository={data.latestRepository}
          value={data.latestRepository ? relativeAge(data.latestRepository.pushed_at, new Date(), data.locale) : "—"}
          color="bg-[#78E6D0]"
        />
      </section>

      <section id="graveyard" className="border-x-2 border-b-2 border-black bg-[#171717] p-7 text-white md:p-10">
        <SectionHeading
          eyebrow={t.graveyard.eyebrow}
          title={t.graveyard.title}
          description={t.graveyard.description}
          action={<div className="flex items-end gap-3"><Archive size={28} aria-hidden="true" /><span className="text-5xl font-black text-white/30">{String(data.graveyard.length).padStart(2, "0")}</span></div>}
          light
        />
        {data.graveyard.length > 0 ? (
          <div className="mt-10">
            {data.graveyard.map((entry) => (
              <article
                key={entry.repo.id}
                className="grid gap-5 border-t border-white/20 py-6 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,1fr)_150px_150px_1fr]"
              >
                <div>
                  <a
                    href={entry.repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xl font-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {entry.repo.name}<ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/45">
                    {entry.repo.description || t.projects.noDescription}
                  </p>
                </div>
                <GraveyardMeta label={t.projects.lifecycle} value={lifecycleLabel(entry.classification, t)} />
                <GraveyardMeta label={t.graveyard.inactive} value={`${entry.inactiveDays} ${t.common.days}`} />
                <div>
                  <p className="text-xs font-bold uppercase text-white/35">{t.graveyard.evidence}</p>
                  <ul className="mt-2 space-y-1 text-sm font-semibold text-white/55">
                    {entry.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 border-t border-white/20 pt-8 text-lg font-bold text-white/50">{t.graveyard.empty}</p>
        )}
      </section>
    </>
  );
}

function Coverage({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-black py-3 md:border-r-2 md:px-5 md:first:pl-0 md:last:border-r-0">
      <p className="text-sm font-bold text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}%</p>
      <div className="mt-3 h-2 bg-black/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-black" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RepositoryRecord({
  label,
  repository,
  value,
  color,
  light = false,
}: {
  label: string;
  repository?: GitHubRepository;
  value: string;
  color: string;
  light?: boolean;
}) {
  return (
    <article className={`min-h-64 border-b-2 border-black p-7 last:border-b-0 sm:border-r-2 sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r-2 xl:last:border-r-0 ${color}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${light ? "text-white/55" : "text-black/45"}`}>{label}</p>
      <div className="mt-16">
        {repository ? (
          <a href={repository.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xl font-black hover:underline">
            {repository.name}<ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ) : null}
        <p className="mt-3 text-4xl font-black">{value}</p>
      </div>
    </article>
  );
}

function GraveyardMeta({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase text-white/35">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function lifecycleLabel(value: "dormant" | "abandoned" | "archived", t: Dictionary) {
  return t.lifecycle[value];
}

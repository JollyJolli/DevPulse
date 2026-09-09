import { ArrowUpRight, Check, GitCommit, GitPullRequest, Radar, X } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShareButton } from "@/components/ui/share-button";
import { Stat } from "@/components/ui/stat";
import { RepositoryEvidence } from "@/components/repository/repository-evidence";
import { SubpageHeader } from "@/components/ui/subpage-header";
import { formatNumber } from "@/lib/utils/numbers";
import { localizeEvidence } from "@/lib/i18n/evidence";
import { relativeAge } from "@/lib/utils/dates";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/types/analytics";
import type { RepositoryInsight } from "@/types/repository";

export function RepositoryRadar({
  data,
  dictionary: t,
  locale,
}: {
  data: RepositoryInsight;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const repo = data.repository;
  const owner = repo.owner?.login ?? repo.full_name.split("/")[0] ?? "";
  const profileHref = `/u/${encodeURIComponent(owner)}?lang=${locale}`;
  const pageHref = (nextLocale: Locale) =>
    `/u/${encodeURIComponent(owner)}/r/${encodeURIComponent(repo.name)}?lang=${nextLocale}`;

  return (
    <div className="min-h-screen bg-[#E7E1D4] text-[#111111]">
      <div className="mx-auto max-w-[1500px]">
        <SubpageHeader
          backHref={profileHref}
          backLabel={t.common.backToProfile}
          locale={locale}
          hrefForLanguage={pageHref}
          action={
            <ShareButton
              label={t.profile.share}
              copiedLabel={t.profile.copied}
              title={`DevPulse · ${repo.full_name}`}
            />
          }
        />

        <main id="main-content">
          {data.incomplete ? <p role="status" className="border-2 border-black bg-[#FFD84D] p-4 font-bold">{t.data.partial}</p> : null}
          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.68fr_0.32fr]">
            <div className="bg-[#3567FF] p-7 text-white md:p-12 lg:border-r-2 lg:border-black">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
                {t.repository.eyebrow}
              </p>
              <h1 className="mt-4 break-words text-5xl font-black tracking-[-0.055em] md:text-7xl">
                {repo.name}
              </h1>
              <p className="mt-2 text-lg font-black text-white/55">{owner}</p>
              <p className="mt-7 max-w-3xl text-lg font-semibold leading-relaxed text-white/75">
                {repo.description || t.projects.noDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {repo.language ? <Tag>{repo.language}</Tag> : null}
                <Tag>{t.lifecycle[data.lifecycle]}</Tag>
                <Tag>{repo.license?.spdx_id ?? t.common.none}</Tag>
                {repo.archived ? <Tag>{t.lifecycle.archived}</Tag> : null}
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="mt-9 inline-flex items-center gap-2 border-2 border-white px-4 py-3 font-black hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t.common.openGitHub}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
            <div className="flex flex-col justify-between bg-[#FF5C35] p-7 md:p-10">
              <Radar size={38} aria-hidden="true" />
              <div>
                <p className="text-8xl font-black tracking-[-0.08em]">{data.health.score}</p>
                <p className="mt-1 text-xl font-black">/ 100 {t.projects.health.toLowerCase()}</p>
                <dl className="mt-8 grid grid-cols-2 gap-6 border-t-2 border-black pt-6">
                  <Stat label={t.projects.stars} value={formatNumber(repo.stargazers_count, locale)} />
                  <Stat label={t.projects.forks} value={formatNumber(repo.forks_count, locale)} />
                  <Stat label={t.projects.issues} value={formatNumber(repo.open_issues_count, locale)} />
                  <Stat label={t.projects.lastPush} value={relativeAge(repo.pushed_at, new Date(), locale)} />
                </dl>
              </div>
            </div>
          </section>

          <section className="border-x-2 border-b-2 border-black bg-[#D8FF54] p-7 md:p-10">
            <SectionHeading eyebrow={t.languages.eyebrow} title={t.languages.title} />
            <div className="mt-9 space-y-5">
              {data.languages.map((language) => (
                <div key={language.name} className="grid items-center gap-3 md:grid-cols-[150px_1fr_90px_120px]">
                  <span className="font-black">{language.name}</span>
                  <div className="h-6 bg-black/10" role="img" aria-label={`${language.name}: ${language.percentage}%`}>
                    <div className="h-full bg-black" style={{ width: `${language.percentage}%` }} />
                  </div>
                  <span className="text-right text-xl font-black">{language.percentage}%</span>
                  <span className="text-right text-xs font-bold text-black/45">
                    {formatNumber(language.bytes, locale)} bytes
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid border-x-2 border-b-2 border-black lg:grid-cols-2">
            <div className="border-b-2 border-black bg-[#FFD84D] p-7 md:p-10 lg:border-b-0 lg:border-r-2">
              <SectionHeading
                eyebrow={t.repository.codeImpact}
                title={`${formatNumber(data.commitImpact.sampledCommits, locale)} ${t.repository.measuredScope.toLowerCase()}`}
                action={<GitCommit size={30} aria-hidden="true" />}
              />
              <dl className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3">
                <Stat label={t.repository.changedLines} value={formatNumber(data.commitImpact.changedLines, locale)} />
                <Stat label={t.repository.additions} value={formatNumber(data.commitImpact.additions, locale)} />
                <Stat label={t.repository.deletions} value={formatNumber(data.commitImpact.deletions, locale)} />
                <Stat label={t.repository.netChange} value={formatSigned(data.commitImpact.netChange, locale)} />
                <Stat label={t.repository.averageCommit} value={formatNumber(data.commitImpact.averageSize, locale)} />
                <Stat label={t.repository.medianCommit} value={formatNumber(data.commitImpact.medianSize, locale)} />
                <Stat label={t.repository.verified} value={`${data.commitImpact.verifiedCommitPercentage}%`} />
                <Stat label={t.repository.conventional} value={`${data.commitImpact.conventionalCommitPercentage}%`} />
              </dl>
            </div>
            <div className="bg-[#78E6D0] p-7 md:p-10">
              <SectionHeading
                eyebrow={t.repository.pullRequests}
                title={formatNumber(data.pullRequestAnalytics.measured, locale)}
                action={<GitPullRequest size={30} aria-hidden="true" />}
              />
              <dl className="mt-10 grid grid-cols-2 gap-8">
                <Stat label={t.repository.mergeRate} value={`${data.pullRequestAnalytics.mergeRate}%`} />
                <Stat label={t.detail.open} value={data.pullRequestAnalytics.open} />
                <Stat label={t.detail.merged} value={data.pullRequestAnalytics.merged} />
                <Stat
                  label={t.detail.medianMerge}
                  value={formatHours(data.pullRequestAnalytics.medianMergeHours, locale)}
                />
              </dl>
            </div>
          </section>

          <section className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
            <SectionHeading eyebrow={t.repository.practices} title={t.repository.practices} />
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.practices.map((practice) => (
                <article key={practice.id} className="flex items-start gap-4 border-2 border-black bg-white p-5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black ${
                      practice.detected ? "bg-[#D8FF54]" : "bg-black/5"
                    }`}
                  >
                    {practice.detected ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
                  </span>
                  <div>
                    <h3 className="font-black">{localizeEvidence(practice.label, locale)}</h3>
                    <p className="mt-1 text-sm font-semibold text-black/50">
                      {practice.detected
                        ? localizeEvidence(practice.evidence ?? t.repository.detected, locale)
                        : t.repository.notDetected}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid border-x-2 border-b-2 border-black sm:grid-cols-2 lg:grid-cols-4">
            <SummaryBlock color="bg-[#3567FF] text-white" label={t.repository.releases} value={data.releases.length} />
            <SummaryBlock color="bg-[#FF6B8A]" label={t.repository.workflowRuns} value={data.workflowRuns.length} />
            <SummaryBlock color="bg-[#FFD84D]" label={t.repository.issues} value={data.issues.length} />
            <SummaryBlock color="bg-[#78E6D0]" label={t.repository.revival} value={data.revival ? data.revival.dormantDays : 0} suffix={data.revival ? t.common.days : ""} />
          </section>

          <RepositoryEvidence data={data} locale={locale} />
          <section className="border-x-2 border-b-2 border-black bg-[#171717] p-7 text-white md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">{t.repository.measuredScope}</p>
            <p className="mt-3 max-w-4xl font-semibold leading-relaxed text-white/65">{t.detail.scope}</p>
            <p className="mt-5 max-w-4xl text-sm font-bold text-[#FFD84D]">{t.repository.caveat}</p>
          </section>
        </main>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="border border-white/45 bg-black/15 px-3 py-2 text-xs font-black uppercase">{children}</span>;
}

function SummaryBlock({
  color,
  label,
  value,
  suffix = "",
}: {
  color: string;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className={`min-h-44 border-b-2 border-black p-6 last:border-b-0 sm:border-r-2 lg:border-b-0 ${color}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">{label}</p>
      <p className="mt-10 text-5xl font-black">
        {value}
        {suffix ? <span className="ml-2 text-sm">{suffix}</span> : null}
      </p>
    </div>
  );
}

function formatSigned(value: number, locale: Locale) {
  return `${value > 0 ? "+" : ""}${formatNumber(value, locale)}`;
}

function formatHours(value: number | null, locale: Locale) {
  if (value === null) return "—";
  if (value < 24) return `${value.toFixed(1)}h`;
  return `${(value / 24).toFixed(1)}${locale === "es" ? "d" : "d"}`;
}

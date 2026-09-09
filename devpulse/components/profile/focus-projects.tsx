import Link from "next/link";
import { ArrowUpRight, ChevronRight, Crosshair } from "lucide-react";
import { daysSince, relativeAge } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/numbers";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProjectLifecycle } from "@/types/analytics";
import type { ProfileDashboardData } from "@/types/profile";

export function FocusProjects({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const focusLabel =
    data.focus.label === "focused"
      ? t.focus.focused
      : data.focus.label === "balanced"
        ? t.focus.balanced
        : data.focus.label === "distributed"
          ? t.focus.distributed
          : t.focus.none;
  return (
    <section id="projects" className="grid border-x-2 border-b-2 border-black lg:grid-cols-[0.32fr_0.68fr]">
      <div className="flex min-h-[560px] flex-col justify-between border-black bg-[#78E6D0] p-7 md:p-10 lg:border-r-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.focus.eyebrow}</p>
            <Crosshair size={24} aria-hidden="true" />
          </div>
          <h2 className="mt-2 text-3xl font-black">{t.focus.title}</h2>
          <p className="mt-9 text-[104px] font-black leading-none tracking-[-0.085em] md:text-[124px]">
            {data.focus.score}
          </p>
          <p className="mt-1 text-xl font-black">/ 100</p>
        </div>
        <div>
          <p className="text-2xl font-black">{focusLabel}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 border-t-2 border-black pt-6">
            <FocusStat label={t.focus.topProject} value={`${data.focus.topProjectShare}%`} />
            <FocusStat label={t.focus.topThree} value={`${data.focus.topThreeShare}%`} />
            <FocusStat label={t.focus.activeRepos} value={String(data.focus.activeRepositories)} />
            <FocusStat label={t.focus.fragmentation} value={`${data.focus.fragmentation}%`} />
          </dl>
          <details className="mt-8 border-t-2 border-black pt-5">
            <summary className="cursor-pointer font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              {t.focus.how}
            </summary>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-black/60">{t.focus.formula}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-wide text-black/45">{t.focus.caveat}</p>
          </details>
        </div>
      </div>

      <div className="bg-[#F4F1E8]">
        <div className="border-b-2 border-black p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">{t.projects.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{t.projects.title}</h2>
        </div>
        <div>
          {data.activeProjects.map((project, index) => {
            const repo = project.repo;
            const age = repo ? Math.max(0, daysSince(repo.created_at) / 365.25) : null;
            return (
              <article key={project.nameWithOwner} className="border-b-2 border-black p-6 last:border-b-0 md:p-8">
                <div className="grid gap-5 xl:grid-cols-[44px_minmax(0,1fr)_170px] xl:items-start">
                  <span className="text-sm font-black text-black/35">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xl font-black underline decoration-transparent underline-offset-4 hover:decoration-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        {project.name}<ArrowUpRight size={17} aria-hidden="true" />
                      </a>
                      <span className="border border-black bg-white px-2 py-1 text-xs font-black uppercase">
                        {lifecycleLabel(project.lifecycle, t)}
                      </span>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-black/60">
                      {repo?.description || t.projects.noDescription}
                    </p>
                    <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-black/55">
                      {repo?.language ? <Meta label={t.detail.language} value={repo.language} /> : null}
                      {repo ? <Meta label={t.projects.lastPush} value={relativeAge(repo.pushed_at, new Date(), data.locale)} /> : null}
                      {repo ? <Meta label={t.projects.stars} value={formatNumber(repo.stargazers_count, data.locale)} /> : null}
                      {repo ? <Meta label={t.projects.forks} value={formatNumber(repo.forks_count, data.locale)} /> : null}
                      {repo ? <Meta label={t.projects.issues} value={formatNumber(repo.open_issues_count, data.locale)} /> : null}
                      {age !== null ? <Meta label={t.projects.age} value={`${age.toFixed(1)}y`} /> : null}
                      {repo ? <Meta label={t.projects.health} value={`${project.health.score}/100`} /> : null}
                    </dl>
                    {repo ? (
                      <Link
                        href={`/u/${encodeURIComponent(data.user.login)}/r/${encodeURIComponent(repo.name)}?lang=${data.locale}`}
                        className="mt-5 inline-flex items-center gap-1 text-sm font-black underline decoration-transparent underline-offset-4 hover:decoration-black"
                      >
                        {t.projects.inspect}<ChevronRight size={15} aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                  <div className="xl:text-right">
                    {project.count > 0 ? (
                      <>
                        <p className="text-4xl font-black tracking-tight">{project.percentage}%</p>
                        <p className="mt-1 text-xs font-bold text-black/45">{t.projects.activityShare}</p>
                        <p className="mt-4 text-sm font-black">
                          {formatNumber(project.count, data.locale)} {t.projects.recentActivity.toLowerCase()}
                        </p>
                        {project.trend !== null ? (
                          <p className={`mt-1 text-sm font-black ${project.trend >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {project.trend >= 0 ? "+" : ""}{project.trend}%
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm font-black text-black/45">{t.projects.recentlyPushed}</p>
                    )}
                  </div>
                </div>
                {project.count > 0 ? (
                  <div className="mt-5 h-2 bg-black/10" role="img" aria-label={`${project.name}: ${project.percentage}%`}>
                    <div className="h-full bg-black" style={{ width: `${project.percentage}%` }} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FocusStat({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-black/45">{label}</dt><dd className="mt-1 text-xl font-black">{value}</dd></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="inline text-black/35">{label}: </dt><dd className="inline text-black/65">{value}</dd></div>;
}

function lifecycleLabel(value: ProjectLifecycle, t: Dictionary): string {
  return t.lifecycle[value];
}

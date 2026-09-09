import { ArrowUpRight, Crosshair } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProfileDashboardData } from "@/types/profile";

const colors = ["bg-[#FF5C35]", "bg-[#FFD84D]", "bg-[#78E6D0]"];

export function DataNotice({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const message =
    data.dataNoticeMessage ??
    (data.dataNotice === "deep"
      ? t.data.deep
      : data.dataNotice === "basic"
        ? t.data.basic
        : t.data.partial);
  return (
    <div
      role={data.dataNotice === "rate-limit" ? "alert" : "status"}
      className={`border-x-2 border-b-2 border-black px-6 py-3 text-sm font-bold ${
        data.dataNotice === "deep" ? "bg-[#D8FF54]" : "bg-[#FFD84D]"
      }`}
    >
      {message}
      {data.contributionData.limited ? ` ${t.data.limited}` : ""}
    </div>
  );
}

export function CurrentFocus({ data, dictionary: t }: { data: ProfileDashboardData; dictionary: Dictionary }) {
  const labels = [t.currentFocus.main, t.currentFocus.secondary, t.currentFocus.emerging];
  return (
    <section id="current-focus" className="border-x-2 border-b-2 border-black bg-[#F4F1E8]">
      <div className="flex flex-col justify-between gap-4 border-b-2 border-black p-6 md:flex-row md:items-end md:p-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
            {t.currentFocus.eyebrow} · {data.range}
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">
            {t.currentFocus.title}
          </h2>
          <p className="mt-3 max-w-2xl font-medium text-black/55">{t.currentFocus.description}</p>
        </div>
        <Crosshair size={32} aria-hidden="true" />
      </div>
      {data.currentFocus.length ? (
        <div className="grid lg:grid-cols-3">
          {data.currentFocus.map((project, index) => (
            <article
              key={project.nameWithOwner}
              className={`min-h-56 border-b-2 border-black p-6 last:border-b-0 lg:border-b-0 lg:border-r-2 lg:last:border-r-0 ${colors[index]}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/50">{labels[index]}</p>
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-start gap-2 text-2xl font-black tracking-tight underline decoration-transparent underline-offset-4 hover:decoration-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {project.name}<ArrowUpRight size={18} className="mt-1 shrink-0" aria-hidden="true" />
              </a>
              {project.repo?.description ? (
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-relaxed text-black/55">
                  {project.repo.description}
                </p>
              ) : null}
              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="text-5xl font-black tracking-[-0.055em]">{project.percentage}%</p>
                <p className="max-w-28 text-right text-xs font-bold text-black/45">{t.currentFocus.measured}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="p-8 font-bold text-black/50 md:p-10">{t.currentFocus.unavailable}</p>
      )}
    </section>
  );
}

import { ArrowUpRight, Code2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProfileDashboardData } from "@/types/profile";

const eraColors = ["bg-[#3567FF] text-white", "bg-[#FFD84D]", "bg-[#78E6D0]", "bg-[#FF6B8A]"];

export function LanguageHistory({
  data,
  dictionary: t,
}: {
  data: ProfileDashboardData;
  dictionary: Dictionary;
}) {
  return (
    <>
      <section id="languages" className="border-x-2 border-b-2 border-black bg-[#D8FF54] p-7 md:p-10">
        <SectionHeading
          eyebrow={t.languages.eyebrow}
          title={t.languages.title}
          description={t.languages.activeDistribution}
          action={<Code2 size={30} aria-hidden="true" />}
        />
        {data.languages.length > 0 ? (
          <div className="mt-10 space-y-6">
            {data.languages.map((language) => (
              <div key={language.name} className="grid items-center gap-3 md:grid-cols-[160px_1fr_84px]">
                <div>
                  <span className="font-black">{language.name}</span>
                  <span className="mt-1 block text-xs font-bold text-black/45">
                    {language.repositoryCount} {t.languages.repositories} · {t.languages.firstSeen} {language.firstSeenYear}
                  </span>
                </div>
                <div className="h-7 bg-black/10" role="img" aria-label={`${language.name}: ${language.percentage}%`}>
                  <div className="h-full bg-black" style={{ width: `${language.percentage}%` }} />
                </div>
                <span className="text-right text-2xl font-black">{language.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 font-bold text-black/50">{t.languages.noData}</p>
        )}
        <p className="mt-9 border-t-2 border-black pt-5 text-xs font-black uppercase tracking-wide text-black/45">
          {t.languages.disclaimer}
        </p>
      </section>

      <section id="eras" className="border-x-2 border-b-2 border-black bg-[#171717] p-7 text-white md:p-10">
        <SectionHeading
          eyebrow={t.eras.eyebrow}
          title={t.eras.title}
          description={t.eras.description}
          light
        />
        {data.eras.length > 0 ? (
          <div className="mt-10 grid border-2 border-white/30 lg:grid-cols-2">
            {data.eras.map((era, index) => {
              const light = index % eraColors.length === 0;
              const range = era.startYear === era.endYear ? String(era.startYear) : `${era.startYear}–${era.endYear}`;
              return (
                <article
                  key={era.id}
                  className={`min-h-72 border-b-2 border-white/30 p-7 last:border-b-0 lg:border-r-2 lg:[&:nth-child(even)]:border-r-0 ${eraColors[index % eraColors.length]}`}
                >
                  <p className={`text-xs font-black uppercase tracking-[0.2em] ${light ? "text-white/55" : "text-black/45"}`}>
                    {range}
                  </p>
                  <h3 className="mt-4 text-3xl font-black uppercase tracking-tight">
                    {data.locale === "es" ? `Era de ${era.dominantLanguage}` : era.title}
                  </h3>
                  <p className={`mt-3 text-sm font-semibold leading-relaxed ${light ? "text-white/60" : "text-black/55"}`}>
                    {data.locale === "es"
                      ? `${era.dominantLanguage} fue el lenguaje principal más común entre los repositorios originales creados en ${range}.`
                      : era.explanation}
                  </p>
                  <p className="mt-7 text-4xl font-black">{era.repositoryShare}%</p>
                  <p className={`mt-1 text-xs font-bold ${light ? "text-white/50" : "text-black/50"}`}>
                    {t.eras.repositoryShare}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {era.repositories.map((repo) => (
                      <a
                        key={repo.html_url}
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 border px-3 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          light ? "border-white/50 hover:bg-white/10" : "border-black hover:bg-black/10"
                        }`}
                      >
                        {repo.name}<ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 font-bold text-white/50">{t.eras.empty}</p>
        )}
      </section>

      <section id="journey" className="border-x-2 border-b-2 border-black bg-[#F4F1E8] p-7 md:p-10">
        <SectionHeading eyebrow={t.journey.eyebrow} title={t.journey.title} />
        <div className="mt-10 border-t-2 border-black">
          {data.techJourney.map((year) => (
            <div key={year.year} className="grid gap-5 border-b-2 border-black py-7 last:border-b-0 md:grid-cols-[100px_1fr]">
              <p className="text-3xl font-black">{year.year}</p>
              <div className="space-y-3">
                {year.languages.map((language) => (
                  <div key={language.name} className="grid grid-cols-[120px_1fr_56px] items-center gap-3">
                    <span className="text-sm font-black">
                      {language.name}
                      {language.firstAppearance ? <span className="block text-[11px] text-black/40">{t.journey.firstAppearance}</span> : null}
                    </span>
                    <div className="h-4 bg-black/10">
                      <div className="h-full bg-[#3567FF]" style={{ width: `${language.percentage}%` }} />
                    </div>
                    <span className="text-right text-sm font-black">{language.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

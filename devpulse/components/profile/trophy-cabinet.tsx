import { Award } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { trophyDescription, trophyName, trophyTier } from "@/lib/i18n/trophies";
import type { Dictionary } from "@/lib/i18n/en";
import type { ProfileDashboardData } from "@/types/profile";

export function TrophyCabinet({
  data,
  dictionary: t,
}: {
  data: ProfileDashboardData;
  dictionary: Dictionary;
}) {
  return (
    <section
      id="trophies"
      className="border-x-2 border-b-2 border-black bg-[#FF6B8A] p-7 md:p-10"
    >
      <SectionHeading
        eyebrow={t.trophies.eyebrow}
        title={t.trophies.title}
        description={t.trophies.description}
        action={
          <div className="flex items-end gap-3">
            <Award size={30} aria-hidden="true" />
            <div className="text-right">
              <p className="text-5xl font-black tracking-[-0.05em]">
                {data.trophies.all.length}
              </p>
              <p className="text-sm font-bold text-black/55">
                / {data.trophies.totalPossible} {t.trophies.milestones}
              </p>
            </div>
          </div>
        }
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.trophies.highest.slice(0, 16).map((trophy) => (
          <article
            key={trophy.family}
            className="border-2 border-black bg-[#F4F1E8] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black font-black"
                style={{ backgroundColor: trophy.tier.color }}
                aria-hidden="true"
              >
                ◆
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-black/45">
                {trophyTier(trophy.tier.name, data.locale)}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-black">
              {trophyName(trophy.family, data.locale)}
            </h3>
            <p className="mt-1 min-h-10 text-sm font-semibold text-black/50">
              {trophyDescription(trophy.family, trophy.description, data.locale)}
            </p>
            <p className="mt-5 text-3xl font-black">{trophy.formattedValue}</p>
            <Link className="mt-3 inline-block text-sm font-black underline" href={"/u/" + encodeURIComponent(data.user.login) + "/share?" + new URLSearchParams({ kind: "trophy", id: trophy.family + "|" + data.range, lang: data.locale })}>{data.locale === "es" ? "Compartir" : "Share"}</Link>
          </article>
        ))}
      </div>

      {data.trophies.next.length > 0 ? (
        <div className="mt-12 border-t-2 border-black pt-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
            {t.trophies.closest}
          </p>
          <div className="mt-5 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {data.trophies.next.slice(0, 4).map((next) => (
              <div key={next.family}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{trophyName(next.family, data.locale)}</p>
                    <p className="text-sm font-bold text-black/45">
                      {trophyTier(next.tier.name, data.locale)}
                    </p>
                  </div>
                  <p className="text-sm font-black">
                    {next.formattedValue} / {next.formattedTarget}
                  </p>
                </div>
                <div
                  className="mt-3 h-3 border border-black bg-black/10"
                  role="progressbar"
                  aria-valuenow={next.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-black" style={{ width: `${next.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-10 border-t border-black/20 pt-5 text-xs font-bold text-black/50">
        {t.trophies.historyNotice}
      </p>
    </section>
  );
}

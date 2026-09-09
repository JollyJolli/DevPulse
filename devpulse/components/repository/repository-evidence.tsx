import { commitTiming } from "@/lib/analytics/commit-timing";
import { formatUtcDate } from "@/lib/utils/dates";
import type { RepositoryInsight } from "@/types/repository";
import type { Locale } from "@/types/analytics";

export function RepositoryEvidence({ data, locale }: { data: RepositoryInsight; locale: Locale }) {
  const es = locale === "es";
  const timing = commitTiming(data.commits);
  const weekdays = es ? ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"] : ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const links = [
    { title: es ? "Pull requests recientes" : "Recent pull requests", items: data.pullRequests.slice(0, 6).map(p => ({ id: p.id, label: p.title, url: p.html_url, meta: p.merged_at ? (es ? "Fusionada" : "Merged") : p.state })) },
    { title: es ? "Publicaciones" : "Releases", items: data.releases.slice(0, 6).map(r => ({ id: r.id, label: r.name || r.tag_name, url: r.html_url, meta: r.published_at ? formatUtcDate(r.published_at, locale) : "—" })) },
    { title: es ? "Ejecuciones de CI" : "CI runs", items: data.workflowRuns.slice(0, 6).map(r => ({ id: r.id, label: r.name || "Workflow", url: r.html_url, meta: r.conclusion || r.status || "—" })) },
  ];
  return <>
    <section className="border-x-2 border-b-2 border-black bg-[#FFD84D] p-7 md:p-10">
      <h2 className="text-3xl font-black">{es ? "Cuándo se registran los commits" : "When commits are recorded"}</h2>
      <p className="mt-3 font-semibold">{es ? "Marcas de tiempo en UTC; no representan horas trabajadas." : "UTC timestamps; these do not represent hours worked."}</p>
      {timing.sampled >= 5 ? <div className="mt-7 overflow-x-auto">
        <div className="min-w-[650px]">
          <div className="ml-12 grid grid-cols-24 gap-1">{Array.from({length:24},(_,hour)=><span key={hour} className="text-[10px] font-bold">{hour}</span>)}</div>
          {timing.cells.map((hours, day)=><div key={day} className="mt-1 flex items-center gap-2">
            <span className="w-10 text-xs font-black">{weekdays[day]}</span>
            <div className="grid flex-1 grid-cols-24 gap-1">{hours.map((count,hour)=><span key={hour} tabIndex={0} title={weekdays[day]+" "+hour+":00 UTC · "+count} aria-label={weekdays[day]+" "+hour+":00 UTC · "+count}
              className="h-5 border border-black/20" style={{backgroundColor: count ? "#3567FF" : "#00000010", opacity: count ? 0.25 + 0.75*count/timing.maximum : 1}} />)}</div>
          </div>)}
        </div>
      </div> : <p className="mt-6 font-bold">{es ? "Se necesitan al menos cinco commits con fecha válida." : "At least five commits with valid timestamps are needed."}</p>}
      {data.revival ? <p className="mt-8 border-t-2 border-black pt-5 font-black">{es ? "Actividad registrada tras " : "Activity recorded after "}{data.revival.dormantDays}{es ? " días de pausa: " : " dormant days: "}{formatUtcDate(data.revival.resumedAt, locale)}</p> : null}
      {data.commitImpact.largestCommit ? <a href={data.commitImpact.largestCommit.html_url} target="_blank" rel="noreferrer" className="mt-5 block font-black underline">{es ? "Mayor diff de la muestra" : "Largest sampled diff"} · {data.commitImpact.largestCommit.sha.slice(0,7)}</a> : null}
    </section>
    <section className="grid border-x-2 border-b-2 border-black bg-[#F4F1E8] lg:grid-cols-3">
      {links.map(group=><div key={group.title} className="border-b-2 border-black p-7 lg:border-b-0 lg:border-r-2 last:border-0">
        <h2 className="text-2xl font-black">{group.title}</h2>
        {group.items.length ? <ul className="mt-6 space-y-5">{group.items.map(item=><li key={item.id}>
          <a href={item.url} target="_blank" rel="noreferrer" className="font-bold underline">{item.label}</a>
          <p className="mt-1 text-xs font-semibold">{item.meta}</p>
        </li>)}</ul> : <p className="mt-6">{es ? "Sin registros en la muestra disponible." : "No records in the available sample."}</p>}
      </div>)}
    </section>
  </>;
}


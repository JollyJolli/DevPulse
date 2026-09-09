import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  note,
  light = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  light?: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-black uppercase tracking-wider ${light ? "text-white/50" : "text-black/45"}`}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      {note ? (
        <p className={`mt-1 text-xs font-bold ${light ? "text-white/45" : "text-black/40"}`}>{note}</p>
      ) : null}
    </div>
  );
}

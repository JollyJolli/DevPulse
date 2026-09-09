import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p
          className={`text-xs font-black uppercase tracking-[0.2em] ${
            light ? "text-white/55" : "text-black/45"
          }`}
        >
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] md:text-4xl">{title}</h2>
        {description ? (
          <p
            className={`mt-3 max-w-3xl text-base font-medium leading-relaxed ${
              light ? "text-white/60" : "text-black/55"
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

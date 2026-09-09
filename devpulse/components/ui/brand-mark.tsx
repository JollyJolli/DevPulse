import { Activity } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#FF5C35] text-black">
        <Activity size={compact ? 17 : 20} strokeWidth={2.6} aria-hidden="true" />
      </span>
      <span className={compact ? "text-lg font-black tracking-tight" : "text-xl font-black tracking-tight"}>
        DevPulse
      </span>
    </span>
  );
}

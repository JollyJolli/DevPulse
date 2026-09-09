import type { TrendValue } from "@/types/analytics";

export function compareNumber(current: number, previous: number): TrendValue {
  return {
    current,
    previous,
    delta: current - previous,
    percent: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
  };
}

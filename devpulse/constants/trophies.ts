import type { TrophyTier } from "@/types/analytics";

export const TROPHY_TIERS: readonly TrophyTier[] = [
  { name: "Bronze", color: "#CD7F32" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "Gold", color: "#FFD84D" },
  { name: "Emerald", color: "#50C878" },
  { name: "Platinum", color: "#E5E4E2" },
  { name: "Diamond", color: "#78E6D0" },
  { name: "Master", color: "#FF6B8A" },
  { name: "Mythic", color: "#8B5CF6" },
] as const;

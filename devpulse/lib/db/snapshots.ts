import "server-only";
import type { ProfileDashboardData } from "@/types/profile";

/** Opt-in: configure credentials, apply the migration, then enable the flag. */
export async function persistProfileSnapshot(data: ProfileDashboardData): Promise<void> {
  if (process.env.DEVPULSE_PERSIST_SNAPSHOTS !== "true") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Snapshot persistence is not configured.");
  // Do not record API outages as zero-valued history.
  if (data.dataNotice !== "deep" || data.contributionData.limited) return;
  const response = await fetch(new URL("/rest/v1/rpc/record_profile_snapshot", url), {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ payload: {
      user: { id: data.user.id, login: data.user.login, name: data.user.name,
        avatar_url: data.user.avatar_url, created_at: data.user.created_at, followers: data.user.followers },
      range: data.range, source: data.contributionData.source,
      limited: data.contributionData.limited, contributions: data.contributionData.totalContributions,
      focus: data.focus.score, activeRepositories: data.focus.activeRepositories, stars: data.totalStars,
      days: data.contributionData.days, languages: data.languages,
      activity: data.contributionData.repoContributions, trophies: data.trophies.all,
    } }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Snapshot persistence failed (" + response.status + ").");
}

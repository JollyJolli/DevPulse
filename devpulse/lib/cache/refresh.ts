import "server-only";

const cooldowns = new Map<string, number>();

/** Per-process guard. Deployments with multiple instances also need an edge rate limit. */
export function allowRefresh(key: string, requested: boolean, now = Date.now()): boolean {
  if (!requested) return false;
  for (const [entry, expires] of cooldowns) if (expires <= now) cooldowns.delete(entry);
  if (cooldowns.has(key) || cooldowns.size >= 1000) return false;
  cooldowns.set(key, now + 60_000);
  return true;
}

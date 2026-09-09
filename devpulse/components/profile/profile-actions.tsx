"use client";

import { Heart, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { REFRESH_COOLDOWN_SECONDS } from "@/constants/analytics";

const RECENT_KEY = "devpulse:recent-profiles";
const FAVORITES_KEY = "devpulse:favorite-profiles";

function readList(key: string): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ProfileActions({
  username,
  refreshLabel,
  favoriteLabel,
  favoritedLabel,
  shareLabel,
  copiedLabel,
}: {
  username: string;
  refreshLabel: string;
  favoriteLabel: string;
  favoritedLabel: string;
  shareLabel: string;
  copiedLabel: string;
}) {
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const recent = [username, ...readList(RECENT_KEY).filter((item) => item !== username)].slice(0, 8);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));

    const updateCooldown = () => {
      const last = Number(window.localStorage.getItem(`devpulse:refresh:${username}`) ?? 0);
      const elapsed = Math.floor((Date.now() - last) / 1000);
      setRemaining(Math.max(0, REFRESH_COOLDOWN_SECONDS - elapsed));
    };
    const frame = window.requestAnimationFrame(() => {
      setFavorite(readList(FAVORITES_KEY).includes(username));
      updateCooldown();
    });
    const timer = window.setInterval(updateCooldown, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [username]);

  function toggleFavorite() {
    const favorites = readList(FAVORITES_KEY);
    const next = favorite
      ? favorites.filter((item) => item !== username)
      : [username, ...favorites.filter((item) => item !== username)].slice(0, 20);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavorite(!favorite);
  }

  async function share() {
    const payload = { title: `DevPulse · @${username}`, url: window.location.href };
    if (navigator.share) {
      await navigator.share(payload).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(payload.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function refresh() {
    if (remaining > 0) return;
    window.localStorage.setItem(`devpulse:refresh:${username}`, String(Date.now()));
    const url = new URL(window.location.href);
    url.searchParams.set("refresh", "1");
    window.location.assign(url.toString());
  }

  const buttonClass =
    "inline-flex min-h-10 items-center gap-2 border border-white/35 bg-black/25 px-3 py-2 text-sm font-black text-white backdrop-blur-sm transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={toggleFavorite} className={buttonClass} aria-pressed={favorite}>
        <Heart size={15} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
        {favorite ? favoritedLabel : favoriteLabel}
      </button>
      <button type="button" onClick={share} className={buttonClass}>
        <Share2 size={15} aria-hidden="true" />
        {copied ? copiedLabel : shareLabel}
      </button>
      <button type="button" onClick={refresh} disabled={remaining > 0} className={buttonClass}>
        <RefreshCw size={15} aria-hidden="true" />
        {remaining > 0 ? `${refreshLabel} · ${remaining}s` : refreshLabel}
      </button>
    </div>
  );
}

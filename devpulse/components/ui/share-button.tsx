"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({
  label,
  copiedLabel,
  title,
  className,
}: {
  label: string;
  copiedLabel: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const payload = { title, url: window.location.href };
    if (navigator.share) {
      await navigator.share(payload).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(payload.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        className ??
        "inline-flex items-center gap-2 border-2 border-black bg-[#D8FF54] px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      }
    >
      <Share2 size={16} aria-hidden="true" />
      {copied ? copiedLabel : label}
    </button>
  );
}

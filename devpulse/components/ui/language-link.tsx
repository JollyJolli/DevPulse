"use client";

import Link from "next/link";
import { useEffect } from "react";

export function LanguageLink({ href, locale, selected, className }: {
  href: string; locale: "en" | "es"; selected: boolean; className: string;
}) {
  useEffect(() => { if (selected) document.documentElement.lang = locale; }, [locale, selected]);
  return <Link href={href} hrefLang={locale} aria-current={selected ? "page" : undefined}
    className={className}
    onClick={(event) => {
      if (window.location.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        const target = new URL(href, window.location.origin);
        target.hash = window.location.hash;
        window.location.assign(target.toString());
      }
    }}>{locale}</Link>;
}

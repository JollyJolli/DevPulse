import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import type { Locale } from "@/types/analytics";

export function SubpageHeader({
  backHref,
  backLabel,
  locale,
  hrefForLanguage,
  action,
}: {
  backHref: string;
  backLabel: string;
  locale: Locale;
  hrefForLanguage: (locale: Locale) => string;
  action?: ReactNode;
}) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-[#F4F1E8] px-5 py-3 md:px-10">
      <div className="flex flex-wrap items-center gap-5">
        <Link href={`/?lang=${locale}`} aria-label="DevPulse home">
          <BrandMark compact />
        </Link>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-black underline decoration-transparent underline-offset-4 hover:decoration-black"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <LanguageSwitcher locale={locale} hrefFor={hrefForLanguage} />
      </div>
    </nav>
  );
}

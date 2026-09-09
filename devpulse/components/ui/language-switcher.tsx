import { LanguageLink } from "@/components/ui/language-link";
import type { Locale } from "@/types/analytics";

export function LanguageSwitcher({
  locale,
  hrefFor,
  light = false,
}: {
  locale: Locale;
  hrefFor: (locale: Locale) => string;
  light?: boolean;
}) {
  return (
    <div
      className={`flex border-2 text-xs font-black ${
        light ? "border-white/35 bg-black/20" : "border-black bg-[#F4F1E8]"
      }`}
      aria-label="Language / Idioma"
    >
      {(["en", "es"] as const).map((item) => (
        <LanguageLink
          key={item}
          href={hrefFor(item)}
          locale={item}
          selected={locale === item}
          className={`px-3 py-2 uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            locale === item
              ? "bg-[#FFD84D] text-black"
              : light
                ? "text-white hover:bg-white/10"
                : "hover:bg-black hover:text-white"
          }`}
        />
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareCard } from "@/lib/data/share-service";
import { getDictionary } from "@/lib/i18n";
import { firstQueryValue, parseLocale } from "@/lib/utils/strings";
import { ShareButton } from "@/components/ui/share-button";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const kind = firstQueryValue(query.kind) ?? "";
  const id = firstQueryValue(query.id) ?? "";
  const locale = parseLocale(query.lang);
  const card = await getShareCard(username, kind, id, locale);
  if (!card) return { title: "DevPulse" };
  const image = "/api/share?" + new URLSearchParams({ username, kind, id, lang: locale });
  return { title: card.title, description: card.subtitle + " · " + card.detail,
    openGraph: { images: [image] }, twitter: { card: "summary_large_image", images: [image] } };
}
export default async function SharePage({ params, searchParams }: Props) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const locale = parseLocale(query.lang);
  const card = await getShareCard(username, firstQueryValue(query.kind) ?? "", firstQueryValue(query.id) ?? "", locale);
  if (!card) notFound();
  const t = getDictionary(locale);
  return <main lang={locale} className="min-h-screen bg-[#F4F1E8] p-6 text-black md:p-12">
    <Link href={"/u/" + encodeURIComponent(username) + "?lang=" + locale} className="font-black underline">{t.common.backToProfile}</Link>
    <article className="mx-auto my-10 max-w-5xl border-4 border-black bg-[#FFD84D] p-8 md:p-16">
      <p className="font-black uppercase">DevPulse · {card.subtitle}</p>
      <h1 className="mt-10 text-5xl font-black md:text-7xl">{card.title}</h1>
      <p className="mt-8 text-6xl font-black text-[#3567FF] md:text-8xl">{card.value}</p>
      <p className="mt-8 text-xl font-bold">{card.detail}</p>
    </article>
    <div className="mx-auto max-w-5xl"><ShareButton label={t.profile.share} copiedLabel={t.profile.copied} title={card.title} /></div>
  </main>;
}


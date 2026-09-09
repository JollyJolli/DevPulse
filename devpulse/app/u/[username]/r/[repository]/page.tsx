import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RepositoryRadar } from "@/components/repository/repository-radar";
import { getRepositoryInsight } from "@/lib/data/repository-service";
import { getDictionary } from "@/lib/i18n";
import { getRepository } from "@/lib/github/repository-intelligence";
import { parseLocale } from "@/lib/utils/strings";
import { normalizeUsername } from "@/lib/utils/username";

type RepositoryPageProps = {
  params: Promise<{ username: string; repository: string }>;
  searchParams: Promise<{ lang?: string | string[]; refresh?: string | string[] }>;
};

export async function generateMetadata({ params }: RepositoryPageProps): Promise<Metadata> {
  const { username: rawUsername, repository: rawRepository } = await params;
  const username = normalizeUsername(rawUsername);
  if (!username) return { title: "Repository not found" };
  let repositoryName: string;
  try {
    repositoryName = decodeURIComponent(rawRepository);
  } catch {
    return { title: "Repository not found" };
  }
  const repository = await getRepository(username, repositoryName).catch(() => null);
  if (!repository) return { title: "Repository not found" };
  const title = `${repository.full_name} · Project Radar`;
  const description =
    repository.description ??
    `Public repository analytics and engineering signals for ${repository.full_name}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/u/${encodeURIComponent(username)}/r/${encodeURIComponent(repository.name)}`,
    },
  };
}

export default async function RepositoryPage({ params, searchParams }: RepositoryPageProps) {
  const [{ username, repository }, query] = await Promise.all([params, searchParams]);
  const locale = parseLocale(query.lang);
  const refresh = (Array.isArray(query.refresh) ? query.refresh[0] : query.refresh) === "1";
  const data = await getRepositoryInsight(username, repository, refresh);
  if (!data) notFound();
  return <RepositoryRadar data={data} dictionary={getDictionary(locale)} locale={locale} />;
}

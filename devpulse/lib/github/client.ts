import "server-only";

import { GitHubApiError } from "@/lib/github/errors";

const REST_ROOT = "https://api.github.com";
const GRAPHQL_URL = "https://api.github.com/graphql";

export type GitHubRequestOptions = {
  refresh?: boolean;
  revalidate?: number;
  allowNotFound?: boolean;
};

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevPulse",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function cacheOptions(options: GitHubRequestOptions): RequestInit {
  return options.refresh
    ? { cache: "no-store" }
    : { next: { revalidate: options.revalidate ?? 900 } };
}

function rateLimitReset(response: Response): Date | null {
  const raw = response.headers.get("x-ratelimit-reset");
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
}

async function assertGitHubResponse(
  response: Response,
  allowNotFound: boolean,
): Promise<"ok" | "not-found"> {
  if (response.ok) return "ok";
  if (response.status === 404 && allowNotFound) return "not-found";

  const remaining = response.headers.get("x-ratelimit-remaining");
  if (response.status === 429 || remaining === "0") {
    throw new GitHubApiError(
      "rate-limit",
      "GitHub's request limit was reached.",
      { status: response.status, resetAt: rateLimitReset(response) },
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new GitHubApiError(
      "unauthorized",
      "GitHub rejected the analytics request.",
      { status: response.status },
    );
  }
  if (response.status === 404) {
    throw new GitHubApiError("not-found", "The requested GitHub resource was not found.", {
      status: 404,
    });
  }
  throw new GitHubApiError("unavailable", "GitHub data is temporarily unavailable.", {
    status: response.status,
  });
}

export function hasGitHubToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export async function githubRest<T>(
  path: string,
  options: GitHubRequestOptions = {},
): Promise<T | null> {
  if (!path.startsWith("/")) {
    throw new GitHubApiError("invalid-response", "Invalid GitHub API path.");
  }
  try {
    const response = await fetch(`${REST_ROOT}${path}`, {
      headers: githubHeaders(),
      ...cacheOptions(options),
    });
    const status = await assertGitHubResponse(response, options.allowNotFound ?? false);
    if (status === "not-found") return null;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof GitHubApiError) throw error;
    throw new GitHubApiError("unavailable", "GitHub data is temporarily unavailable.", {
      cause: error,
    });
  }
}

export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  options: GitHubRequestOptions = {},
): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        ...githubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      ...cacheOptions(options),
    });
    await assertGitHubResponse(response, false);
    const payload = (await response.json()) as {
      data?: T;
      errors?: Array<{ type?: string; message?: string }>;
    };
    if (payload.errors?.length) {
      const notFound = payload.errors.every((error) => error.type === "NOT_FOUND");
      if (notFound && options.allowNotFound) return null;
      throw new GitHubApiError(
        notFound ? "not-found" : "invalid-response",
        notFound
          ? "The requested GitHub profile was not found."
          : "GitHub could not provide contribution analytics.",
      );
    }
    return payload.data ?? null;
  } catch (error) {
    if (error instanceof GitHubApiError) throw error;
    throw new GitHubApiError("unavailable", "GitHub data is temporarily unavailable.", {
      cause: error,
    });
  }
}

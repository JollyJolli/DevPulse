export type GitHubErrorKind =
  | "not-found"
  | "rate-limit"
  | "unauthorized"
  | "unavailable"
  | "invalid-response";

export class GitHubApiError extends Error {
  readonly kind: GitHubErrorKind;
  readonly status: number | null;
  readonly resetAt: Date | null;

  constructor(
    kind: GitHubErrorKind,
    message: string,
    options: { status?: number; resetAt?: Date | null; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "GitHubApiError";
    this.kind = kind;
    this.status = options.status ?? null;
    this.resetAt = options.resetAt ?? null;
  }
}

export function publicGitHubErrorMessage(error: unknown): string {
  if (!(error instanceof GitHubApiError)) {
    return "GitHub data is temporarily unavailable.";
  }
  if (error.kind === "rate-limit") {
    return error.resetAt
      ? `GitHub's request limit was reached. Try again after ${error.resetAt.toISOString()}.`
      : "GitHub's request limit was reached. Please try again later.";
  }
  if (error.kind === "unauthorized") {
    return "Deep GitHub analytics are temporarily unavailable.";
  }
  return error.message;
}

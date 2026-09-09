const USERNAME_PATTERN = /^(?!-)(?!.*--)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function normalizeUsername(input: string): string | null {
  let value = input.trim();
  if (!value) return null;

  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }

  value = value.replace(/^@/, "");

  if (/^(?:https?:\/\/)?(?:www\.)?github\.com\//i.test(value)) {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withProtocol);
      value = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return null;
    }
  } else {
    value = value.split(/[/?#]/, 1)[0];
  }

  if (!USERNAME_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function assertUsername(input: string): string {
  const username = normalizeUsername(input);
  if (!username) throw new Error("INVALID_GITHUB_USERNAME");
  return username;
}

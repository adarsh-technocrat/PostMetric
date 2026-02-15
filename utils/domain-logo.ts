/**
 * Normalize input to a hostname (e.g. "example.com") for logo lookups.
 * Strips protocol, path, and optional "www." prefix.
 */
export function domainToHostname(input: string | null): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length < 2) return null;
  const withoutProtocol =
    trimmed.replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  const hostname = withoutProtocol.replace(/^www\./, "").trim();
  return hostname || null;
}

export function getLogoDevUrl(domain: string | null): string | null {
  const cleanDomain = domainToHostname(domain);
  if (!cleanDomain) {
    return null;
  }

  const token =
    process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_Dy6u8vlcQUGBq5pdblEd5w";
  return `https://img.logo.dev/${encodeURIComponent(cleanDomain)}?token=${token}`;
}

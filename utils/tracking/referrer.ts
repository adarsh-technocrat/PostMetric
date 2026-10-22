import type { IWebsite } from "@/db/models/Website";

/** Lowercase a domain/host and drop protocol, path, port and leading "www.". */
export function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  let host = String(value).trim().toLowerCase();
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  host = host.split("/")[0].split("?")[0].split("#")[0];
  // Strip a port, but leave bracketed IPv6 literals alone.
  if (!host.startsWith("[")) host = host.split(":")[0];
  host = host.replace(/\.$/, "").replace(/^www\./, "");
  return host;
}

/** True when host equals domain or is a subdomain of it (www-insensitive). */
export function hostMatchesDomain(host: string, domain: string): boolean {
  const h = normalizeHost(host);
  const d = normalizeHost(domain);
  if (!h || !d) return false;
  return h === d || h.endsWith(`.${d}`);
}

/** The website's own domains: main domain plus additionalDomains. */
export function getWebsiteDomains(website: Pick<IWebsite, "domain" | "settings">): string[] {
  const domains = [website.domain, ...(website.settings?.additionalDomains || [])];
  return domains.map(normalizeHost).filter(Boolean);
}

/**
 * True when the referrer domain belongs to the website itself (its domain,
 * a subdomain, or an additional domain). Such referrers are internal
 * navigation, not traffic sources.
 */
export function isSelfReferrer(
  referrerDomain: string | null | undefined,
  website: Pick<IWebsite, "domain" | "settings">,
): boolean {
  if (!referrerDomain) return false;
  const host = normalizeHost(referrerDomain);
  if (!host) return false;
  return getWebsiteDomains(website).some((d) => hostMatchesDomain(host, d));
}

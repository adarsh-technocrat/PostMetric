/**
 * Server-side bot filter for tracking requests.
 *
 * Matches well-known crawlers and headless/audit tools by user agent. Kept
 * conservative so real browsers are never dropped: device names that merely
 * contain "bot" (e.g. CUBOT phones) are stripped before matching, and a
 * generic "...bot" token only counts as a whole word (Googlebot, AhrefsBot,
 * "bot/1.0"), not as a substring of another word.
 */
const KNOWN_BOT_PATTERN =
  /googlebot|bingbot|chrome-lighthouse|headlesschrome|slurp|crawler|crawling|spider|facebookexternalhit|whatsapp\/|embedly|phantomjs|ia_archiver/i;

// A word ending in "bot" (Twitterbot, AhrefsBot, GPTBot, "bot") followed by a
// non-letter or end of string.
const GENERIC_BOT_WORD = /(^|[^a-z])[a-z]*bot([^a-z]|$)/i;

// Real devices whose model names contain "bot".
const BOT_FALSE_POSITIVES = /cubot/gi;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.replace(BOT_FALSE_POSITIVES, "");
  return KNOWN_BOT_PATTERN.test(ua) || GENERIC_BOT_WORD.test(ua);
}

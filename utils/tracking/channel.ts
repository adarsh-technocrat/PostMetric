const DIRECT_LABEL = "Direct/None";

function isDirect(value: string | null | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase().trim();
  return normalized === "direct";
}

export function resolveChannel(
  referrer: string | null | undefined,
  utmMedium?: string | null | undefined
): string {
  if (isDirect(referrer)) {
    return "Direct";
  }

  // TypeScript now knows referrer is not null/undefined after isDirect check
  const r = referrer!.toLowerCase();
  const m = utmMedium?.toLowerCase();

  // ---- Paid ----
  if (
    m === "paid" ||
    m === "cpc" ||
    m === "ppc" ||
    m === "ad" ||
    m === "ads" ||
    m === "sponsored" ||
    m === "display"
  ) {
    if (
      [
        "facebook",
        "instagram",
        "twitter",
        "x",
        "linkedin",
        "tiktok",
        "pinterest",
        "snapchat",
        "youtube",
      ].some((s) => r.includes(s))
    ) {
      return "Paid social";
    }
    return "Display";
  }

  // ---- Newsletter ----
  if (
    m === "newsletter" ||
    m === "email" ||
    r.includes("beehiiv") ||
    r.includes("substack") ||
    r.includes("mailchimp") ||
    r.includes("convertkit") ||
    r.includes("ghost")
  ) {
    return "Newsletter";
  }

  // ---- AI ----
  if (
    [
      "chatgpt",
      "openai",
      "perplexity",
      "gemini",
      "claude",
      "anthropic",
      "bard",
      "copilot",
    ].some((ai) => r.includes(ai))
  ) {
    return "A.I.";
  }

  // ---- Organic search ----
  if (
    [
      "google",
      "bing",
      "duckduckgo",
      "brave",
      "yandex",
      "kagi",
      "ecosia",
      "baidu",
      "yahoo",
      "ask.com",
    ].some((se) => r.includes(se))
  ) {
    return "Organic search";
  }

  // ---- Organic social ----
  if (
    [
      "twitter",
      "x",
      "facebook",
      "instagram",
      "linkedin",
      "reddit",
      "youtube",
      "medium",
      "producthunt",
      "tiktok",
      "pinterest",
      "snapchat",
      "telegram",
      "discord",
      "slack",
      "whatsapp",
      "hackernews",
      "news.ycombinator",
    ].some((social) => r.includes(social))
  ) {
    return "Organic social";
  }

  // ---- Affiliate (via / ref links) ----
  if (
    m === "affiliate" ||
    m === "referral" ||
    (r.length < 30 && !r.includes("."))
  ) {
    return "Affiliate";
  }

  // ---- Default ----
  return "Referral";
}

export function formatReferrerName(domain: string): string {
  if (isDirect(domain)) {
    return DIRECT_LABEL;
  }

  const cleanDomain = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.(com|org|net|io|co|dev|ai|app|xyz|me|tv|cc)$/, "");

  const domainMap: Record<string, string> = {
    x: "X",
    twitter: "X",
    "x.com": "X",
    youtube: "YouTube",
    "youtube.com": "YouTube",
    facebook: "Facebook",
    "facebook.com": "Facebook",
    instagram: "Instagram",
    "instagram.com": "Instagram",
    linkedin: "LinkedIn",
    "linkedin.com": "LinkedIn",
    medium: "Medium",
    "medium.com": "Medium",
    telegram: "Telegram",
    "telegram.org": "Telegram",
    producthunt: "Product Hunt",
    "producthunt.com": "Product Hunt",
    reddit: "Reddit",
    "reddit.com": "Reddit",
    hackernews: "Hacker News",
    "news.ycombinator.com": "Hacker News",
    tiktok: "TikTok",
    "tiktok.com": "TikTok",
    pinterest: "Pinterest",
    "pinterest.com": "Pinterest",
    snapchat: "Snapchat",
    "snapchat.com": "Snapchat",
    discord: "Discord",
    "discord.com": "Discord",
    slack: "Slack",
    "slack.com": "Slack",
    whatsapp: "WhatsApp",
    "whatsapp.com": "WhatsApp",
    chatgpt: "ChatGPT",
    "chat.openai.com": "ChatGPT",
    openai: "OpenAI",
    "openai.com": "OpenAI",
    perplexity: "Perplexity",
    "perplexity.ai": "Perplexity",
    gemini: "Google Gemini",
    "gemini.google.com": "Google Gemini",
    claude: "Claude",
    "claude.ai": "Claude",
    anthropic: "Anthropic",
    "anthropic.com": "Anthropic",
    bard: "Google Bard",
    copilot: "Microsoft Copilot",
    "copilot.microsoft.com": "Microsoft Copilot",
    google: "Google",
    "google.com": "Google",
    bing: "Bing",
    "bing.com": "Bing",
    duckduckgo: "DuckDuckGo",
    "duckduckgo.com": "DuckDuckGo",
    brave: "Brave",
    "brave.com": "Brave",
    yandex: "Yandex",
    "yandex.com": "Yandex",
    kagi: "Kagi",
    "kagi.com": "Kagi",
    ecosia: "Ecosia",
    "ecosia.org": "Ecosia",
    baidu: "Baidu",
    "baidu.com": "Baidu",
    yahoo: "Yahoo",
    "yahoo.com": "Yahoo",
    "ask.com": "Ask.com",
    beehiiv: "Beehiiv",
    "beehiiv.com": "Beehiiv",
    substack: "Substack",
    "substack.com": "Substack",
    mailchimp: "Mailchimp",
    "mailchimp.com": "Mailchimp",
    convertkit: "ConvertKit",
    "convertkit.com": "ConvertKit",
    ghost: "Ghost",
    "ghost.org": "Ghost",
  };

  if (domainMap[cleanDomain]) {
    return domainMap[cleanDomain];
  }

  return cleanDomain
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getReferrerImageUrl(
  referrerDomain: string | null
): string | null {
  if (isDirect(referrerDomain)) {
    return "https://icons.duckduckgo.com/ip3/none.ico";
  }
  const cleanDomain = referrerDomain!.toLowerCase().replace(/^www\./, "");
  return `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;
}

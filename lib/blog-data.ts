export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  heroImage?: string;
  heroImageAlt?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Understanding Revenue Attribution: A Complete Guide",
    excerpt:
      "Learn how to track which marketing channels actually drive revenue, not just traffic. Discover the difference between vanity metrics and actionable insights.",
    author: "Postmetric Team",
    date: "January 15, 2025",
    readTime: "5 min read",
    category: "Analytics",
    heroImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    heroImageAlt: "Analytics dashboard with charts and metrics",
    body: `Revenue attribution is the practice of assigning credit for a sale or conversion to the marketing touchpoints that influenced it. While many teams focus on traffic and engagement, the real question is: which channels actually bring paying customers?

**Why attribution matters**

Vanity metrics like page views and sessions can be misleading. A campaign might drive thousands of visitors but zero revenue. Revenue attribution helps you see which channels—whether it's organic search, paid ads, or a specific referral—actually contribute to your bottom line.

**First-touch vs. last-touch vs. multi-touch**

- **First-touch** gives full credit to the first channel a customer interacted with. Simple, but it ignores the rest of the journey.
- **Last-touch** credits the final touchpoint before conversion. Often used by default in tools, but can overvalue closing channels.
- **Multi-touch** (linear, time-decay, or position-based) distributes credit across touchpoints. More accurate for longer, complex journeys.

**Getting started**

Start by connecting your payment processor (e.g. Stripe) to your analytics. Map revenue to the same sessions and campaigns you already track. Once you see revenue by channel, you can shift budget and focus to what actually drives revenue—not just traffic.`,
  },
  {
    id: 2,
    title: "Why Cookie-Free Analytics Matter in 2025",
    excerpt:
      "Privacy regulations are changing how we track users. Discover why cookie-free analytics are the future and how they can improve your data accuracy.",
    author: "Postmetric Team",
    date: "January 10, 2025",
    readTime: "4 min read",
    category: "Privacy",
    heroImage:
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80",
    heroImageAlt: "Privacy and data protection concept",
    body: `Privacy regulations and browser changes are making traditional cookie-based tracking less reliable. Cookie-free analytics aren't just a compliance checkbox—they can give you cleaner, more accurate data.

**The cookie landscape in 2025**

Third-party cookies are being phased out by major browsers. Even first-party cookies face stricter consent rules in many regions. Relying on cookies means missing a growing share of traffic and skewing your data toward users who don't block or clear them.

**How cookie-free analytics work**

Cookie-free approaches use first-party data, server-side collection, and probabilistic methods that don't depend on persistent identifiers. You still get sessions, page views, referrers, and conversion signals—without storing personal data or requiring consent banners for basic analytics.

**Benefits beyond compliance**

- **Better accuracy**: Fewer gaps from blocked or rejected cookies.
- **Simpler compliance**: Less personal data, fewer consent edge cases.
- **Future-proofing**: Works as browsers and regulations evolve.

If you're still relying only on cookie-based tools, 2025 is the year to add a cookie-free layer to your analytics stack.`,
  },
  {
    id: 3,
    title: "5 Marketing Channels That Drive Real Revenue",
    excerpt:
      "Stop guessing which channels work. We analyzed data from 1,000+ businesses to identify the marketing channels that consistently drive paying customers.",
    author: "Postmetric Team",
    date: "January 5, 2025",
    readTime: "6 min read",
    category: "Marketing",
    heroImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    heroImageAlt: "Marketing analytics and growth",
    body: `We looked at revenue attribution data from over 1,000 businesses to see which marketing channels actually drive paying customers. Here are five that consistently deliver.

**1. Organic search**

Search continues to drive a large share of first-touch and last-touch revenue. Users who find you via search often have clear intent. Invest in content and technical SEO, and track revenue by landing page and keyword (where possible) to double down on what converts.

**2. Paid search (SEM)**

Paid search shows up strongly in last-touch attribution. It's often the final step before purchase. Use revenue data—not just clicks or signups—to set bids and budgets. Tie campaigns to actual revenue to improve ROAS.

**3. Direct / branded**

"Direct" traffic often includes users who already know your brand (e.g. from earlier touchpoints). When you attribute revenue to direct, you're seeing the payoff of brand building. Don't ignore it when allocating budget.

**4. Referrals and partnerships**

Referral and partner links frequently show high conversion rates. Track them with dedicated UTM parameters or subdomains so you can attribute revenue and optimize partnerships.

**5. Email**

Email consistently appears in multi-touch attribution. It nurtures leads and brings them back. Segment by campaign and link email to revenue so you can see which flows and sends actually drive sales.

**What to do next**

Connect your revenue data to these channels in one place. Compare first-touch, last-touch, and multi-touch views to see the full picture and invest where it matters.`,
  },
  {
    id: 4,
    title: "How to Set Up Revenue Tracking in 10 Minutes",
    excerpt:
      "A step-by-step guide to connecting your payment processor and start tracking revenue attribution. Get actionable insights in minutes, not days.",
    author: "Postmetric Team",
    date: "December 28, 2024",
    readTime: "3 min read",
    category: "Tutorial",
    heroImage:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=80",
    heroImageAlt: "Setup and configuration",
    body: `You don't need a complex setup to start tracking revenue by channel. Here's a minimal path to revenue attribution in about 10 minutes.

**Step 1: Connect your payment processor**

In your analytics or attribution tool, connect Stripe (or your payment provider). Use the official integration and grant read-only access to transactions. No code required for the basic link.

**Step 2: Map transactions to visitors**

Your tool should match transactions to website sessions—usually via customer ID or email. Ensure your checkout or signup flow sends that identifier so sessions can be tied to revenue.

**Step 3: Enable revenue by source**

Turn on "revenue by channel" or "revenue attribution" in the dashboard. You should soon see revenue broken down by referrer, campaign, and landing page.

**Step 4: Add UTM (and optional parameters)**

For campaigns, use UTM parameters: source, medium, campaign, and optionally term and content. Consistent naming makes reports readable. Use a URL builder if needed.

**Step 5: Check one report**

Open the revenue-by-channel or attribution report. Confirm that a few test transactions show up under the right source. If something's missing, verify the customer ID or email is passed correctly.

That's it. Once this is in place, you can refine with custom events, goals, and multi-touch models. Start simple and iterate.`,
  },
  {
    id: 5,
    title: "The Hidden Costs of Vanity Metrics",
    excerpt:
      "Page views and sessions don't pay the bills. Learn why focusing on revenue metrics can transform your marketing strategy and bottom line.",
    author: "Postmetric Team",
    date: "December 20, 2024",
    readTime: "5 min read",
    category: "Strategy",
    heroImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    heroImageAlt: "Strategy and business metrics",
    body: `Page views, sessions, and even signups can feel like progress—but they don't pay the bills. Over-relying on vanity metrics has real costs.

**What counts as vanity**

- **Page views**: Easy to inflate with low-intent traffic; no link to revenue.
- **Sessions**: Same issue; one user can generate many sessions.
- **Signups or leads**: Only valuable if they convert to revenue; raw count can mislead.
- **Social likes and shares**: Engagement doesn't equal sales.

**The hidden costs**

- **Budget misallocation**: You pour money into channels that look good on paper but don't drive revenue.
- **Wrong optimizations**: You improve for clicks or signups instead of for paying customers.
- **False confidence**: Big numbers feel good while real performance stays flat or declines.

**Shift to revenue-aware metrics**

- Revenue by channel (first-touch, last-touch, or multi-touch).
- Revenue per session or per visit for key segments.
- Conversion rate to *revenue* (not just to signup).
- Cost per acquisition in dollars, not just leads.

Once you tie reporting and decisions to revenue, you'll see which channels and campaigns actually move the needle—and which are just vanity.`,
  },
  {
    id: 6,
    title: "Building a Privacy-First Analytics Stack",
    excerpt:
      "Compliance doesn't mean sacrificing insights. Discover how to build an analytics stack that respects user privacy while delivering actionable data.",
    author: "Postmetric Team",
    date: "December 15, 2024",
    readTime: "7 min read",
    category: "Privacy",
    heroImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80",
    heroImageAlt: "Secure and private data stack",
    body: `You can build an analytics stack that respects privacy and still delivers the insights you need. Here’s a practical approach.

**Principles of privacy-first analytics**

- **Minimize personal data**: Collect only what you need. Avoid storing PII unless necessary and secure it.
- **Prefer server-side and first-party**: Reduces reliance on third-party scripts and cookies.
- **Document and limit retention**: Define retention periods and stick to them. Anonymize or aggregate where possible.
- **Cookie-free where possible**: Use approaches that don’t depend on third-party cookies so consent and blocking are less of an issue.

**Stack components**

1. **Cookie-free or low-cookie analytics**  
   Use a tool that works without third-party cookies and focuses on aggregates, not individual profiling.

2. **Server-side event collection**  
   Send events from your backend so you control the data and reduce client-side exposure.

3. **Revenue and conversion data**  
   Connect payment data with minimal identifiers (e.g. hashed IDs) so you can attribute revenue without storing raw PII.

4. **Consent and transparency**  
   Where you do use cookies or personal data, integrate consent management and clearly document what you collect and why.

**Outcome**

You get channel performance, revenue attribution, and conversion insights without building a surveillance-style stack. Compliance becomes a natural result of your design, not an afterthought.`,
  },
];

export function getBlogPostById(id: number): BlogPost | undefined {
  return blogPosts.find((post) => post.id === id);
}

export function getBlogPostIds(): number[] {
  return blogPosts.map((post) => post.id);
}

import Link from "next/link";
import { formatTrialPeriod } from "@/lib/config";
import { FAQItem } from "@/components/ui/faq";

export const billingFAQItems: FAQItem[] = [
  {
    id: "starter-growth",
    question: "Starter or Growth?",
    answer: (
      <ul className="list-inside list-disc space-y-1">
        <li className="list-item">
          Starter tier is for 1 website, 1 team member and 3 years of data
          retention. It&apos;s best for solo founders getting started.
        </li>
        <li className="list-item">
          Growth tier is for 30 websites, 30 team members and 5+ years of data
          retention. It also includes advanced features like{" "}
          <Link href="/docs/twitter-mentions" className="link" target="_blank">
            mentions
          </Link>{" "}
          and{" "}
          <Link
            href="/docs/twitter-link-attribution"
            className="link"
            target="_blank"
          >
            link attribution
          </Link>{" "}
          for 𝕏. It&apos;s best for established businesses.
        </li>
      </ul>
    ),
  },
  {
    id: "events",
    question: "10k, 100k, 1M+ events per month?",
    answer: (
      <ul className="list-inside list-disc space-y-1">
        <li className="list-item">
          If you&apos;re just getting started, start with the 10k events per
          month plan.
        </li>
        <li className="list-item">
          If you already have some traffic (couple hundreds of visitors per
          day), go for the 100k/200k events per month plan.
        </li>
        <li className="list-item">
          If you have a lot of traffic (1k+ visitors per day), go for 1M+ events
          per month.
        </li>
      </ul>
    ),
  },
  {
    id: "more-events",
    question: "What happens if I get more events than my plan?",
    answer: (
      <>
        <p>
          No worries! We&apos;ll continue tracking your events, but you&apos;ll
          need to upgrade to a larger plan to access your dashboard.
        </p>
        <p>Congrats on all the traffic btw!</p>
      </>
    ),
  },
  {
    id: "free-trial",
    question: "Is there a free trial?",
    answer: (
      <p>
        Yep! You can try PostMetric for free for {formatTrialPeriod()} and you
        don&apos;t even need a credit card!
      </p>
    ),
  },
  {
    id: "gdpr",
    question: "Is PostMetric GDPR compliant?",
    answer: (
      <>
        <p>Yes, PostMetric is GDPR compliant.</p>
        <p>
          We prioritize data privacy and security, ensuring that all data we
          collect is processed in accordance with GDPR regulations.
        </p>
        <p>
          As a PostMetric user, you&apos;ll need to obtain explicit consent from
          your website visitors for data collection.
        </p>
        <p>
          You can read more about GDPR compliance in our{" "}
          <Link className="link" href="/tos">
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "make-money",
    question: "Do I need to make money to use PostMetric?",
    answer: (
      <p>
        Not at all! You can use PostMetric to get insights about your traffic.
      </p>
    ),
  },
  {
    id: "need-code",
    question: "Do I need to code to use PostMetric?",
    answer: (
      <>
        <p>
          You don&apos;t need to code to use PostMetric! You can set up the web
          analytics and revenue data in just 2 minutes.
        </p>
        <p>
          And we offer no-code solutions for advanced features like revenue
          attribution.
        </p>
      </>
    ),
  },
  {
    id: "migrate-data",
    question: "Can I migrate my existing data?",
    answer: (
      <p>
        Yes! For now, you can import your data from Plausible.io. Next is Google
        Analytics.
      </p>
    ),
  },
  {
    id: "seo-keywords",
    question: "Can I see SEO keywords that drive traffic to my website?",
    answer: (
      <>
        <p>
          Yes! You can connect{" "}
          <Link
            href="/docs/google-search-console"
            className="link"
            target="_blank"
          >
            Google Search Console
          </Link>{" "}
          to see keywords that drive traffic to your website.
        </p>
        <p>
          With{" "}
          <Link
            href="docs/revenue-attribution-guide"
            className="link"
            target="_blank"
          >
            revenue attribution
          </Link>{" "}
          enabled, you can even estimate which keywords drive the most revenue.
        </p>
      </>
    ),
  },
  {
    id: "payment-providers",
    question: "Which payment providers are supported?",
    answer: (
      <p>
        We offer native integration with Stripe, LemonSqueezy, Polar, and
        Shopify (and yes, you can connect multiple payment providers).
        <br />
        You can also use our{" "}
        <Link className="link" href="/docs/api-create-payment">
          Payment API
        </Link>{" "}
        to send your payment data to PostMetric.
      </p>
    ),
  },
  {
    id: "subdomains",
    question: "Does PostMetric track across subdomains?",
    answer: (
      <>
        <p>
          Yes, PostMetric tracks across any subdomains for maximum accuracy.
        </p>
        <p>
          Simply create a PostMetric website under your root domain (e.g.,
          example.com) and install the tracking script on any subdomains (e.g.,
          app.example.com, blog.example.com) you want to track.
        </p>
        <p>
          This ensures you get unified analytics across your entire domain
          ecosystem without any gaps in your data.
        </p>
      </>
    ),
  },
  {
    id: "different-domains",
    question: "Does PostMetric track across different domains?",
    answer: (
      <>
        <p>
          Yes! Create a PostMetric website under your root domain (e.g.,
          marketing.com) and add the other domains you want to track to the
          allowed hostnames (e.g., app.com).
        </p>
        <p>
          To get started, check out our{" "}
          <Link
            href="/docs/cross-domain-tracking"
            className="link"
            target="_blank"
          >
            cross-domain tracking documentation
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "api",
    question: "Does PostMetric have an API?",
    answer: (
      <p>
        Yes,{" "}
        <Link className="link" href="/docs/api-introduction">
          PostMetric has an API.
        </Link>
      </p>
    ),
  },
  {
    id: "team",
    question: "Can I invite my team to PostMetric?",
    answer: (
      <>
        <p>Yes! You can have unlimited team members on PostMetric.</p>
        <p>
          You can invite your team to PostMetric by sharing the link to the
          dashboard with them.
        </p>
      </>
    ),
  },
  {
    id: "affiliate",
    question: "Do you have an affiliate program?",
    answer: (
      <>
        Yep! You get 50% commission for every payments (up to 12 months). You
        can{" "}
        <Link
          className="link"
          href="https://postmetric.getrewardful.com/signup"
          target="_blank"
        >
          sign-up here
        </Link>
      </>
    ),
  },
  {
    id: "another-question",
    question: "I have another question",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Cool, send me{" "}
        <Link
          target="_blank"
          className="link"
          href="mailto:marc@postmetric.com?subject=PostMetric%20Question"
        >
          an email
        </Link>
      </div>
    ),
  },
];

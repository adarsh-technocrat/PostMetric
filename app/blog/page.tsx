import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterSubscription } from "@/components/landing/NewsletterSubscription";
import Link from "next/link";

const blogPosts = [
  {
    id: 1,
    title: "Understanding Revenue Attribution: A Complete Guide",
    excerpt:
      "Learn how to track which marketing channels actually drive revenue, not just traffic. Discover the difference between vanity metrics and actionable insights.",
    author: "Postmetric Team",
    date: "January 15, 2025",
    readTime: "5 min read",
    category: "Analytics",
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
  },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen  antialiased font-sans">
      <Navbar />
      <main className="items-center w-full max-w-4xl border-x border-stone-200 flex flex-col bg-white">
        {/* Hero Section */}
        <div className="w-full px-6 lg:px-12 py-16 lg:py-24 border-b border-stone-200">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-600 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Latest Insights
            </div>
            <h1 className="font-cooper text-[32px] lg:text-[48px] leading-tight text-stone-900">
              The Postmetric Blog
            </h1>
            <p className="text-stone-500 text-lg lg:text-xl leading-relaxed max-w-xl">
              Learn how to track revenue, understand your customers, and grow
              your business with actionable analytics insights.
            </p>
            <div className="mt-6 w-full max-w-md">
              <NewsletterSubscription />
            </div>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group flex flex-col gap-4 p-6 bg-white hover:bg-stone-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-xs font-mono uppercase text-stone-600 bg-stone-100 border border-stone-200">
                    {post.category}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-xl lg:text-2xl font-cooper text-stone-900 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-stone-500 leading-relaxed text-sm lg:text-base">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-stone-700">
                      {post.author}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {post.date}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-stone-400 group-hover:text-brand-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

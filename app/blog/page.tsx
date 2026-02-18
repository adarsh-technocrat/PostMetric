import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterSubscription } from "@/components/landing/NewsletterSubscription";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-data";

export default function BlogPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col gap-20 lg:gap-30`}
      >
        <div className="flex flex-col w-full">
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
                Insights that turn into action—revenue, channels, and clear next
                steps to convert more visitors into paying customers.
              </p>
              <div className="mt-6 w-full max-w-md">
                <NewsletterSubscription />
              </div>
            </div>
          </div>

          <div className="w-full border-b border-stone-200">
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
        </div>

        <Footer />
      </main>
    </div>
  );
}

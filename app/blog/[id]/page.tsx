import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterSubscription } from "@/components/landing/NewsletterSubscription";
import { getBlogPostById, getBlogPostIds } from "@/lib/blog-data";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BlogBody({ body }: { body: string }) {
  const paragraphs = body.trim().split(/\n\n+/);
  return (
    <div className="flex flex-col gap-6">
      {paragraphs.map((paragraph, i) => {
        const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-stone-600 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-stone-800">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

export async function generateStaticParams() {
  return getBlogPostIds().map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getBlogPostById(Number(id));
  if (!post) return { title: "Post not found | Postmetric Blog" };
  return {
    title: `${post.title} | Postmetric Blog`,
    description: post.excerpt,
    openGraph: post.heroImage
      ? {
          images: [
            { url: post.heroImage, alt: post.heroImageAlt ?? post.title },
          ],
        }
      : undefined,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getBlogPostById(Number(id));
  if (!post) notFound();

  return (
    <div className="flex flex-col w-full items-center min-h-screen antialiased font-sans">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-white`}
      >
        <article className="w-full border-b border-stone-200">
          <div className="px-6 lg:px-12 pt-10 lg:pt-14">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors mb-6"
            >
              <BackIcon className="h-4 w-4" />
              Back to blog
            </Link>
          </div>

          {post.heroImage ? (
            <div className="relative w-full aspect-21/9 min-h-[240px] overflow-hidden bg-stone-200">
              <Image
                src={post.heroImage}
                alt={post.heroImageAlt ?? post.title}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                priority
              />
              <div
                className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-10">
                <h1 className="font-cooper text-2xl lg:text-4xl leading-tight text-white drop-shadow-sm">
                  {post.title}
                </h1>
                <p className="mt-2 text-sm text-stone-200">
                  {post.author}
                  <span className="mx-1.5">·</span>
                  <time dateTime={post.date}>{post.date}</time>
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 lg:px-12">
              <h1 className="font-cooper text-[28px] lg:text-[40px] leading-tight text-stone-900 mb-2">
                {post.title}
              </h1>
              <p className="text-sm text-stone-500 mb-10">
                {post.author}
                <span className="mx-1.5">·</span>
                <time dateTime={post.date}>{post.date}</time>
              </p>
            </div>
          )}

          <div className="max-w-2xl mx-auto px-6 lg:px-12 pb-10 lg:pb-14">
            <div className="flex flex-wrap items-center gap-3 mb-8 mt-8">
              <span className="px-2 py-1 rounded text-xs font-mono uppercase text-stone-600 bg-stone-100 border border-stone-200">
                {post.category}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {post.readTime}
              </span>
            </div>

            <div className="prose prose-stone max-w-none">
              <BlogBody body={post.body} />
            </div>
          </div>
        </article>

        <div className="w-full px-6 lg:px-12 py-12 lg:py-16 border-b border-stone-200 bg-stone-900">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-cooper text-2xl lg:text-3xl text-white leading-tight mb-3">
              Ready to turn your analytics into action?
            </h2>
            <p className="text-stone-300 text-base lg:text-lg leading-relaxed mb-8">
              Join 1,000+ makers who use Postmetric to see their data and get
              clear next steps—so you know what to do to convert more visitors
              into paying customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link
                href="/dashboard/new"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-white bg-white text-stone-900 px-6 py-3 rounded text-xs hover:bg-stone-100 transition-all w-full sm:w-auto"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-600 bg-transparent text-white px-6 py-3 rounded text-xs hover:bg-stone-800 transition-all w-full sm:w-auto"
              >
                View pricing
              </Link>
            </div>
            <p className="text-stone-500 text-xs mt-4">
              No credit card required · Free tier available
            </p>
          </div>
        </div>

        <div className="w-full px-6 lg:px-12 py-12 lg:py-16 border-b border-stone-200 bg-stone-50/50">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-cooper text-xl lg:text-2xl text-stone-900 mb-2">
              Get more insights in your inbox
            </h2>
            <p className="text-stone-500 text-sm lg:text-base mb-6">
              Practical analytics and revenue tips. No spam.
            </p>
            <NewsletterSubscription />
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

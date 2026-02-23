"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const gmailInboxUrl = `https://mail.google.com/mail/u/0/#inbox`;

  return (
    <div className="flex min-h-screen bg-stone-50 antialiased font-sans">
      <section className="flex w-full flex-col items-center justify-center px-4 py-16 md:px-8">
        <div className="w-full max-w-lg space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors font-mono text-xs uppercase font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M14 8a.75.75 0 0 1-.75.75H4.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
                clipRule="evenodd"
              />
            </svg>
            Sign in
          </Link>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-center gap-2 border-b border-stone-200 px-8 py-6">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/icon.svg"
                  alt="Postmetric Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <span className="text-xl font-bold text-stone-800 tracking-tight">
                  Postmetric
                </span>
              </Link>
            </div>

            <div className="space-y-6 p-6 text-center md:p-12">
              <h1 className="text-2xl font-cooper text-stone-900 lg:text-3xl lg:tracking-tight">
                Magic Link Sent ✨
              </h1>
              <p className="text-sm text-stone-500 leading-relaxed lg:text-base">
                Check your inbox for{" "}
                <span className="font-medium text-stone-800">{email}</span> and
                click the link to sign in!
              </p>

              <div className="space-y-2">
                <a
                  href={gmailInboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded border border-stone-800 bg-stone-800 px-4 py-3 text-xs font-semibold font-mono uppercase text-white hover:bg-stone-700 transition-colors"
                >
                  Open Email Inbox
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500">
            Check spam, just in case. If you need help,{" "}
            <a
              href="mailto:support@postmetric.io?subject=Postmetric%20Sign-In%20Help"
              className="text-stone-800 hover:text-stone-900 underline underline-offset-2"
            >
              contact us
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-stone-50 items-center justify-center">
          <div className="text-stone-500 font-mono text-sm">Loading...</div>
        </div>
      }
    >
      <VerifyRequestContent />
    </Suspense>
  );
}

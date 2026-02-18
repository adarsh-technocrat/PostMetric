"use client";

import Link from "next/link";
import { useId } from "react";
import { LANDING_MAX_W } from "@/lib/landing-layout";

function SquiggleIcon({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 219 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#squiggle-clip-${id})`}>
        <path
          d="M21.489 29.4305C36.9333 31.3498 51.3198 33.0559 65.7063 34.9753C66.7641 35.1885 67.6104 36.4681 69.9376 38.3875C63.1675 39.2406 57.8783 40.3069 52.5892 40.5201C38.6259 40.9467 24.8741 40.9467 10.9107 40.9467C9.21821 40.9467 7.5257 41.1599 5.83317 40.7334C0.332466 39.6671 -1.57164 36.0416 1.39028 31.1365C2.87124 28.7906 4.56377 26.658 6.46786 24.7386C13.6611 17.4876 21.0659 10.4499 28.4707 3.41224C29.7401 2.13265 31.6442 1.49285 34.183 0C34.6061 10.8765 23.8162 13.8622 21.489 22.3927C23.3931 21.9662 25.0856 21.7529 26.5666 21.3264C83.6894 5.54486 140.601 7.25099 197.3 22.606C203.224 24.0988 208.936 26.4447 214.649 28.5773C217.61 29.6437 220.149 31.9896 218.457 35.6151C216.976 39.2406 214.014 39.2406 210.629 37.7477C172.759 20.6866 132.561 18.7672 91.9404 19.407C70.7838 19.6203 50.0504 21.9662 29.5285 26.8713C26.9897 27.5111 24.4509 28.3641 21.489 29.4305Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={`squiggle-clip-${id}`}>
          <rect width="219" height="41" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function DashboardPreview() {
  return (
    <div className="px-4 lg:px-6 pb-20">
      <div
        className={`w-full ${LANDING_MAX_W} mx-auto rounded-[1.3rem] border border-stone-200 bg-stone-100/50 dark:bg-stone-800/30 dark:border-stone-700 p-1.5`}
      >
        <div className="relative hidden md:block">
          <div className="absolute -top-4 right-4 flex -translate-y-full animate-pulse items-center gap-2">
            <SquiggleIcon className="mt-2 w-8 -rotate-[24deg] opacity-60 text-stone-400 dark:text-stone-500" />
            <span className="text-stone-500 dark:text-stone-400 text-sm font-medium">
              Interactive demo
            </span>
          </div>

          <div
            className="group relative mx-auto flex aspect-[5/3.6] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white dark:bg-stone-900 dark:border-stone-700 shadow-card"
            id="demo-container"
          >
            <div className="relative z-10 flex w-full items-center bg-white dark:bg-stone-900 px-4 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-start gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="w-full text-center text-sm">
                <span className="text-stone-400 dark:text-stone-500">
                  https://postmetric.io/
                </span>
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  demo
                </span>
              </div>
              <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 md:flex items-center justify-center">
                <Link
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
                  title="Open demo in new tab"
                  aria-label="Open demo in new tab"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-[18px]"
                  >
                    <path d="m13.28 7.78 3.22-3.22v2.69a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.69l-3.22 3.22a.75.75 0 0 0 1.06 1.06ZM2 17.25v-4.5a.75.75 0 0 1 1.5 0v2.69l3.22-3.22a.75.75 0 0 1 1.06 1.06L4.56 16.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.747.747 0 0 1-.75-.75ZM12.22 13.28l3.22 3.22h-2.69a.75.75 0 0 0 0 1.5h4.5a.747.747 0 0 0 .75-.75v-4.5a.75.75 0 0 0-1.5 0v2.69l-3.22-3.22a.75.75 0 1 0-1.06 1.06ZM3.5 4.56l3.22 3.22a.75.75 0 0 0 1.06-1.06L4.56 3.5h2.69a.75.75 0 0 0 0-1.5h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V4.56Z" />
                  </svg>
                </Link>
              </div>
            </div>

            <iframe
              src="/demo"
              className="w-full flex-1 min-h-0 bg-stone-50 dark:bg-stone-800 border-0"
              width={1000}
              height={1000}
              title="PostMetric Analytics Dashboard Demo"
              aria-label="Interactive demo showing PostMetric analytics dashboard with revenue tracking and marketing insights"
              loading="lazy"
            />
          </div>

          <div className="absolute -bottom-5 left-1/2 flex -translate-x-[15%] translate-y-full items-center gap-0">
            <SquiggleIcon className="fill-current -mt-14 w-11 rotate-[50deg] scale-y-[-1] opacity-60 text-stone-400 dark:text-stone-500" />
            <span className="text-stone-500 dark:text-stone-400 text-center text-sm font-medium leading-tight">
              Try this ✨
              <br />
              (people are addicted)
            </span>
          </div>
        </div>

        <div className="md:hidden">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:bg-stone-900 dark:border-stone-700 shadow-card">
            <div className="flex items-center border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-400" />
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>
              <span className="ml-2 text-xs text-stone-500 dark:text-stone-400 truncate flex-1 text-center">
                postmetric.io/demo
              </span>
            </div>
            <iframe
              src="/demo"
              className="w-full h-[320px] bg-stone-50 dark:bg-stone-800 border-0"
              title="PostMetric Dashboard Demo"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

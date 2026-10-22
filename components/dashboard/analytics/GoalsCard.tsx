"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

export interface GoalRow {
  name: string;
  completions: number | null;
  uniqueConverters: number | null;
  /** Percent (0-100) of period visitors who converted. */
  conversionRate: number | null;
}

interface GoalsCardProps {
  selectedTab: "Goal" | "Funnel" | "Journey";
  onTabChange: (tab: "Goal" | "Funnel" | "Journey") => void;
  readOnly?: boolean;
  /** Goals for the selected period (from the goals breakdown). */
  goals?: GoalRow[];
  loading?: boolean;
  error?: string | null;
}

const formatCount = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US");

const formatRate = (n: number | null) =>
  n == null
    ? "—"
    : `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

const GOAL_TABS = ["Goal", "Funnel", "Journey"] as const;

export function GoalsCard({
  selectedTab,
  onTabChange,
  readOnly = false,
  goals = [],
  loading = false,
  error = null,
}: GoalsCardProps) {
  const sortedGoals = [...goals].sort(
    (a, b) => (b.completions ?? -1) - (a.completions ?? -1),
  );
  const maxCompletions = Math.max(
    0,
    ...sortedGoals.map((g) => g.completions ?? 0),
  );
  const showGoals = selectedTab === "Goal" && sortedGoals.length > 0;

  return (
    <section className="custom-card w-full max-w-full" id="CustomEvent">
      <div className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-x-2 px-0 py-1">
          <div className="mr-px flex flex-1 min-w-0">
            <div className="flex w-full items-center border-b border-stone-200">
              <Tabs
                value={selectedTab}
                onValueChange={(v) =>
                  onTabChange(v as "Goal" | "Funnel" | "Journey")
                }
                className="w-full"
              >
                <TabsList className="z-5 inline-flex h-auto w-full flex-1 justify-start items-center gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-sm shadow-none">
                  {GOAL_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        {tab}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-1 pb-1">
                  <Link
                    href="/docs/custom-goals"
                    target="_blank"
                    className="inline-flex h-auto flex-nowrap items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-textPrimary hover:bg-stone-100"
                  >
                    <span className="inline-block truncate">Add goal</span>
                    <Plus className="size-3.5 opacity-60" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {showGoals ? (
          <div className="relative h-96 overflow-y-auto" aria-busy={loading}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-textSecondary">
                  <th className="px-3 py-2 font-medium">Goal</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Completions
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Unique converters
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Conversion rate
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? "opacity-50" : undefined}>
                {sortedGoals.map((goal) => (
                  <tr key={goal.name} className="relative">
                    <td className="relative px-3 py-2">
                      {maxCompletions > 0 && goal.completions != null && (
                        <div
                          className="absolute inset-y-1 left-0 rounded bg-indigo-50"
                          style={{
                            width: `${(goal.completions / maxCompletions) * 100}%`,
                          }}
                          aria-hidden
                        />
                      )}
                      <span className="relative truncate font-medium text-textPrimary">
                        {goal.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-textPrimary">
                      {formatCount(goal.completions)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-textPrimary">
                      {formatCount(goal.uniqueConverters)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-textPrimary">
                      {formatRate(goal.conversionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedTab === "Goal" && loading ? (
          <div className="relative flex h-96 items-center justify-center">
            <Spinner className="size-5 text-textSecondary" />
          </div>
        ) : selectedTab === "Goal" && error ? (
          <div className="relative flex h-96 items-center justify-center px-4 text-center text-sm text-textSecondary">
            Couldn&apos;t load goals. {error}
          </div>
        ) : (
          <div className="relative h-96">
            <div className="relative flex h-full flex-col items-center justify-center gap-6">
              <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg bg-white/20 px-4 py-2 text-center font-medium text-textPrimary backdrop-blur">
                <p className="font-semibold">
                  Track what visitors do on your site
                </p>
                {!readOnly && (
                  <div className="flex justify-center">
                    <Button variant="stone" size="sm" asChild>
                      <Link href="/docs/custom-goals" target="_blank">
                        <Plus className="size-4" />
                        Add goal
                      </Link>
                    </Button>
                  </div>
                )}
                <p className="text-textSecondary mx-auto max-w-md pt-4 text-center text-sm font-normal">
                  Revenue-related goals are automatically tracked with{" "}
                  <Link
                    href="/docs/revenue-attribution-guide"
                    className="link hover:text-primary"
                    target="_blank"
                  >
                    revenue attribution
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

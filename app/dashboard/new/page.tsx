"use client";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe,
  Loader2,
  Info,
  CheckCircle2,
  Search,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { createNewWebsiteWithDomain } from "@/store/slices/websitesSlice";
import { DomainLogo } from "@/components/ui/domain-logo";
import timezones, { type TimeZone } from "timezones-list";

const HEADER_GAP_HEIGHT = "h-14";
const STEPPER_ITEM_GAP = "pt-10";

function domainToName(domain: string): string {
  return domain.replace(/^www\./, "").split(".")[0];
}

function TimezoneSelect({
  value,
  onChange,
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  filteredList,
  containerRef,
  searchInputRef,
}: {
  value: string;
  onChange: (tzCode: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filteredList: TimeZone[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const selected = useMemo(
    () => timezones.find((t) => t.tzCode === value),
    [value],
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-stone-700">Region</Label>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => onOpenChange(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-left text-sm text-stone-800 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:ring-offset-0"
        >
          <span className="truncate">
            {selected?.name ?? "Select timezone"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
        </button>
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
            <div className="border-b border-stone-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search timezone..."
                  className="h-9 w-full rounded-md border border-stone-200 bg-stone-50/50 pl-8 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-200"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      onOpenChange(false);
                      onSearchChange("");
                    }
                  }}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto overscroll-contain p-1">
              {filteredList.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500">
                  No timezones found
                </p>
              ) : (
                filteredList.map((tz) => (
                  <button
                    key={tz.tzCode}
                    type="button"
                    onClick={() => {
                      onChange(tz.tzCode);
                      onOpenChange(false);
                      onSearchChange("");
                    }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      value === tz.tzCode
                        ? "bg-stone-100 text-stone-800 font-medium"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {tz.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-stone-500">
        Defines &quot;today&quot; and report time in your timezone.
      </p>
    </div>
  );
}

export default function AddSitePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [domain, setDomain] = useState("");
  const [timezone, setTimezone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const timezoneSearchRef = useRef<HTMLInputElement>(null);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return timezones;
    const q = timezoneSearch.toLowerCase().trim();
    return timezones.filter(
      (t) =>
        t.tzCode.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q),
    );
  }, [timezoneSearch]);

  useEffect(() => {
    if (!timezoneOpen) return;
    setTimezoneSearch("");
    setTimeout(() => timezoneSearchRef.current?.focus(), 0);
  }, [timezoneOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(e.target as Node)
      ) {
        setTimezoneOpen(false);
      }
    }
    if (timezoneOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [timezoneOpen]);

  async function handleAddWebsite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const domainValue = domain || (formData.get("domain") as string);
    if (!domainValue || typeof domainValue !== "string") return;

    setIsSubmitting(true);
    try {
      const website = await dispatch(
        createNewWebsiteWithDomain({
          domain: domainValue,
          name: domainToName(domainValue),
        }),
      ).unwrap();
      toast.success("Website added", {
        description: "Redirecting to analytics…",
      });
      router.push(`/dashboard/${website._id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create website";
      toast.error("Couldn't add website", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="w-full max-w-7xl flex flex-col bg-transparent">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 lg:gap-x-8 items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center h-full min-h-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100">
            <Globe className="h-7 w-7 text-stone-600" />
          </div>
          <div className="w-px flex-1 min-h-8 bg-stone-200 mt-1" />
        </div>
        <div className="min-w-0 flex flex-col pb-0">
          <header className="pt-0.5 shrink-0">
            <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
              Add website
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Use a domain you own to track analytics and attribute revenue.
            </p>
          </header>
          <div className={`${HEADER_GAP_HEIGHT} shrink-0`} aria-hidden />
        </div>

        <div className="flex w-14 shrink-0 flex-col items-center h-full min-h-0 -mt-px overflow-visible">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-800 bg-stone-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="w-px flex-1 min-h-8 bg-stone-200 my-0.5 -mb-10" />
        </div>
        <div className="min-w-0">
          <section>
            <h2 className="text-base font-semibold text-stone-800 mb-1">
              Domain
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              Domain name and region for your analytics and tracking.
            </p>

            <form onSubmit={handleAddWebsite} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="domain"
                  className="text-sm font-medium text-stone-700"
                >
                  Name
                </Label>
                <div className="flex w-full items-center rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-stone-200 focus-within:border-stone-400 transition-colors">
                  <div className="inline-flex select-none items-center justify-center gap-2 border-r border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-500">
                    {domain ? (
                      <DomainLogo
                        domain={domain}
                        size={20}
                        className="h-5 w-5 shrink-0 rounded drop-shadow-sm"
                        fallback={
                          <Globe className="size-4 shrink-0 text-stone-400" />
                        }
                      />
                    ) : (
                      <Globe className="size-4 shrink-0 text-stone-400" />
                    )}
                    <span>https://</span>
                  </div>
                  <Input
                    id="domain"
                    name="domain"
                    type="text"
                    placeholder="updates.example.com"
                    required
                    autoComplete="off"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm bg-white text-stone-800 placeholder:text-stone-400"
                  />
                  <div className="pr-3 text-stone-400">
                    <Info className="h-4 w-4" aria-hidden />
                  </div>
                </div>
              </div>

              <TimezoneSelect
                value={timezone}
                onChange={setTimezone}
                isOpen={timezoneOpen}
                onOpenChange={setTimezoneOpen}
                searchQuery={timezoneSearch}
                onSearchChange={setTimezoneSearch}
                filteredList={filteredTimezones}
                containerRef={timezoneDropdownRef}
                searchInputRef={timezoneSearchRef}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className={buttonVariants({
                  size: "default",
                  className:
                    "w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-white font-medium shadow-sm disabled:opacity-70 disabled:pointer-events-none",
                })}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  "+ Add website"
                )}
              </button>
            </form>
          </section>
        </div>

        <div
          className={`flex w-14 shrink-0 flex-col items-center h-full min-h-0 overflow-visible border-t border-stone-100 ${STEPPER_ITEM_GAP}`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 bg-white" />
          <div className="w-px flex-1 min-h-8 bg-stone-200 my-0.5 -mb-10" />
        </div>
        <section
          className={`min-w-0 ${STEPPER_ITEM_GAP} border-t border-stone-100`}
        >
          <h3 className="text-sm font-semibold text-stone-500">
            Install script
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            After adding your domain, you’ll get a tracking script to add to
            your site.
          </p>
        </section>

        <div
          className={`flex w-14 shrink-0 flex-col items-center h-full min-h-0 border-t border-stone-100 ${STEPPER_ITEM_GAP}`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 bg-white" />
        </div>
        <section
          className={`min-w-0 ${STEPPER_ITEM_GAP} border-t border-stone-100`}
        >
          <h3 className="text-sm font-semibold text-stone-500">
            Attribute revenue{" "}
            <span className="font-normal text-stone-400">(Optional)</span>
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            Connect payment providers or add revenue events to attribute revenue
            to your traffic and campaigns.
          </p>
        </section>
      </div>

      <footer className="mt-10 text-center text-xs text-stone-500">
        Need help?{" "}
        <a
          href="mailto:support@postmetric.com?subject=Need help with PostMetric installation"
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 hover:text-stone-800 underline underline-offset-2"
        >
          support@postmetric.com
        </a>
      </footer>
    </main>
  );
}

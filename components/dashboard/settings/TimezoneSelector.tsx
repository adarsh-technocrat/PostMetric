"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import timezones from "timezones-list";

const ALL_TIMEZONES = timezones.map((t) => t.tzCode);

function formatTimezoneName(timezone: string): string {
  return timezone.replace(/_/g, " ");
}

function getTimezoneTime(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(now);
  } catch {
    return "N/A";
  }
}

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function TimezoneSelector({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: TimezoneSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [currentTime, setCurrentTime] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getTimezoneTime(value));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close dropdown on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const filteredTimezones = React.useMemo(() => {
    if (!searchQuery) return ALL_TIMEZONES;
    const lowerQuery = searchQuery.toLowerCase();
    return ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  const handleTimezoneSelect = (timezone: string) => {
    onChange(timezone);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full" ref={dropdownRef}>
        <div
          onClick={() => !disabled && setOpen(!open)}
          className={`flex w-full items-center justify-between border border-border bg-background px-4 py-2 text-sm transition-colors duration-100 rounded-md ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-border/80"
          }`}
        >
          <div className="flex-1 select-none truncate">
            <div className="flex items-center justify-between">
              <span>{formatTimezoneName(value)}</span>
              <span className="ml-2 text-muted-foreground/60">
                <span>where time is</span> {currentTime}
              </span>
            </div>
          </div>
        </div>

        {open && (
          <div className="absolute z-[9999] mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg ring-1 ring-border/20">
            <div className="relative">
              <input
                ref={inputRef}
                className="w-full rounded-b-none border-0 bg-transparent px-4 py-2 pl-9 text-sm placeholder:opacity-60 focus:outline-none focus:ring-0"
                placeholder="Search timezone..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredTimezones.length > 0) {
                    handleTimezoneSelect(filteredTimezones[0]);
                  }
                }}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground opacity-80" />
              </div>
            </div>

            <div className="max-h-60 overflow-auto overscroll-y-contain border-t border-t-border/30">
              {filteredTimezones.map((timezone) => (
                <Button
                  key={timezone}
                  type="button"
                  variant="ghost"
                  onClick={() => handleTimezoneSelect(timezone)}
                  className={`block w-full px-4 py-1.5 text-left text-sm ${
                    value === timezone ? "bg-accent" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {formatTimezoneName(timezone)}
                    </span>
                    <span className="ml-2 text-muted-foreground/60">
                      {getTimezoneTime(timezone)}
                    </span>
                  </div>
                </Button>
              ))}
              {filteredTimezones.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No timezones found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {onSubmit && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            disabled={disabled}
            onClick={onSubmit}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

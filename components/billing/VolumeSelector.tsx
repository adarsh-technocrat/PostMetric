"use client";

import type { VolumeKey } from "@/lib/billing/pricing-tiers";
import {
  SELECTABLE_VOLUME_KEYS,
  SELECTABLE_VOLUME_TIERS,
} from "@/lib/billing/pricing-tiers";
import { Button } from "@/components/ui/button";

interface VolumeSelectorProps {
  value: VolumeKey;
  onChange: (volume: VolumeKey) => void;
  /** When true, hides the default label (useful when parent provides its own) */
  hideLabel?: boolean;
}

const MIN_VOLUME: VolumeKey = "10K";

export function VolumeSelector({
  value,
  onChange,
  hideLabel,
}: VolumeSelectorProps) {
  const displayValue = value === "1K" || value === "5K" ? MIN_VOLUME : value;
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!hideLabel && (
        <p className="text-stone-500 font-normal text-xs sm:text-sm">
          Select your monthly event volume
        </p>
      )}

      {/* Desktop: Scale with ticks */}
      <div className="hidden sm:flex flex-col items-center gap-4 w-full">
        <div className="flex items-center justify-center w-full">
          <div
            className="grid w-full justify-around relative isolate"
            style={{
              gridTemplateColumns: `repeat(${SELECTABLE_VOLUME_KEYS.length}, minmax(0, 1fr))`,
            }}
          >
            {SELECTABLE_VOLUME_KEYS.map((volume) => (
              <Button
                key={volume}
                type="button"
                variant="ghost"
                onClick={() => onChange(volume)}
                className="relative flex flex-col items-center justify-items-start cursor-pointer group gap-1 w-full h-auto py-0 min-w-0"
              >
                <p
                  className={`text-xs transition-colors duration-200 leading-5 truncate ${
                    displayValue === volume
                      ? "text-brand-600 font-semibold scale-110"
                      : "text-stone-500 group-hover:text-brand-600 font-normal group-hover:font-medium"
                  }`}
                >
                  {volume}
                </p>
                <div className="flex items-center justify-center h-6 min-h-6">
                  <div
                    className={`w-[2px] shrink-0 transition-all duration-200 rounded-full ${
                      displayValue === volume
                        ? "bg-stone-800 h-6"
                        : "bg-stone-300 h-3 group-hover:bg-stone-500 group-hover:h-4"
                    }`}
                  />
                </div>
              </Button>
            ))}
            <div className="col-span-full w-full absolute bottom-2.5 -z-10">
              <div className="h-0.5 bg-stone-200 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Dropdown */}
      <div className="sm:hidden w-full max-w-xs mx-auto">
        <select
          value={displayValue}
          onChange={(e) => onChange(e.target.value as VolumeKey)}
          className="w-full py-2.5 px-3 text-sm rounded-lg border border-stone-300 bg-white outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-300"
        >
          {SELECTABLE_VOLUME_TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type VolumeKey =
  | "1K"
  | "5K"
  | "10K"
  | "25K"
  | "50K"
  | "75K"
  | "100K"
  | "250K"
  | "500K"
  | "750K"
  | "1M"
  | "2M"
  | "5M"
  | "10M+";

export interface VolumeTier {
  key: VolumeKey;
  events: number;
  label: string;
  starterMonthly: number;
  growthMonthly: number;
}

export const VOLUME_TIERS: VolumeTier[] = [
  {
    key: "1K",
    events: 1_000,
    label: "1k monthly events",
    starterMonthly: 5,
    growthMonthly: 12,
  },
  {
    key: "5K",
    events: 5_000,
    label: "5k monthly events",
    starterMonthly: 5,
    growthMonthly: 12,
  },
  {
    key: "10K",
    events: 10_000,
    label: "10k monthly events",
    starterMonthly: 5,
    growthMonthly: 12,
  },
  {
    key: "25K",
    events: 25_000,
    label: "25k monthly events",
    starterMonthly: 15,
    growthMonthly: 40,
  },
  {
    key: "50K",
    events: 50_000,
    label: "50k monthly events",
    starterMonthly: 25,
    growthMonthly: 65,
  },
  {
    key: "75K",
    events: 75_000,
    label: "75k monthly events",
    starterMonthly: 35,
    growthMonthly: 85,
  },
  {
    key: "100K",
    events: 100_000,
    label: "100k monthly events",
    starterMonthly: 45,
    growthMonthly: 99,
  },
  {
    key: "250K",
    events: 250_000,
    label: "250k monthly events",
    starterMonthly: 65,
    growthMonthly: 125,
  },
  {
    key: "500K",
    events: 500_000,
    label: "500k monthly events",
    starterMonthly: 79,
    growthMonthly: 159,
  },
  {
    key: "750K",
    events: 750_000,
    label: "750k monthly events",
    starterMonthly: 89,
    growthMonthly: 189,
  },
  {
    key: "1M",
    events: 1_000_000,
    label: "1M monthly events",
    starterMonthly: 99,
    growthMonthly: 199,
  },
  {
    key: "2M",
    events: 2_000_000,
    label: "2M monthly events",
    starterMonthly: 119,
    growthMonthly: 219,
  },
  {
    key: "5M",
    events: 5_000_000,
    label: "5M monthly events",
    starterMonthly: 149,
    growthMonthly: 229,
  },
  {
    key: "10M+",
    events: 10_000_000,
    label: "10M+ monthly events",
    starterMonthly: 199,
    growthMonthly: 249,
  },
];

export const VOLUME_KEYS: VolumeKey[] = VOLUME_TIERS.map((t) => t.key);

export const SELECTABLE_VOLUME_KEYS: VolumeKey[] = VOLUME_KEYS.filter(
  (k) => k !== "1K" && k !== "5K",
);
export const SELECTABLE_VOLUME_TIERS: VolumeTier[] = VOLUME_TIERS.filter(
  (t) => t.key !== "1K" && t.key !== "5K",
);

export function getTierByVolume(volume: VolumeKey): VolumeTier {
  const tier = VOLUME_TIERS.find((t) => t.key === volume);
  if (!tier) throw new Error(`Unknown volume: ${volume}`);
  return tier;
}

export function getPriceForVolume(
  volume: VolumeKey,
  planId: "starter" | "pro",
  billingPeriod: "monthly" | "yearly",
): number {
  const tier = getTierByVolume(volume);
  const monthly =
    planId === "starter" ? tier.starterMonthly : tier.growthMonthly;
  if (billingPeriod === "monthly") return monthly;
  return monthly * 10;
}

import type { IUser } from "@/db/models/User";
import {
  VOLUME_KEYS,
  getTierByVolume,
  type VolumeKey,
} from "@/lib/billing/pricing-tiers";

export function getPlanEventLimit(user: IUser): number | null {
  const sub = user.subscription;
  if (!sub) return null;

  if (sub.status !== "active" || sub.plan === "free") {
    return null;
  }

  const volume = sub.volume;
  if (volume && VOLUME_KEYS.includes(volume as VolumeKey)) {
    return getTierByVolume(volume as VolumeKey).events;
  }

  return 10_000;
}

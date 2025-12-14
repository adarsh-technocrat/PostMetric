import { createAvatar } from "@dicebear/core";
import * as avatarStyle from "@dicebear/collection";

/**
 * Generate a DiceBear avatar URL using open-peeps style with smile
 * @param seed - A unique identifier (e.g., user ID, email, visitor ID)
 * @param options - Optional configuration for the avatar
 * @returns Data URL of the generated avatar
 */
export function generateAvatar(
  seed: string,
  options?: {
    size?: number;
  }
): string {
  const size = options?.size || 128;

  const avatarBuilder = createAvatar(avatarStyle.openPeeps, {
    seed,
    size,
    face: ["smile"],
  });

  return avatarBuilder.toDataUri();
}

/**
 * Generate a DiceBear avatar URL for a user (using email or name as seed)
 */
export function generateUserAvatar(
  email?: string,
  name?: string,
  options?: {
    size?: number;
  }
): string {
  const seed = name || email || "user";
  return generateAvatar(seed, options);
}

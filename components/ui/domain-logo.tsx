"use client";

import { useState } from "react";
import { getLogoDevUrl } from "@/utils/domain-logo";

interface DomainLogoProps {
  /** Domain to fetch logo for (e.g. "uxmagic.ai"). Logo is loaded from logo.dev. */
  domain: string | null;
  /** Optional custom icon URL; when set, used instead of logo.dev. */
  iconUrl?: string | null;
  /** Optional size in pixels (width and height). */
  size?: number;
  /** Optional alt text; defaults to domain. */
  alt?: string;
  /** Optional class name for the image. */
  className?: string;
  /** Rendered when no logo URL is available or when the image fails to load. */
  fallback?: React.ReactNode;
}

/**
 * Reusable domain logo: shows logo from logo.dev for the given domain,
 * or a custom iconUrl when provided. Shows fallback when unavailable or on error.
 */
export function DomainLogo({
  domain,
  iconUrl,
  size = 14,
  alt,
  className = "shrink-0 rounded",
  fallback = null,
}: DomainLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = iconUrl || (domain ? getLogoDevUrl(domain) : null) || null;

  if (!src) return <>{fallback}</>;

  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt ?? domain ?? ""}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

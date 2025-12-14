"use client";

interface SoundwaveIconProps {
  className?: string;
}

export function SoundwaveIcon({
  className = "fill-primary",
}: SoundwaveIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <rect
        x="0.5"
        y="6"
        width="1.75"
        height="2"
        rx="1"
        className="soundwave-bar fill-primary"
        style={{ animationDelay: "0s" }}
      />
      <rect
        x="4"
        y="4"
        width="1.75"
        height="6"
        rx="1"
        className="soundwave-bar fill-primary"
        style={{ animationDelay: "0.12s" }}
      />
      <rect
        x="7.5"
        y="2"
        width="1.75"
        height="10"
        rx="1"
        className="soundwave-bar fill-primary"
        style={{ animationDelay: "0.24s" }}
      />
      <rect
        x="11"
        y="4"
        width="1.75"
        height="6"
        rx="1"
        className="soundwave-bar fill-primary"
        style={{ animationDelay: "0.36s" }}
      />
    </svg>
  );
}

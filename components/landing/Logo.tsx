import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  iconSize?: "sm" | "md" | "lg";
}

export function Logo({
  className = "",
  showText = true,
  textSize = "2xl",
  iconSize = "lg",
}: LogoProps) {
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={iconSizeClasses[iconSize]}
        >
          <rect
            x="2"
            y="2"
            width="28"
            height="28"
            rx="6"
            fill="url(#logoGradient)"
          />
          <rect
            x="8"
            y="20"
            width="4"
            height="8"
            rx="1"
            fill="white"
            opacity="0.6"
          />
          <rect
            x="14"
            y="15"
            width="4"
            height="13"
            rx="1"
            fill="white"
            opacity="0.8"
          />
          <rect
            x="20"
            y="10"
            width="4"
            height="18"
            rx="1"
            fill="white"
            opacity="1"
          />
          <circle cx="22" cy="10" r="3" fill="white" opacity="0.2" />
          <circle cx="22" cy="10" r="1.5" fill="white" />

          <defs>
            <linearGradient
              id="logoGradient"
              x1="0"
              y1="0"
              x2="32"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#5220E3" />
              <stop offset="50%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[textSize]} font-extrabold text-gray-900`}
        >
          PostMetric
        </span>
      )}
    </Link>
  );
}

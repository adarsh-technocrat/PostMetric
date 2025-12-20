"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface NavSectionProps {
  title: string;
  color: "amber" | "rose" | "lime" | "blue" | "purple";
  children: ReactNode;
  upgradeBadge?: boolean;
  upgradeHref?: string;
}

const colorClasses = {
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  lime: "bg-lime-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
};

export function NavSection({
  title,
  color,
  children,
  upgradeBadge = false,
  upgradeHref,
}: NavSectionProps) {
  return (
    <div className="flex flex-col w-full gap-y-1">
      <div className="flex items-center gap-3.5 pl-2 pb-2">
        <div className={`w-4.5 h-0.5 rounded-xs ${colorClasses[color]}`} />
        <p className="text-stone-400 font-medium text-xs uppercase font-mono grow">
          {title}
        </p>
        {upgradeBadge && upgradeHref && (
          <Link
            href={upgradeHref}
            className="text-brand-600 hover:text-indigo-100 font-semibold text-[10px] px-2 py-0.5 rounded-md text-center uppercase leading-3.5 bg-indigo-100 hover:bg-indigo-600 cursor-pointer transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="flex flex-col w-full gap-1">{children}</div>
    </div>
  );
}

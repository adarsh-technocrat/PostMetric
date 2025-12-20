"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
}

export function NavItem({
  href,
  icon,
  children,
  disabled = false,
  badge,
  onClick,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  if (disabled) {
    return (
      <div className="cursor-not-allowed">
        <div
          className={`flex items-center gap-x-3 px-2 h-8 w-full border border-transparent text-stone-500 font-medium text-sm rounded-lg opacity-50 pointer-events-none group`}
        >
          {icon}
          <p className="group-hover:text-stone-800 text-stone-500 font-medium text-sm group-hover:translate-x-0.5 transition-transform">
            {children}
          </p>
          {badge && <span className="ml-auto">{badge}</span>}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      data-state={isActive ? "on" : "off"}
      className={`flex items-center gap-x-3 px-2 h-8 w-full border border-transparent text-stone-500 font-medium text-sm rounded-lg hover:bg-stone-0 hover:text-stone-800 hover:border-stone-100 data-[state=on]:bg-stone-0 data-[state=on]:text-stone-800 data-[state=on]:border-stone-100 group transition-colors`}
    >
      {icon}
      <p
        className={`font-medium text-sm group-hover:translate-x-0.5 transition-transform ${
          isActive
            ? "text-stone-800"
            : "text-stone-500 group-hover:text-stone-800"
        }`}
      >
        {children}
      </p>
      {badge && <span className="ml-auto">{badge}</span>}
    </Link>
  );
}

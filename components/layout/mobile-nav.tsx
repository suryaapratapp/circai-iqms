"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMobilePrimaryNavForRole } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/data/types";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const mobilePrimaryNav = getMobilePrimaryNavForRole(role);

  return (
    <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1.5 rounded-[24px] px-2 py-2 lg:hidden">
      {mobilePrimaryNav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
              active ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(29,78,216,0.18)]" : "text-slate-600"
            )}
            href={item.href}
            prefetch={false}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

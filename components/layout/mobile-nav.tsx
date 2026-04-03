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
    <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 grid grid-cols-5 gap-2 rounded-[26px] p-2 lg:hidden">
      {mobilePrimaryNav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
              active ? "bg-ink text-white" : "text-slate-600"
            )}
            href={item.href}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

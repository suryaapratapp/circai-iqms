"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appConfig } from "@/lib/config/app";
import { getNavigationItemsForRole } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/data/types";

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navigationItems = getNavigationItemsForRole(role);

  return (
    <aside className="hidden w-[280px] shrink-0 lg:flex lg:flex-col lg:gap-5">
      <div className="glass-panel rounded-[32px] p-5">
        <p className="font-heading text-2xl font-bold text-ink">{appConfig.name}</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{appConfig.subtitle}</p>
      </div>
      <nav className="glass-panel flex-1 rounded-[32px] p-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-ink text-white shadow-warehouse"
                    : "text-slate-600 hover:bg-slate-100"
                )}
                href={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

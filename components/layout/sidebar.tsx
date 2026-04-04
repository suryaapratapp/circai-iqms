"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigationItemsForRole } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/data/types";
import { BrandLockup } from "@/components/layout/brand-lockup";

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navigationItems = getNavigationItemsForRole(role);

  return (
    <aside className="hidden w-[280px] shrink-0 lg:flex lg:flex-col lg:gap-5">
      <Link className="glass-panel rounded-[34px] px-5 py-5" href="/dashboard" prefetch={false}>
        <BrandLockup size="md" />
      </Link>
      <nav className="glass-panel flex-1 rounded-[34px] p-3">
        <div className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-blue-600 text-white shadow-[0_14px_28px_rgba(29,78,216,0.22)]"
                    : "text-slate-600 hover:bg-blue-50 hover:text-ink"
                )}
                href={item.href}
                prefetch={false}
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

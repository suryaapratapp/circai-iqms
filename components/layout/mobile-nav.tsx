"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  getMobileMoreNavItem,
  getMobileOverflowNavForRole,
  getMobilePrimaryNavForRole
} from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/data/types";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const mobilePrimaryNav = getMobilePrimaryNavForRole(role);
  const mobileOverflowNav = getMobileOverflowNavForRole(role);
  const moreItem = getMobileMoreNavItem();
  const MoreIcon = moreItem.icon;
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = useMemo(
    () => mobileOverflowNav.some((item) => item.href === pathname),
    [mobileOverflowNav, pathname]
  );

  return (
    <>
      <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1.5 rounded-[24px] px-2 py-2 lg:hidden">
        {mobilePrimaryNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(29,78,216,0.18)]"
                  : "text-slate-600"
              )}
              href={item.href}
              prefetch={false}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          className={cn(
            "flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
            isMoreActive || moreOpen
              ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(29,78,216,0.18)]"
              : "text-slate-600"
          )}
          onClick={() => setMoreOpen(true)}
          type="button"
        >
          <MoreIcon className="h-4 w-4" />
          <span>{moreItem.label}</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="glass-panel absolute inset-x-3 bottom-3 rounded-[28px] px-4 py-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Menu
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-ink">More</p>
              </div>
              <button
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500"
                onClick={() => setMoreOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2">
              {mobileOverflowNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    className={cn(
                      "flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "border-blue-200 bg-blue-50 text-teal"
                        : "border-slate-200 bg-white/90 text-ink"
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMoreOpen(false)}
                    prefetch={false}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

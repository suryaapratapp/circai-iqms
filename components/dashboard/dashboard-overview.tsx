import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { appConfig } from "@/lib/config/app";
import type { DashboardData } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRelative } from "@/lib/utils/format";

export function DashboardOverview({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="space-y-5">
      <SurfaceCard className="rounded-[36px] p-6 md:p-7">
        <div className="flex flex-col gap-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {appConfig.customerContext}
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-ink md:text-[2.15rem]">
              Welcome back
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Start with the next warehouse action and keep stock moving.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {dashboard.summaryStrip.map((item) => (
            <div
              className="rounded-[22px] border border-blue-100 bg-blue-50/70 px-4 py-4"
              key={item.label}
            >
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
        {dashboard.lastAction ? (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Last action
              </p>
              <p className="mt-1 font-semibold text-ink">
                {dashboard.lastAction.transactionType}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {dashboard.lastAction.itemName || "Stock action"} • Qty{" "}
                {dashboard.lastAction.quantity}
              </p>
            </div>
            <p className="shrink-0 text-xs font-medium text-slate-500">
              {formatRelative(dashboard.lastAction.timestamp)}
            </p>
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard className="rounded-[34px] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-ink">Quick actions</p>
            <p className="mt-1 text-sm text-slate-600">
              Most-used workflows for the warehouse floor.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.quickActions.map((action) => (
            <Link
              className="rounded-[24px] border border-slate-200 bg-white/95 px-4 py-4 text-sm font-semibold text-ink transition hover:border-blue-200 hover:bg-blue-50/80"
              href={action.href}
              key={action.href}
              prefetch={false}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p>{action.label}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">Open workflow</p>
                </div>
                <div className="rounded-full bg-blue-50 p-2 text-teal">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="rounded-[34px] p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-xl font-bold text-ink">Recent activity</p>
          <Link href="/transaction-history" prefetch={false}>
            <Button variant="ghost">View all</Button>
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {dashboard.recentActivity.map((activity) => (
            <div
              className="rounded-[22px] border border-slate-200 bg-white/90 p-4"
              key={activity.transactionId}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{activity.transactionType}</p>
                  <p className="text-sm text-slate-600">
                    {activity.itemName || "Stock update"} • Qty {activity.quantity}
                  </p>
                </div>
                <StatusBadge value={activity.status} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {activity.userName} • Shelf {activity.shelfCode || "Not set"} •{" "}
                {formatRelative(activity.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

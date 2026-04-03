import Link from "next/link";
import { ChevronRight, ScanLine } from "lucide-react";
import type { DashboardData } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRelative } from "@/lib/utils/format";

export function DashboardOverview({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="font-heading text-2xl font-bold text-ink">Quick actions</p>
          <Link href="/search-by-upc">
            <Button className="gap-2">
              <ScanLine className="h-4 w-4" />
              Scan item
            </Button>
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.quickActions.map((action) => (
            <Link
              className="rounded-[24px] border border-blue-100 bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:border-teal hover:bg-blue-50"
              href={action.href}
              key={action.href}
            >
              <span className="flex items-center justify-between gap-3">
                {action.label}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </span>
            </Link>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <SurfaceCard className="rounded-[32px] p-6">
          <p className="font-heading text-xl font-bold text-ink">Summary</p>
          <div className="mt-4 grid gap-3">
            {dashboard.summaryStrip.map((item) => (
              <div
                className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-4"
                key={item.label}
              >
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-lg font-semibold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
          {dashboard.lastAction ? (
            <div className="mt-6 rounded-[24px] border border-blue-100 bg-white p-4">
              <p className="text-sm font-semibold text-slate-700">Last action</p>
              <p className="mt-2 font-semibold text-ink">
                {dashboard.lastAction.transactionType}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {dashboard.lastAction.itemName || "Stock action"} • Qty{" "}
                {dashboard.lastAction.quantity}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {dashboard.lastAction.userName} • {formatRelative(dashboard.lastAction.timestamp)}
              </p>
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-xl font-bold text-ink">Recent activity</p>
            <Link href="/transaction-history">
              <Button variant="ghost">View all</Button>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {dashboard.recentActivity.map((activity) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-4"
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
    </div>
  );
}

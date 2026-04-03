"use client";

import { downloadCsv } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";

export function ReportsDashboard({ reports }: { reports: ReportsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Inventory records" value={reports.inventoryOnHand.length} />
        <SummaryCard label="Damage records" value={reports.damagedItems.length} />
        <SummaryCard label="Repair records" value={reports.repairItems.length} />
        <SummaryCard label="QC records" value={reports.qualityResults.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard className="rounded-[32px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-heading text-2xl font-bold text-ink">Daily transactions</p>
              <p className="text-sm text-slate-600">
                Filter-ready export surface for SME managers.
              </p>
            </div>
            <Button
              onClick={() =>
                downloadCsv(
                  "circai-daily-transactions.csv",
                  reports.dailyTransactions.map((record) => ({
                    transactionId: record.transactionId,
                    type: record.transactionType,
                    item: record.itemName,
                    quantity: record.quantity,
                    user: record.userName,
                    timestamp: record.timestamp
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {reports.dailyTransactions.map((record) => (
              <div className="rounded-2xl bg-slate-100 p-4" key={record.transactionId}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{record.transactionType}</p>
                    <p className="text-sm text-slate-500">
                      {record.itemName} • Qty {record.quantity}
                    </p>
                  </div>
                  <StatusBadge value={record.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {record.userName} • {formatDateTime(record.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] p-6">
          <p className="font-heading text-2xl font-bold text-ink">Operational exceptions</p>
          <div className="mt-5 space-y-3">
            {reports.cycleCounts
              .filter((record) => record.variance !== 0)
              .slice(0, 6)
              .map((record) => (
                <div className="rounded-2xl bg-amber-50 p-4" key={record.cycleCountId}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-amber-900">Cycle count variance</p>
                    <StatusBadge value={record.status} />
                  </div>
                  <p className="mt-2 text-sm text-amber-800">
                    Variance {record.variance} on {record.shelfCode || "unassigned shelf"}
                  </p>
                </div>
              ))}
            {reports.repairItems.slice(0, 4).map((record) => (
              <div className="rounded-2xl bg-slate-100 p-4" key={record.repairId}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{record.assignedTo}</p>
                  <StatusBadge value={record.repairStatus} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{record.repairReason}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SurfaceCard className="rounded-[32px] p-6">
          <SectionHeader
            exportRows={reports.inventoryOnHand.map((row) => ({
              sku: row.item.sku,
              itemName: row.item.itemName,
              location: row.location?.name,
              shelf: row.inventory.shelfCode,
              available: row.inventory.quantityAvailable
            }))}
            filename="circai-inventory-on-hand.csv"
            title="Inventory on hand"
          />
          <div className="mt-4 space-y-3">
            {reports.inventoryOnHand.slice(0, 6).map((row) => (
              <MiniRow
                key={row.inventory.inventoryId}
                subtitle={`${row.location?.code || ""} • ${row.inventory.shelfCode || "Pending"}`}
                title={row.item.itemName}
                value={formatQuantity(row.inventory.quantityAvailable)}
              />
            ))}
          </div>
        </SurfaceCard>
        <SurfaceCard className="rounded-[32px] p-6">
          <SectionHeader
            exportRows={reports.damagedItems}
            filename="circai-damaged-items.csv"
            title="Damaged items"
          />
          <div className="mt-4 space-y-3">
            {reports.damagedItems.map((row) => (
              <MiniRow
                key={row.damageId}
                subtitle={row.damageReason}
                title={`Qty ${row.quantity}`}
                value={formatDateTime(row.createdAt)}
              />
            ))}
          </div>
        </SurfaceCard>
        <SurfaceCard className="rounded-[32px] p-6">
          <SectionHeader
            exportRows={reports.qualityResults}
            filename="circai-quality-results.csv"
            title="Quality pass / fail"
          />
          <div className="mt-4 space-y-3">
            {reports.qualityResults.map((row) => (
              <div className="rounded-2xl bg-slate-100 p-4" key={row.qualityCheckId}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{row.checkedByName}</p>
                  <StatusBadge value={row.result} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {row.defectCategory || "No defect"} • {formatDateTime(row.checkedAt)}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <SurfaceCard className="rounded-[28px] p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-4xl font-bold text-ink">
        {formatQuantity(value)}
      </p>
    </SurfaceCard>
  );
}

function SectionHeader({
  title,
  filename,
  exportRows
}: {
  title: string;
  filename: string;
  exportRows: Array<Record<string, unknown> | object>;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-heading text-xl font-bold text-ink">{title}</p>
      <Button
        onClick={() =>
          downloadCsv(
            filename,
            exportRows.map((row) => ({ ...(row as Record<string, unknown>) }))
          )
        }
        variant="ghost"
      >
        Export
      </Button>
    </div>
  );
}

function MiniRow({
  title,
  subtitle,
  value
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <p className="mt-2 text-sm font-semibold text-teal">{value}</p>
    </div>
  );
}

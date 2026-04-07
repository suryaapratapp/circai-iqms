"use client";

import { useMemo, useState } from "react";
import { downloadCsv, formatDateTime, formatQuantity } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/data/repository";
import {
  getDamagedBeyondRepairQuantity,
  getDamagedToRepairQuantity,
  getTotalDamagedQuantity
} from "@/lib/data/inventory";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";

export function ReportsDashboard({ reports }: { reports: ReportsData }) {
  const [productQuery, setProductQuery] = useState("");

  const inventorySummary = useMemo(() => {
    return reports.inventoryOnHand.reduce(
      (summary, row) => {
        summary.totalStockLines += 1;
        summary.totalAvailableUnits += row.inventory.quantityAvailable;
        summary.totalPackedUnits += row.inventory.quantityPacked;
        summary.totalDamagedUnits += getTotalDamagedQuantity(row.inventory);
        summary.totalRepairEligibleUnits += getDamagedToRepairQuantity(row.inventory);
        summary.totalBeyondRepairUnits += getDamagedBeyondRepairQuantity(row.inventory);
        return summary;
      },
      {
        totalStockLines: 0,
        totalAvailableUnits: 0,
        totalPackedUnits: 0,
        totalDamagedUnits: 0,
        totalRepairEligibleUnits: 0,
        totalBeyondRepairUnits: 0
      }
    );
  }, [reports.inventoryOnHand]);

  const shelfSummary = useMemo(() => {
    const activeShelves = new Set<string>();
    const lowStockRows = reports.inventoryOnHand.filter((row) => {
      if (row.inventory.quantityOnHand > 0 && row.inventory.shelfCode) {
        activeShelves.add(row.inventory.shelfCode);
      }
      return (
        row.inventory.quantityAvailable > 0 &&
        row.inventory.reorderThreshold !== undefined &&
        row.inventory.quantityAvailable <= row.inventory.reorderThreshold
      );
    });

    const occupiedShelves = Array.from(activeShelves)
      .map((shelfCode) => ({
        shelfCode,
        quantity: reports.inventoryOnHand
          .filter((row) => row.inventory.shelfCode === shelfCode)
          .reduce((sum, row) => sum + row.inventory.quantityOnHand, 0)
      }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 4);

    return {
      activeShelfCount: activeShelves.size,
      lowStockRows,
      occupiedShelves
    };
  }, [reports.inventoryOnHand]);

  const damagedSummary = useMemo(() => {
    const highestDamagedItems = reports.inventoryOnHand
      .map((row) => ({
        itemId: row.item.itemId,
        itemName: row.item.itemName,
        sku: row.item.sku,
        quantity: getTotalDamagedQuantity(row.inventory)
      }))
      .filter((row) => row.quantity > 0)
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);

    return {
      totalDamagedQuantity: inventorySummary.totalDamagedUnits,
      damagedToRepairQuantity: inventorySummary.totalRepairEligibleUnits,
      damagedBeyondRepairQuantity: inventorySummary.totalBeyondRepairUnits,
      highestDamagedItems
    };
  }, [inventorySummary, reports.inventoryOnHand]);

  const repairSummary = useMemo(() => {
    const summary = reports.repairItems.reduce(
      (accumulator, record) => {
        if (record.repairStatus === "returned to stock") {
          accumulator.returnedToStock += record.quantity;
        } else if (record.repairStatus === "beyond repair") {
          accumulator.beyondRepair += record.quantity;
        }
        return accumulator;
      },
      {
        returnedToStock: 0,
        beyondRepair: 0
      }
    );
    return {
      totalRepairEligible: inventorySummary.totalRepairEligibleUnits,
      returnedToStock: summary.returnedToStock,
      beyondRepair: summary.beyondRepair
    };
  }, [inventorySummary.totalRepairEligibleUnits, reports.repairItems]);

  const packingSummary = useMemo(() => {
    return reports.packingOrders.reduce(
      (summary, order) => {
        summary.total += 1;
        if (order.status === "packed") {
          summary.packed += 1;
        } else if (order.status === "partially unpacked") {
          summary.partiallyUnpacked += 1;
        } else if (order.status === "unpacked") {
          summary.unpacked += 1;
        }
        return summary;
      },
      {
        total: 0,
        packed: 0,
        partiallyUnpacked: 0,
        unpacked: 0
      }
    );
  }, [reports.packingOrders]);

  const activitySummary = useMemo(() => {
    return reports.userActivity.reduce<Record<string, number>>((summary, record) => {
      summary[record.transactionType] = (summary[record.transactionType] || 0) + record.quantity;
      return summary;
    }, {});
  }, [reports.userActivity]);

  const productTotals = useMemo(() => {
    const totals = new Map<
      string,
      {
        itemName: string;
        sku: string;
        totalQuantity: number;
        totalAvailable: number;
        shelves: Set<string>;
      }
    >();

    reports.inventoryOnHand.forEach((row) => {
      const current =
        totals.get(row.item.itemId) ||
        {
          itemName: row.item.itemName,
          sku: row.item.sku,
          totalQuantity: 0,
          totalAvailable: 0,
          shelves: new Set<string>()
        };
      current.totalQuantity += row.inventory.quantityOnHand;
      current.totalAvailable += row.inventory.quantityAvailable;
      if (row.inventory.shelfCode) {
        current.shelves.add(row.inventory.shelfCode);
      }
      totals.set(row.item.itemId, current);
    });

    const normalizedQuery = productQuery.trim().toLowerCase();
    return Array.from(totals.values())
      .filter((row) =>
        !normalizedQuery
          ? true
          : [row.itemName, row.sku].some((value) =>
              value.toLowerCase().includes(normalizedQuery)
            )
      )
      .sort((left, right) => right.totalQuantity - left.totalQuantity);
  }, [productQuery, reports.inventoryOnHand]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Stock lines" value={inventorySummary.totalStockLines} />
        <SummaryCard label="Available units" value={inventorySummary.totalAvailableUnits} />
        <SummaryCard label="Damaged to repair" value={inventorySummary.totalRepairEligibleUnits} />
        <SummaryCard label="Beyond repair" value={inventorySummary.totalBeyondRepairUnits} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard className="rounded-[32px] p-6">
          <SectionHeader
            exportRows={[
              inventorySummary,
              {
                activeShelves: shelfSummary.activeShelfCount,
                lowStockRows: shelfSummary.lowStockRows.length
              }
            ]}
            filename="iqms-inventory-summary.csv"
            title="Inventory Summary"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Total damaged units" value={formatQuantity(inventorySummary.totalDamagedUnits)} />
            <MiniMetric label="Packed units" value={formatQuantity(inventorySummary.totalPackedUnits)} />
            <MiniMetric label="Active shelves with stock" value={formatQuantity(shelfSummary.activeShelfCount)} />
            <MiniMetric label="Low-stock lines" value={formatQuantity(shelfSummary.lowStockRows.length)} />
          </div>
          <div className="mt-5 space-y-3">
            {shelfSummary.occupiedShelves.map((shelf) => (
              <MiniRow
                key={shelf.shelfCode}
                subtitle="Top occupied shelf"
                title={shelf.shelfCode}
                value={`${formatQuantity(shelf.quantity)} units`}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] p-6">
          <SectionHeader
            exportRows={[
              {
                totalDamagedQuantity: damagedSummary.totalDamagedQuantity,
                damagedToRepairQuantity: damagedSummary.damagedToRepairQuantity,
                damagedBeyondRepairQuantity: damagedSummary.damagedBeyondRepairQuantity
              },
              ...damagedSummary.highestDamagedItems
            ]}
            filename="iqms-damaged-summary.csv"
            title="Damaged Stock Summary"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Total damaged" value={formatQuantity(damagedSummary.totalDamagedQuantity)} />
            <MiniMetric label="To repair" value={formatQuantity(damagedSummary.damagedToRepairQuantity)} />
            <MiniMetric label="Beyond repair" value={formatQuantity(damagedSummary.damagedBeyondRepairQuantity)} />
          </div>
          <div className="mt-5 space-y-3">
            {damagedSummary.highestDamagedItems.map((row) => (
              <MiniRow
                key={`${row.sku}-${row.itemId}`}
                subtitle={row.sku}
                title={row.itemName}
                value={`${formatQuantity(row.quantity)} units`}
              />
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="rounded-[32px] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-heading text-2xl font-bold text-ink">Product Stock Summary</p>
              <p className="mt-1 text-sm text-slate-600">
                Total quantity across all shelves for each item.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                className={inputClassName("md:min-w-64")}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Search by item or SKU"
                value={productQuery}
              />
              <Button
                onClick={() =>
                  downloadCsv(
                    "iqms-product-stock-summary.csv",
                    productTotals.map((row) => ({
                      itemName: row.itemName,
                      sku: row.sku,
                      totalQuantity: row.totalQuantity,
                      totalAvailable: row.totalAvailable,
                      shelves: Array.from(row.shelves).join(", ")
                    }))
                  )
                }
                variant="ghost"
              >
                Export
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {productTotals.slice(0, 10).map((row) => (
              <div className="rounded-[22px] border border-slate-200 bg-white/95 p-4" key={row.sku}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{row.itemName}</p>
                    <p className="text-sm text-slate-500">{row.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">
                      {formatQuantity(row.totalQuantity)} units
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatQuantity(row.totalAvailable)} available
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Shelves: {Array.from(row.shelves).join(", ") || "Not assigned"}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] p-6">
            <SectionHeader
              exportRows={[
                repairSummary,
                {
                  packedOrders: packingSummary.packed,
                  partiallyUnpacked: packingSummary.partiallyUnpacked,
                  unpacked: packingSummary.unpacked
                }
              ]}
              filename="iqms-repair-packing-summary.csv"
              title="Repair and Orders"
            />
            <div className="mt-4 space-y-3">
              <MiniMetric label="Repair-eligible units" value={formatQuantity(repairSummary.totalRepairEligible)} />
              <MiniMetric label="Returned to stock" value={formatQuantity(repairSummary.returnedToStock)} />
              <MiniMetric label="Repair beyond repair" value={formatQuantity(repairSummary.beyondRepair)} />
              <MiniMetric label="Packed orders" value={formatQuantity(packingSummary.packed)} />
              <MiniMetric label="Partially unpacked" value={formatQuantity(packingSummary.partiallyUnpacked)} />
              <MiniMetric label="Unpacked orders" value={formatQuantity(packingSummary.unpacked)} />
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] p-6">
            <SectionHeader
              exportRows={reports.userActivity.map((row) => ({
                transactionType: row.transactionType,
                quantity: row.quantity,
                itemName: row.itemName,
                shelfCode: row.shelfCode,
                timestamp: row.timestamp
              }))}
              filename="iqms-movement-summary.csv"
              title="Movement and Activity"
            />
            <div className="mt-4 space-y-3">
              {Object.entries(activitySummary)
                .sort((left, right) => right[1] - left[1])
                .slice(0, 6)
                .map(([type, quantity]) => (
                  <div
                    className="flex items-center justify-between rounded-[20px] bg-slate-100 px-4 py-3"
                    key={type}
                  >
                    <p className="text-sm font-semibold text-ink">{type}</p>
                    <p className="text-sm text-slate-600">{formatQuantity(quantity)}</p>
                  </div>
                ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-heading text-xl font-bold text-ink">Recent quality checks</p>
              <Button
                onClick={() =>
                  downloadCsv(
                    "iqms-quality-results.csv",
                    reports.qualityResults.map((row) => ({
                      qualityCheckId: row.qualityCheckId,
                      itemId: row.itemId,
                      locationId: row.locationId,
                      shelfCode: row.shelfCode,
                      result: row.result,
                      defectCategory: row.defectCategory,
                      disposition: row.disposition,
                      checkedByName: row.checkedByName,
                      checkedAt: row.checkedAt
                    }))
                  )
                }
                variant="ghost"
              >
                Export
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {reports.qualityResults.slice(0, 5).map((row) => (
                <div className="rounded-[20px] bg-slate-100 p-4" key={row.qualityCheckId}>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-slate-100 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
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
    <div className="rounded-[20px] bg-slate-100 p-4">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <p className="mt-2 text-sm font-semibold text-teal">{value}</p>
    </div>
  );
}

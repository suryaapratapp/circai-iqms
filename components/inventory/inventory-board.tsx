"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InventoryListItem } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";

export function InventoryBoard({
  rows,
  selectedItemId
}: {
  rows: InventoryListItem[];
  selectedItemId?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }
    return rows.filter((row) =>
      [
        row.item.itemName,
        row.item.sku,
        row.item.upc,
        row.item.batchLot,
        row.inventory.shelfCode
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [query, rows]);

  const selected =
    filtered.find((row) => row.item.itemId === selectedItemId) || filtered[0];

  if (!rows.length) {
    return (
      <EmptyState
        description="Inventory records will appear here once stock is received."
        title="No inventory found"
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-ink">Inventory list</p>
            <p className="text-sm text-slate-600">
              Search across SKU, UPC, shelf, and batch.
            </p>
          </div>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal md:max-w-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search inventory..."
            value={query}
          />
        </div>
        <div className="mt-5 space-y-3">
          {filtered.map((row) => (
            <Link href={`/inventory/${row.item.itemId}`} key={row.inventory.inventoryId}>
              <div
                className={`rounded-[26px] border p-4 transition ${
                  selected?.item.itemId === row.item.itemId
                    ? "border-teal bg-teal/5"
                    : "border-slate-200 bg-white hover:border-teal/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{row.item.itemName}</p>
                    <p className="text-sm text-slate-500">
                      {row.item.sku} • {row.item.upc}
                    </p>
                  </div>
                  <StatusBadge value={row.inventory.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <Tile label="Avail" value={formatQuantity(row.inventory.quantityAvailable)} />
                    <Tile label="Shelf" value={row.inventory.shelfCode || "Pending"} />
                  <Tile label="Site" value={row.location?.code || "-"} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SurfaceCard>

      {selected ? (
        <SurfaceCard className="rounded-[32px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-heading text-3xl font-bold text-ink">
                {selected.item.itemName}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {selected.item.sku} • {selected.item.category} • Supplier {selected.item.supplier}
              </p>
            </div>
            <StatusBadge value={selected.inventory.status} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Detail label="UPC" value={selected.item.upc} />
            <Detail label="QR value" value={selected.item.qrCode} />
            <Detail label="Location" value={selected.location?.name || "Not assigned"} />
            <Detail label="Shelf" value={selected.inventory.shelfCode || "Pending"} />
            <Detail label="On hand" value={formatQuantity(selected.inventory.quantityOnHand)} />
            <Detail label="Available" value={formatQuantity(selected.inventory.quantityAvailable)} />
            <Detail label="Pending inbound" value={formatQuantity(selected.inventory.quantityPendingInbound)} />
            <Detail label="Damaged" value={formatQuantity(selected.inventory.quantityDamaged)} />
            <Detail label="Under repair" value={formatQuantity(selected.inventory.quantityUnderRepair)} />
            <Detail label="Packed" value={formatQuantity(selected.inventory.quantityPacked)} />
            <Detail label="Batch / lot" value={selected.inventory.batchLot || "-"} />
            <Detail label="Expiry" value={selected.inventory.expiryDate || "-"} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/quality-check">
              <Button variant="ghost">Quality Check</Button>
            </Link>
            <Link href="/cycle-count">
              <Button variant="ghost">Cycle Count</Button>
            </Link>
            <Link href="/repair-item">
              <Button variant="ghost">Repair</Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Last updated {formatDateTime(selected.inventory.lastUpdatedAt)}
          </p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

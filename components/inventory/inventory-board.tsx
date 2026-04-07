"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { InventoryListItem } from "@/lib/data/repository";
import {
  getDamagedBeyondRepairQuantity,
  getDamagedToRepairQuantity
} from "@/lib/data/inventory";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClassName } from "@/components/ui/field";
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
  const [visibleCount, setVisibleCount] = useState(24);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
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
  }, [deferredQuery, rows]);

  useEffect(() => {
    setVisibleCount(24);
  }, [deferredQuery, rows]);

  const selected =
    filtered.find((row) => row.item.itemId === selectedItemId) || filtered[0];
  const visibleRows = filtered.slice(0, visibleCount);

  if (!rows.length) {
    return (
      <EmptyState
        description="Inventory records will appear here once stock is received."
        title="No inventory found"
      />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-ink">Inventory list</p>
            <p className="text-sm text-slate-600">
              Search across SKU, UPC, shelf, and batch.
            </p>
          </div>
          <input
            className={inputClassName("md:max-w-xs")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search inventory..."
            value={query}
          />
        </div>
        <div className="mt-5 space-y-3">
          {visibleRows.map((row) => (
            <Link
              href={`/inventory/${row.item.itemId}`}
              key={row.inventory.inventoryId}
              prefetch={false}
            >
              <div
                className={`rounded-[26px] border p-4 transition ${
                  selected?.item.itemId === row.item.itemId
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-slate-200 bg-white/95 hover:border-blue-200 hover:bg-blue-50/50"
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
          {filtered.length > visibleRows.length ? (
            <Button
              className="w-full"
              onClick={() => setVisibleCount((current) => current + 24)}
              variant="secondary"
            >
              Show more inventory
            </Button>
          ) : null}
        </div>
      </SurfaceCard>

      {selected ? (
        <SurfaceCard className="rounded-[34px] p-6 md:p-7">
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
            <Detail
              label="Damaged to repair"
              value={formatQuantity(getDamagedToRepairQuantity(selected.inventory))}
            />
            <Detail
              label="Beyond repair"
              value={formatQuantity(getDamagedBeyondRepairQuantity(selected.inventory))}
            />
            <Detail label="Packed" value={formatQuantity(selected.inventory.quantityPacked)} />
            <Detail label="Batch / lot" value={selected.inventory.batchLot || "-"} />
            <Detail label="Expiry" value={selected.inventory.expiryDate || "-"} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/move" prefetch={false}>
              <Button variant="ghost">Move</Button>
            </Link>
            <Link href="/repair-item" prefetch={false}>
              <Button variant="ghost">Repair</Button>
            </Link>
            <Link href="/damage-item" prefetch={false}>
              <Button variant="ghost">Damage</Button>
            </Link>
            <Link href="/packing" prefetch={false}>
              <Button variant="ghost">Pack</Button>
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
    <div className="rounded-[18px] bg-slate-100 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-slate-100 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

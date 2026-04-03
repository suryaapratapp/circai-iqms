"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ScanLine } from "lucide-react";
import { toast } from "sonner";
import type { SearchItemResult, SearchShelfResult } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ScannerModal } from "@/components/workflows/scanner-modal";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";

export function SearchModule({ mode }: { mode: "shelf" | "upc" }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<SearchShelfResult | SearchItemResult | null>(null);

  async function runSearch(searchValue: string) {
    const value = searchValue.trim();
    if (!value) {
      toast.error("Enter or scan a value first.");
      return;
    }
    setLoading(true);
    const response = await fetch(
      `/api/search?type=${mode === "shelf" ? "shelf" : "item"}&query=${encodeURIComponent(value)}`
    );
    const data = (await response.json()) as
      | (SearchShelfResult & { error?: string })
      | (SearchItemResult & { error?: string });
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || "Search failed.");
      return;
    }
    setResult(data);
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">
              {mode === "shelf" ? "Shelf search" : "SKU / UPC search"}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-ink">
              {mode === "shelf" ? "Search by Shelf" : "Search by SKU / UPC / Barcode / QR"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === "shelf"
                ? "Scan or type a shelf to see the stock stored there and launch quick actions."
                : "Scan or type a product code to see grouped stock across shelves and recent transactions."}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setScannerOpen(true)} variant="secondary">
            <ScanLine className="h-4 w-4" />
            Open scanner
          </Button>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-teal"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={mode === "shelf" ? "Enter shelf" : "Enter SKU / UPC / QR"}
              value={query}
            />
          </div>
          <Button disabled={loading} onClick={() => runSearch(query)}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </SurfaceCard>

      {!result ? (
        <EmptyState
          description="Search results will appear here with fast next-step actions."
          title="Nothing searched yet"
        />
      ) : mode === "shelf" ? (
        isShelfResult(result) && result.shelf ? (
          <div className="space-y-4">
            <SurfaceCard className="rounded-[32px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-bold text-ink">
                    Shelf {result.shelf.code}
                  </p>
                  <p className="text-sm text-slate-600">
                    {result.location?.name} • {result.shelf.zone} / {result.shelf.rack}
                  </p>
                </div>
                <StatusBadge value={result.shelf.status} />
              </div>
            </SurfaceCard>
            {result.inventory.length ? (
              result.inventory.map((row) => (
                <SurfaceCard className="rounded-[28px] p-5" key={row.inventory.inventoryId}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{row.item.itemName}</p>
                      <p className="text-sm text-slate-500">
                        {row.item.sku} • {row.item.upc}
                      </p>
                    </div>
                    <StatusBadge value={row.inventory.status} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Metric label="Available" value={formatQuantity(row.inventory.quantityAvailable)} />
                    <Metric label="Damaged" value={formatQuantity(row.inventory.quantityDamaged)} />
                    <Metric label="Under repair" value={formatQuantity(row.inventory.quantityUnderRepair)} />
                    <Metric label="Updated" value={formatDateTime(row.inventory.lastUpdatedAt)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/quality-check">
                      <Button variant="ghost">Quality Check</Button>
                    </Link>
                    <Link href="/damage-item">
                      <Button variant="ghost">Damage</Button>
                    </Link>
                    <Link href="/repair-item">
                      <Button variant="ghost">Repair</Button>
                    </Link>
                    <Link href="/packing">
                      <Button variant="ghost">Pack</Button>
                    </Link>
                    <Link href="/cycle-count">
                      <Button variant="ghost">Cycle Count</Button>
                    </Link>
                  </div>
                </SurfaceCard>
              ))
            ) : (
              <EmptyState
                description="This shelf is valid but currently has no recorded stock."
                title="Shelf is empty"
              />
            )}
          </div>
        ) : (
          <EmptyState description="Try another shelf or scan again." title="Shelf not found" />
        )
      ) : isItemResult(result) && result.item ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard className="rounded-[32px] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-3xl font-bold text-ink">
                  {result.item.itemName}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {result.item.sku} • {result.item.upc} • {result.item.category}
                </p>
              </div>
              <StatusBadge value={result.item.status} />
            </div>
            <div className="mt-6 space-y-3">
              {result.matches.map((match) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={match.inventory.inventoryId}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{match.location?.name}</p>
                      <p className="text-sm text-slate-500">Shelf {match.inventory.shelfCode || "Pending"}</p>
                    </div>
                    <StatusBadge value={match.inventory.status} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Metric label="Available" value={formatQuantity(match.inventory.quantityAvailable)} />
                    <Metric label="On hand" value={formatQuantity(match.inventory.quantityOnHand)} />
                    <Metric label="Updated" value={formatDateTime(match.inventory.lastUpdatedAt)} />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard className="rounded-[32px] p-6">
            <p className="font-heading text-xl font-bold text-ink">Recent transactions</p>
            <div className="mt-4 space-y-3">
              {result.transactions.length ? (
                result.transactions.map((transaction) => (
                  <div className="rounded-2xl bg-slate-100 p-4" key={transaction.transactionId}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{transaction.transactionType}</p>
                      <StatusBadge value={transaction.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Qty {transaction.quantity} • Shelf {transaction.shelfCode || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(transaction.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recent transactions for this item.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      ) : (
        <EmptyState description="Try another code or scan again." title="Item not found" />
      )}

      <ScannerModal
        onClose={() => setScannerOpen(false)}
        onDetected={(value) => {
          setQuery(value);
          setScannerOpen(false);
          runSearch(value);
        }}
        open={scannerOpen}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function isShelfResult(result: SearchShelfResult | SearchItemResult): result is SearchShelfResult {
  return Array.isArray((result as SearchShelfResult).inventory);
}

function isItemResult(result: SearchShelfResult | SearchItemResult): result is SearchItemResult {
  return Array.isArray((result as SearchItemResult).matches);
}

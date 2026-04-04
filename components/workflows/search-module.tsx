"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ScanLine } from "lucide-react";
import { toast } from "sonner";
import type {
  SearchItemResult,
  SearchShelfResult,
  WorkflowLookupsData
} from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ScannerModal } from "@/components/workflows/scanner-modal";
import { ShelfInput } from "@/components/workflows/shelf-input";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";

type SearchMode = "item" | "shelf";

export function SearchModule({ lookups }: { lookups: WorkflowLookupsData }) {
  const [mode, setMode] = useState<SearchMode>("item");
  const [itemQuery, setItemQuery] = useState("");
  const [shelfQuery, setShelfQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"item" | null>(null);
  const [result, setResult] = useState<
    | { kind: "item"; data: SearchItemResult }
    | { kind: "shelf"; data: SearchShelfResult }
    | null
  >(null);

  const totalQuantity = useMemo(() => {
    if (result?.kind !== "item") {
      return 0;
    }
    return result.data.matches.reduce(
      (sum, match) => sum + match.inventory.quantityAvailable,
      0
    );
  }, [result]);

  async function runSearch(searchMode: SearchMode, rawValue?: string) {
    const value = (rawValue ?? (searchMode === "item" ? itemQuery : shelfQuery)).trim();
    if (!value) {
      toast.error(searchMode === "item" ? "Enter or scan an item first." : "Choose or scan a shelf first.");
      return;
    }

    setLoading(true);
    const response = await fetch(
      `/api/search?type=${searchMode === "item" ? "item" : "shelf"}&query=${encodeURIComponent(value)}`
    );
    const data = (await response.json()) as
      | (SearchShelfResult & { error?: string })
      | (SearchItemResult & { error?: string });
    setLoading(false);
    if (!response.ok) {
      toast.error(data.error || "Search failed.");
      return;
    }

    setResult({
      kind: searchMode,
      data: data as SearchShelfResult & SearchItemResult
    });
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-ink">Find stock fast</h2>
            <p className="mt-2 text-sm text-slate-600">
              Search by shelf or by item from one place.
            </p>
          </div>
          <div className="inline-flex rounded-[20px] border border-slate-200 bg-slate-50 p-1">
            {(["item", "shelf"] as const).map((option) => (
              <button
                className={`rounded-[16px] px-4 py-2.5 text-sm font-semibold transition ${
                  mode === option ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
                key={option}
                onClick={() => setMode(option)}
                type="button"
              >
                {option === "item" ? "Item" : "Shelf"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {mode === "item" ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => setItemQuery(event.target.value)}
                  placeholder="Scan or enter SKU / UPC / barcode / QR"
                  value={itemQuery}
                />
              </div>
              <div className="flex gap-3">
                <Button className="gap-2" onClick={() => setScannerTarget("item")} variant="secondary">
                  <ScanLine className="h-4 w-4" />
                  Scan Item
                </Button>
                <Button disabled={loading} onClick={() => runSearch("item")}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <ShelfInput
                onChange={(value) => setShelfQuery(value)}
                shelves={lookups.shelves || []}
                value={shelfQuery}
              />
              <div className="flex justify-end">
                <Button disabled={loading} onClick={() => runSearch("shelf")}>
                  {loading ? "Searching..." : "Search Shelf"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SurfaceCard>

      {!result ? (
        <EmptyState
          description="Search by item to see stock across shelves, or search by shelf to see what is stored there."
          title="No search yet"
        />
      ) : result.kind === "shelf" ? (
        result.data.shelf ? (
            <div className="space-y-4">
            <SurfaceCard className="rounded-[32px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-bold text-ink">
                    Shelf {result.data.shelf.code}
                  </p>
                  <p className="text-sm text-slate-600">
                    {result.data.location?.name} • {result.data.shelf.zone} / {result.data.shelf.rack}
                  </p>
                </div>
                <StatusBadge value={result.data.shelf.status} />
              </div>
            </SurfaceCard>

            {result.data.inventory.length ? (
              result.data.inventory.map((row) => (
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
                    <Link href="/damage-item" prefetch={false}>
                      <Button variant="ghost">Damage</Button>
                    </Link>
                    <Link href="/repair-item" prefetch={false}>
                      <Button variant="ghost">Repair</Button>
                    </Link>
                    <Link href="/packing" prefetch={false}>
                      <Button variant="ghost">Pack</Button>
                    </Link>
                  </div>
                </SurfaceCard>
              ))
            ) : (
              <EmptyState
                description="This shelf is recognised but currently has no recorded stock."
                title="Shelf is empty"
              />
            )}
          </div>
        ) : (
          <EmptyState description="Try another shelf or scan again." title="Shelf not found" />
        )
      ) : result.data.item ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard className="rounded-[32px] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-3xl font-bold text-ink">
                  {result.data.item.itemName}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {result.data.item.sku} • {result.data.item.upc} • {result.data.item.category}
                </p>
              </div>
              <StatusBadge value={result.data.item.status} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Metric label="Total available quantity" value={formatQuantity(totalQuantity)} />
              <Metric label="Shelf records found" value={formatQuantity(result.data.matches.length)} />
            </div>

            <div className="mt-6 space-y-3">
              {result.data.matches.map((match) => (
                <div
                  className="rounded-[22px] border border-slate-200 bg-white/95 p-4"
                  key={match.inventory.inventoryId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{match.location?.name}</p>
                      <p className="text-sm text-slate-500">
                        Shelf {match.inventory.shelfCode || "Pending"}
                      </p>
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
              {result.data.transactions.length ? (
                result.data.transactions.map((transaction) => (
                  <div className="rounded-[22px] bg-slate-100 p-4" key={transaction.transactionId}>
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
        onClose={() => setScannerTarget(null)}
        onDetected={(value) => {
          if (!scannerTarget) {
            return;
          }
          setItemQuery(value);
          void runSearch("item", value);
          setScannerTarget(null);
        }}
        open={scannerTarget !== null}
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

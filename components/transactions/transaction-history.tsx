"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { TransactionRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/utils/format";

export function TransactionHistory({
  transactions
}: {
  transactions: TransactionRecord[];
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const deferredQuery = useDeferredValue(query);
  const sortedTransactions = useMemo(
    () => [...transactions].sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
    [transactions]
  );
  const filtered = useMemo(() => {
    const normalised = deferredQuery.trim().toLowerCase();
    if (!normalised) {
      return sortedTransactions;
    }
    return sortedTransactions.filter((transaction) =>
      [
        transaction.transactionType,
        transaction.itemName,
        transaction.sku,
        transaction.referenceNumber,
        transaction.shelfCode
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalised))
    );
  }, [deferredQuery, sortedTransactions]);
  const visibleTransactions = filtered.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(30);
  }, [deferredQuery, sortedTransactions]);

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-3xl font-bold text-ink">Transaction History</p>
            <p className="mt-2 text-sm text-slate-600">
              A simple mobile list of warehouse actions, quantities, shelves, and references.
            </p>
          </div>
          <input
            className={inputClassName("md:max-w-xs")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transaction history"
            value={query}
          />
        </div>
      </SurfaceCard>
      <div className="space-y-3">
        {visibleTransactions.map((transaction) => (
          <SurfaceCard className="rounded-[30px] p-5" key={transaction.transactionId}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{transaction.transactionType}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {transaction.itemName || "Stock movement"} • Qty {transaction.quantity}
                </p>
              </div>
              <StatusBadge value={transaction.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
              <p>SKU: {transaction.sku || "-"}</p>
              <p>Shelf: {transaction.shelfCode || "-"}</p>
              <p>Reference: {transaction.referenceNumber || "-"}</p>
              <p>When: {formatDateTime(transaction.timestamp)}</p>
            </div>
          </SurfaceCard>
        ))}
        {filtered.length > visibleTransactions.length ? (
          <Button
            className="w-full"
            onClick={() => setVisibleCount((current) => current + 30)}
            variant="secondary"
          >
            Show more transactions
          </Button>
        ) : null}
      </div>
    </div>
  );
}

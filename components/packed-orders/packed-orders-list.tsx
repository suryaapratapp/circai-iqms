"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PackedOrderListItem } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/utils/format";

export function PackedOrdersList({
  orders
}: {
  orders: PackedOrderListItem[];
}) {
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const users = Array.from(new Set(orders.map((entry) => entry.order.packedByName)));
  const filtered = useMemo(() => {
    return orders.filter((entry) => {
      const queryMatch =
        !query ||
        entry.order.orderNumber.toLowerCase().includes(query.toLowerCase());
      const userMatch = userFilter === "all" || entry.order.packedByName === userFilter;
      const dateMatch =
        !dateFilter || entry.order.packedAt.slice(0, 10) === dateFilter;
      return queryMatch && userMatch && dateMatch;
    });
  }, [dateFilter, orders, query, userFilter]);

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <p className="font-heading text-3xl font-bold text-ink">Packed Orders</p>
            <p className="mt-2 text-sm text-slate-600">
              Search packed orders, review packed lines, and reopen packing slips.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number"
              value={query}
            />
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal"
              onChange={(event) => setUserFilter(event.target.value)}
              value={userFilter}
            >
              <option value="all">All users</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal"
              onChange={(event) => setDateFilter(event.target.value)}
              type="date"
              value={dateFilter}
            />
          </div>
        </div>
      </SurfaceCard>
      <div className="space-y-3">
        {filtered.map((entry) => (
          <SurfaceCard className="rounded-[28px] p-5" key={entry.order.packingOrderId}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-ink">{entry.order.orderNumber}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {entry.order.packedByName} • {formatDateTime(entry.order.packedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/packed-orders/${entry.order.packingOrderId}`}>
                  <Button variant="ghost">Open order</Button>
                </Link>
                <Link href={`/api/packing-orders/${entry.order.packingOrderId}/pdf`} target="_blank">
                  <Button>Open slip</Button>
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Lines" value={String(entry.order.totalLines || entry.itemCount)} />
              <Info label="Quantity" value={String(entry.order.totalQuantity)} />
              <Info label="Location" value={entry.order.locationId} />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

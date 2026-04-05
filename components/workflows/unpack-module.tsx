"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  PackedOrderDetail,
  PackedOrderListItem,
  WorkflowResponse
} from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/utils/format";

export function UnpackModule({
  initialOrders
}: {
  initialOrders: PackedOrderListItem[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [orderQuery, setOrderQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [detail, setDetail] = useState<PackedOrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unpackReason, setUnpackReason] = useState("packing error");
  const [returnDisposition, setReturnDisposition] = useState<"return to stock" | "quarantine">(
    "return to stock"
  );
  const [notes, setNotes] = useState("");
  const [lineQuantities, setLineQuantities] = useState<Record<string, string>>({});

  const selectedOrder = useMemo(
    () => orders.find((entry) => entry.order.packingOrderId === selectedOrderId),
    [orders, selectedOrderId]
  );
  const unpackRows = useMemo(() => {
    if (!detail) {
      return [];
    }

    return detail.items
      .map((item) => {
        const requestedQuantity = Number(lineQuantities[item.packingOrderItemId] || 0);
        return {
          packingOrderItemId: item.packingOrderItemId,
          itemId: item.itemId,
          shelfCode: item.shelfCode,
          sku: item.sku,
          quantity: Number.isFinite(requestedQuantity) ? requestedQuantity : 0
        };
      })
      .filter((row) => row.quantity > 0);
  }, [detail, lineQuantities]);

  const orderOptions = useMemo(
    () =>
      orders.map((entry) => ({
        value: entry.order.orderNumber,
        label: entry.order.orderNumber,
        description: `${entry.order.packedByName} • ${formatDateTime(entry.order.packedAt)} • ${entry.order.status}`,
        searchText: `${entry.order.orderNumber} ${entry.order.packedByName} ${entry.order.locationId} ${entry.order.status}`
      })),
    [orders]
  );

  async function loadOrder(orderNumber: string) {
    const match = orders.find((entry) => entry.order.orderNumber === orderNumber);
    if (!match) {
      setSelectedOrderId("");
      setDetail(null);
      return;
    }

    setSelectedOrderId(match.order.packingOrderId);
    setLoadingOrder(true);
    const response = await fetch(`/api/packed-orders/${match.order.packingOrderId}`);
    const data = (await response.json()) as PackedOrderDetail & { error?: string };
    setLoadingOrder(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to load packed order.");
      return;
    }

    setDetail(data);
    setLineQuantities({});
  }

  async function submitUnpack() {
    if (!selectedOrderId || !detail) {
      toast.error("Select a packed order first.");
      return;
    }

    if (!unpackRows.length) {
      toast.error("Enter a quantity to unpack for at least one item.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/workflows/unpack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        packingOrderId: selectedOrderId,
        unpackReason,
        returnDisposition,
        notes,
        rows: unpackRows
      })
    });
    const data = (await response.json()) as WorkflowResponse & { error?: string };
    setSaving(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to unpack this order.");
      return;
    }

    toast.success(data.message);
    setNotes("");
    setLineQuantities({});

    if (data.packingOrder) {
      setOrders((current) =>
        current.map((entry) =>
          entry.order.packingOrderId === data.packingOrder?.packingOrderId
            ? {
                ...entry,
                order: data.packingOrder,
                packedByName: data.packingOrder.packedByName
              }
            : entry
        )
      );
    }

    if (selectedOrder) {
      await loadOrder(selectedOrder.order.orderNumber);
    }
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Unpack
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-ink">Select packed order</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose the packed order first, then unpack one or more items from that order.
            </p>
          </div>
          <Field label="Packed Order">
            <SearchableSelect
              emptyMessage="No matching packed orders."
              onChange={(value) => setOrderQuery(value)}
              onOptionSelect={(value) => {
                void loadOrder(value);
              }}
              options={orderOptions}
              placeholder="Search by order number"
              value={orderQuery}
            />
          </Field>
          <div className="flex justify-end">
            <Button
              disabled={loadingOrder || !orderQuery.trim()}
              onClick={() => loadOrder(orderQuery)}
            >
              {loadingOrder ? "Loading..." : "Load order"}
            </Button>
          </div>
        </div>
      </SurfaceCard>

      {detail ? (
        <>
          <SurfaceCard className="rounded-[32px] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-heading text-2xl font-bold text-ink">
                  {detail.order.orderNumber}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {detail.location?.name || detail.order.locationId} • Packed by {detail.order.packedByName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDateTime(detail.order.packedAt)}
                </p>
              </div>
              <StatusBadge value={detail.order.status || "packed"} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Unpack Reason">
                <select
                  className={inputClassName()}
                  onChange={(event) => setUnpackReason(event.target.value)}
                  value={unpackReason}
                >
                  <option value="packing error">Packing error</option>
                  <option value="customer return">Customer return</option>
                  <option value="damaged after pack">Damaged after pack</option>
                  <option value="relabelling required">Relabelling required</option>
                  <option value="quality issue">Quality issue</option>
                </select>
              </Field>
              <Field label="Return Disposition">
                <select
                  className={inputClassName()}
                  onChange={(event) =>
                    setReturnDisposition(event.target.value as "return to stock" | "quarantine")
                  }
                  value={returnDisposition}
                >
                  <option value="return to stock">Return to stock</option>
                  <option value="quarantine">Quarantine</option>
                </select>
              </Field>
              <Field label="Notes">
                <input
                  className={inputClassName()}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional unpack notes"
                  value={notes}
                />
              </Field>
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            {detail.items.map((item) => {
              const unpackedQuantity = Number(item.unpackedQuantity || 0);
              const remainingQuantity = Math.max(0, item.quantity - unpackedQuantity);
              return (
                <SurfaceCard className="rounded-[28px] p-5" key={item.packingOrderItemId}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{item.productName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.sku} • Shelf {item.shelfCode}
                      </p>
                    </div>
                    {remainingQuantity === 0 ? (
                      <StatusBadge value="unpacked" />
                    ) : unpackedQuantity > 0 ? (
                      <StatusBadge value="partially unpacked" />
                    ) : (
                      <StatusBadge value="packed" />
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Metric label="Packed quantity" value={String(item.quantity)} />
                    <Metric label="Already unpacked" value={String(unpackedQuantity)} />
                    <Metric label="Remaining" value={String(remainingQuantity)} />
                    <Field label="Unpack Quantity">
                      <input
                        className={inputClassName()}
                        disabled={remainingQuantity === 0}
                        max={remainingQuantity}
                        min={0}
                        onChange={(event) =>
                          setLineQuantities((current) => ({
                            ...current,
                            [item.packingOrderItemId]: event.target.value
                          }))
                        }
                        placeholder="0"
                        type="number"
                        value={lineQuantities[item.packingOrderItemId] || ""}
                      />
                    </Field>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="sticky bottom-24 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Button
              className="w-full sm:w-auto"
              disabled={saving || !unpackRows.length}
              onClick={submitUnpack}
            >
              {saving ? "Saving..." : "Confirm unpack"}
            </Button>
          </div>
        </>
      ) : null}
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

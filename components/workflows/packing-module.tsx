"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowLookupsData } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field, inputClassName } from "@/components/ui/field";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ItemSelect } from "@/components/workflows/item-select";
import { ShelfInput } from "@/components/workflows/shelf-input";

interface PackingRow {
  code: string;
  shelfCode: string;
  quantity: string;
}

const blankRow = (): PackingRow => ({
  code: "",
  shelfCode: "",
  quantity: ""
});

export function PackingModule({
  lookups,
  initialLocationId
}: {
  lookups: WorkflowLookupsData;
  initialLocationId: string;
}) {
  const [locationId, setLocationId] = useState(initialLocationId);
  const [rows, setRows] = useState<PackingRow[]>([blankRow()]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{
    orderNumber: string;
    pdfUrl: string;
  } | null>(null);
  const shelves = (lookups.shelves || []).filter((shelf) => shelf.locationId === locationId);

  async function submitOrder() {
    const validRows = rows.filter(
      (row) => row.code.trim() && row.shelfCode.trim() && Number(row.quantity) > 0
    );
    if (!validRows.length) {
      toast.error("Add at least one packing line.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/packing-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        locationId,
        notes,
        rows: validRows.map((row) => ({
          ...row,
          quantity: Number(row.quantity)
        }))
      })
    });
    const data = (await response.json()) as {
      error?: string;
      order?: { packingOrderId: string; orderNumber: string };
    };
    setSaving(false);
    if (!response.ok || !data.order) {
      toast.error(data.error || "Unable to pack this order.");
      return;
    }
    setCreatedOrder({
      orderNumber: data.order.orderNumber,
      pdfUrl: `/api/packing-orders/${data.order.packingOrderId}/pdf`
    });
    setConfirmOpen(false);
    setRows([blankRow()]);
    setNotes("");
    toast.success(`Pack order ${data.order.orderNumber} confirmed.`);
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-3xl font-bold text-ink">Pack Order</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
            Scan item, choose shelf, confirm quantity, and pack.
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Location">
            <select
              className={inputClassName()}
              onChange={(event) => setLocationId(event.target.value)}
              value={locationId}
            >
              {lookups.locations.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <input
              className={inputClassName()}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Pack order notes"
              value={notes}
            />
          </Field>
        </div>
      </SurfaceCard>

      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-2xl font-bold text-ink">Pack order lines</p>
          <Button
            className="gap-2"
            onClick={() => setRows((current) => [...current, blankRow()])}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Add line
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {rows.map((row, index) => (
            <div className="rounded-[28px] border border-blue-100 bg-white p-4" key={index}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-ink">Line {index + 1}</p>
                {rows.length > 1 ? (
                  <button
                    className="rounded-full bg-slate-100 p-2 text-slate-500"
                    onClick={() =>
                      setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
                    }
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Scan Item">
                  <ItemSelect
                    items={lookups.items || []}
                    onChange={(value) =>
                      setRows((current) =>
                        current.map((entry, rowIndex) =>
                          rowIndex === index ? { ...entry, code: value } : entry
                        )
                      )
                    }
                    placeholder="Scan, search, or select item"
                    value={row.code}
                  />
                </Field>
                <Field label="Scan Shelf">
                  <ShelfInput
                    onChange={(value) =>
                      setRows((current) =>
                        current.map((entry, rowIndex) =>
                          rowIndex === index ? { ...entry, shelfCode: value } : entry
                        )
                      )
                    }
                    shelves={shelves}
                    value={row.shelfCode}
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    className={inputClassName()}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((entry, rowIndex) =>
                          rowIndex === index
                            ? { ...entry, quantity: event.target.value }
                            : entry
                        )
                      )
                    }
                    type="number"
                    value={row.quantity}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setConfirmOpen(true)}>Pack Order</Button>
          {createdOrder ? (
            <Link href={createdOrder.pdfUrl} target="_blank">
              <Button variant="ghost">Open packing slip</Button>
            </Link>
          ) : null}
        </div>
        {createdOrder ? (
          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-4 text-sm text-slate-700">
            Pack order {createdOrder.orderNumber} confirmed. The packing slip is ready for preview or print.
          </div>
        ) : null}
      </SurfaceCard>

      <ConfirmModal
        confirmLabel={saving ? "Saving pack order..." : "Confirm pack order"}
        description="Review the lines below before stock is reduced."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submitOrder}
        open={confirmOpen}
        title="Confirm pack order"
      >
        <div className="space-y-2 text-sm text-slate-600">
          {rows
            .filter((row) => row.code && row.shelfCode && Number(row.quantity) > 0)
            .map((row, index) => (
              <div className="rounded-2xl bg-slate-100 p-3" key={`${row.code}-${index}`}>
                <p className="font-semibold text-ink">{row.code}</p>
                <p>
                  Shelf {row.shelfCode} • Qty {row.quantity}
                </p>
              </div>
            ))}
        </div>
      </ConfirmModal>
    </div>
  );
}

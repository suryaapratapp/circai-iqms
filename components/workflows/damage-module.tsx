"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { InventoryListItem, WorkflowLookupsData } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ItemSelect } from "@/components/workflows/item-select";
import { ShelfInput } from "@/components/workflows/shelf-input";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesItemCode(code: string, row: InventoryListItem) {
  const normalized = normalize(code);
  return [row.item.itemId, row.item.sku, row.item.upc, row.item.qrCode, row.item.itemName]
    .filter(Boolean)
    .some((value) => normalize(String(value)) === normalized);
}

export function DamageModule({
  lookups,
  rows,
  initialLocationId
}: {
  lookups: WorkflowLookupsData;
  rows: InventoryListItem[];
  initialLocationId: string;
}) {
  const [locationId, setLocationId] = useState(initialLocationId);
  const [code, setCode] = useState("");
  const [shelfCode, setShelfCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [damageOutcome, setDamageOutcome] = useState<"to repair" | "beyond repair">(
    "to repair"
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const availableRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.inventory.locationId === locationId &&
          row.inventory.quantityAvailable > 0
      ),
    [locationId, rows]
  );

  const availableItems = useMemo(() => {
    const seen = new Set<string>();
    return availableRows
      .filter((row) => {
        if (seen.has(row.item.itemId)) {
          return false;
        }
        seen.add(row.item.itemId);
        return true;
      })
      .map((row) => row.item);
  }, [availableRows]);

  const matchingRows = useMemo(() => {
    if (!code.trim()) {
      return [];
    }
    return availableRows.filter((row) => matchesItemCode(code, row));
  }, [availableRows, code]);

  const shelves = useMemo(
    () =>
      (lookups.shelves || []).filter((shelf) =>
        matchingRows.some(
          (row) => normalize(row.inventory.shelfCode || "") === normalize(shelf.code)
        )
      ),
    [lookups.shelves, matchingRows]
  );

  const selectedRow = useMemo(
    () =>
      matchingRows.find(
        (row) => normalize(row.inventory.shelfCode || "") === normalize(shelfCode)
      ),
    [matchingRows, shelfCode]
  );

  function validateItemSelection(nextCode: string) {
    if (!nextCode.trim()) {
      return;
    }
    if (!availableRows.some((row) => matchesItemCode(nextCode, row))) {
      toast.error("This item does not have available stock at the selected location.");
    }
  }

  async function submitDamage() {
    if (!code.trim() || !shelfCode.trim()) {
      toast.error("Item and shelf are required.");
      return;
    }
    if (!Number(quantity) || Number(quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/workflows/damage-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        locationId,
        code,
        shelfCode,
        quantity: Number(quantity),
        damageOutcome,
        notes: notes || undefined
      })
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setSaving(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to save damage.");
      return;
    }

    toast.success(data.message || "Damage saved.");
    setCode("");
    setShelfCode("");
    setQuantity("");
    setDamageOutcome("to repair");
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Damage Item
          </p>
          <div>
            <h2 className="font-heading text-3xl font-bold text-ink">Mark damaged stock</h2>
            <p className="mt-2 text-sm text-slate-600">
              Reduce available stock from the selected shelf and choose the damage outcome.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Location">
            <select
              className={inputClassName()}
              onChange={(event) => {
                setLocationId(event.target.value);
                setCode("");
                setShelfCode("");
              }}
              value={locationId}
            >
              {lookups.locations.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scan or select item">
            <ItemSelect
              items={availableItems}
              onBlur={() => validateItemSelection(code)}
              onChange={(value) => {
                setCode(value);
                setShelfCode("");
              }}
              onDetected={(value) => validateItemSelection(value)}
              onOptionSelect={(value) => validateItemSelection(value)}
              placeholder="Scan, search, or select item"
              value={code}
            />
          </Field>

          <Field label="Shelf">
            <ShelfInput onChange={setShelfCode} shelves={shelves} value={shelfCode} />
          </Field>

          <Field label="Quantity">
            <input
              className={inputClassName()}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              type="number"
              value={quantity}
            />
          </Field>

          <Field label="Damage outcome">
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: "To Repair", value: "to repair" },
                { label: "Beyond Repair", value: "beyond repair" }
              ] as const).map((option) => (
                <button
                  className={`rounded-[16px] border px-3 py-3 text-sm font-semibold transition ${
                    damageOutcome === option.value
                      ? "border-blue-200 bg-blue-50 text-teal"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/70"
                  }`}
                  key={option.value}
                  onClick={() => setDamageOutcome(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="md:col-span-2">
            <Field label="Notes (optional)">
              <textarea
                className={inputClassName("min-h-24")}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional damage note"
                value={notes}
              />
            </Field>
          </div>
        </div>

        {selectedRow ? (
          <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-slate-700">
            Available on shelf {selectedRow.inventory.shelfCode}: {selectedRow.inventory.quantityAvailable}
          </div>
        ) : null}

        <div className="sticky bottom-24 mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <Button className="w-full sm:w-auto" disabled={saving} onClick={submitDamage}>
            {saving ? "Saving..." : "Confirm damage"}
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}

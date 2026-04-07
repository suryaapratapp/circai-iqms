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

function matchesItemCode(
  code: string,
  row: InventoryListItem
) {
  const normalized = normalize(code);
  return [row.item.itemId, row.item.sku, row.item.upc, row.item.qrCode, row.item.itemName]
    .filter(Boolean)
    .some((value) => normalize(String(value)) === normalized);
}

export function MoveModule({
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
  const [sourceShelfCode, setSourceShelfCode] = useState("");
  const [destinationShelfCode, setDestinationShelfCode] = useState("");
  const [quantity, setQuantity] = useState("");
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

  const sourceShelves = useMemo(
    () =>
      (lookups.shelves || []).filter((shelf) =>
        matchingRows.some(
          (row) => normalize(row.inventory.shelfCode || "") === normalize(shelf.code)
        )
      ),
    [lookups.shelves, matchingRows]
  );

  const destinationShelves = useMemo(
    () =>
      (lookups.shelves || []).filter(
        (shelf) =>
          shelf.locationId === locationId &&
          normalize(shelf.code) !== normalize(sourceShelfCode)
      ),
    [locationId, lookups.shelves, sourceShelfCode]
  );

  const sourceShelfRow = useMemo(
    () =>
      matchingRows.find(
        (row) => normalize(row.inventory.shelfCode || "") === normalize(sourceShelfCode)
      ),
    [matchingRows, sourceShelfCode]
  );

  function validateItemSelection(nextCode: string) {
    if (!nextCode.trim()) {
      return;
    }
    const matched = availableRows.some((row) => matchesItemCode(nextCode, row));
    if (!matched) {
      toast.error("This item is not available on any shelf at the selected location.");
    }
  }

  async function submitMove() {
    if (!code.trim()) {
      toast.error("Item is required.");
      return;
    }
    if (!sourceShelfCode.trim() || !destinationShelfCode.trim()) {
      toast.error("Choose both the current shelf and the destination shelf.");
      return;
    }
    if (normalize(sourceShelfCode) === normalize(destinationShelfCode)) {
      toast.error("Source and destination shelf must be different.");
      return;
    }
    if (!Number(quantity) || Number(quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/workflows/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        locationId,
        code,
        shelfCode: sourceShelfCode,
        destinationShelfCode,
        quantity: Number(quantity),
        notes: notes || undefined
      })
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setSaving(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to move stock.");
      return;
    }

    toast.success(data.message || "Stock moved successfully.");
    setCode("");
    setSourceShelfCode("");
    setDestinationShelfCode("");
    setQuantity("");
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Move
          </p>
          <div>
            <h2 className="font-heading text-3xl font-bold text-ink">Move stock between shelves</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose the current shelf, the destination shelf, and the quantity to move.
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
                setSourceShelfCode("");
                setDestinationShelfCode("");
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
                setSourceShelfCode("");
              }}
              onDetected={(value) => validateItemSelection(value)}
              onOptionSelect={(value) => validateItemSelection(value)}
              placeholder="Scan, search, or select item"
              value={code}
            />
          </Field>

          <Field label="Current shelf">
            <ShelfInput
              onChange={setSourceShelfCode}
              shelves={sourceShelves}
              value={sourceShelfCode}
            />
          </Field>

          <Field label="Destination shelf">
            <ShelfInput
              onChange={setDestinationShelfCode}
              shelves={destinationShelves}
              value={destinationShelfCode}
            />
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

          <Field label="Notes (optional)">
            <input
              className={inputClassName()}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional move note"
              value={notes}
            />
          </Field>
        </div>

        {sourceShelfRow ? (
          <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-slate-700">
            Available on shelf {sourceShelfRow.inventory.shelfCode}: {sourceShelfRow.inventory.quantityAvailable}
          </div>
        ) : null}

        <div className="sticky bottom-24 mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <Button className="w-full sm:w-auto" disabled={saving} onClick={submitMove}>
            {saving ? "Moving..." : "Confirm move"}
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}

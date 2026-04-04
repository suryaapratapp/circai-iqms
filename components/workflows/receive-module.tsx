"use client";

import { useMemo, useState } from "react";
import { Camera, Plus, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SearchItemResult, WorkflowLookupsData } from "@/lib/data/repository";
import type { QualityResult } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field, inputClassName } from "@/components/ui/field";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ScannerModal } from "@/components/workflows/scanner-modal";
import { ShelfInput } from "@/components/workflows/shelf-input";

interface LineDraft {
  code: string;
  productName: string;
  quantityReceived: string;
  shelfCode: string;
  qualityResult: QualityResult;
  disposition: "quarantine" | "damaged" | "repair";
  defectCategory: string;
  batchLot: string;
  expiryDate: string;
  notes: string;
}

const emptyLine = (): LineDraft => ({
  code: "",
  productName: "",
  quantityReceived: "",
  shelfCode: "",
  qualityResult: "pass",
  disposition: "quarantine",
  defectCategory: "",
  batchLot: "",
  expiryDate: "",
  notes: ""
});

export function ReceiveModule({
  lookups,
  initialLocationId
}: {
  lookups: WorkflowLookupsData;
  initialLocationId: string;
}) {
  const [locationId, setLocationId] = useState(initialLocationId);
  const [supplierName, setSupplierName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poPhotoFileId, setPoPhotoFileId] = useState<string | undefined>();
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [scannerIndex, setScannerIndex] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canShowLines = supplierName.trim() && poNumber.trim();
  const shelves = useMemo(
    () => (lookups.shelves || []).filter((shelf) => shelf.locationId === locationId),
    [locationId, lookups.shelves]
  );

  async function fillItem(index: number, code: string) {
    const response = await fetch(
      `/api/search?type=item&query=${encodeURIComponent(code)}`
    );
    const data = (await response.json()) as SearchItemResult & { error?: string };
    if (!response.ok || !data.item) {
      toast.error(data.error || "Item not found.");
      return;
    }
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, code, productName: data.item?.itemName || line.productName }
          : line
      )
    );
  }

  async function uploadPoPhoto(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("referenceType", "po-photo");
    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData
    });
    const data = (await response.json()) as { fileId?: string; error?: string };
    if (!response.ok || !data.fileId) {
      toast.error(data.error || "Unable to upload PO photo.");
      return;
    }
    setPoPhotoFileId(data.fileId);
    toast.success("PO photo uploaded.");
  }

  async function submitReceipt() {
    const validLines = lines.filter(
      (line) =>
        line.code.trim() &&
        line.shelfCode.trim() &&
        Number(line.quantityReceived) > 0
    );
    if (!validLines.length) {
      toast.error("Add at least one item with a shelf and quantity before confirming.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/receipts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        supplierName,
        poNumber,
        locationId,
        poPhotoFileId,
        notes: poNotes,
        lines: validLines.map((line) => ({
          code: line.code,
          shelfCode: line.shelfCode,
          quantityReceived: Number(line.quantityReceived),
          qualityResult: line.qualityResult,
          disposition: line.qualityResult === "fail" ? line.disposition : undefined,
          defectCategory: line.defectCategory || undefined,
          batchLot: line.batchLot || undefined,
          expiryDate: line.expiryDate || undefined,
          notes: line.notes || undefined
        }))
      })
    });
    const data = (await response.json()) as { error?: string; receiptId?: string };
    setSaving(false);
    if (!response.ok) {
      toast.error(data.error || "Unable to save receipt.");
      return;
    }

    toast.success(`Receipt ${poNumber} saved successfully.`);
    setConfirmOpen(false);
    setSupplierName("");
    setPoNumber("");
    setPoNotes("");
    setPoPhotoFileId(undefined);
    setLines([emptyLine()]);
  }

  function updateLine(index: number, nextValue: Partial<LineDraft>) {
    setLines((current) =>
      current.map((entry, lineIndex) =>
        lineIndex === index ? { ...entry, ...nextValue } : entry
      )
    );
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Receive
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-ink">PO details</p>
            <p className="mt-2 text-sm text-slate-600">
              Enter the supplier and PO first, then receive each item straight onto its shelf.
            </p>
          </div>
          <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700">
            Supplier Name and PO Number unlock the receipt lines below.
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
          <Field label="Supplier Name">
            <input
              className={inputClassName()}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="Supplier Name"
              value={supplierName}
            />
          </Field>
          <Field label="PO Number">
            <input
              className={inputClassName()}
              onChange={(event) => setPoNumber(event.target.value)}
              placeholder="PO Number"
              value={poNumber}
            />
          </Field>
          <Field label="Upload PO Photo (optional)">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Camera className="h-4 w-4 text-teal" />
              <span>{poPhotoFileId ? "PO photo uploaded" : "Choose image"}</span>
              <input
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    uploadPoPhoto(file);
                  }
                }}
                type="file"
              />
            </label>
          </Field>
          <div className="md:col-span-2">
            <Field label="PO Notes">
              <textarea
                className={inputClassName("min-h-24")}
                onChange={(event) => setPoNotes(event.target.value)}
                placeholder="Optional PO-level notes"
                value={poNotes}
              />
            </Field>
          </div>
        </div>
      </SurfaceCard>

      {canShowLines ? (
        <SurfaceCard className="rounded-[34px] p-6 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-2xl font-bold text-ink">Receipt lines</p>
              <p className="text-sm text-slate-600">
                Scan, check, confirm, and continue.
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => setLines((current) => [...current, emptyLine()])}
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {lines.map((line, index) => (
              <div className="rounded-[28px] border border-slate-200 bg-white/95 p-4 md:p-5" key={index}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">Item {index + 1}</p>
                  {lines.length > 1 ? (
                    <button
                      className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                      onClick={() =>
                        setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
                      }
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Scan item or search SKU">
                    <div className="flex gap-3">
                      <input
                        className={inputClassName()}
                        onBlur={() => line.code && fillItem(index, line.code)}
                        onChange={(event) => updateLine(index, { code: event.target.value })}
                        placeholder="Scan item"
                        value={line.code}
                      />
                      <Button onClick={() => setScannerIndex(index)} variant="ghost">
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </Field>

                  <Field label="Product Name">
                    <input
                      className={inputClassName("bg-white")}
                      onChange={(event) =>
                        updateLine(index, { productName: event.target.value })
                      }
                      placeholder="Auto-fills when item is found"
                      value={line.productName}
                    />
                  </Field>

                  <Field label="Quantity received">
                    <input
                      className={inputClassName()}
                      onChange={(event) =>
                        updateLine(index, { quantityReceived: event.target.value })
                      }
                      placeholder="0"
                      type="number"
                      value={line.quantityReceived}
                    />
                  </Field>

                  <Field label="Shelf">
                    <ShelfInput
                      onChange={(value) => updateLine(index, { shelfCode: value })}
                      shelves={shelves}
                      value={line.shelfCode}
                    />
                  </Field>

                  <Field label="Quick quality check">
                    <div className="grid grid-cols-3 gap-2">
                      {(["pass", "fail", "hold"] as const).map((option) => (
                        <button
                          className={`rounded-[16px] border px-3 py-3 text-sm font-semibold transition ${
                            line.qualityResult === option
                              ? option === "pass"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : option === "fail"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/70"
                          }`}
                          key={option}
                          onClick={() =>
                            updateLine(index, {
                              qualityResult: option,
                              disposition: option === "fail" ? line.disposition : "quarantine"
                            })
                          }
                          type="button"
                        >
                          {option[0].toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {line.qualityResult === "fail" ? (
                    <Field label="Fail disposition">
                      <div className="grid grid-cols-3 gap-2">
                        {(["quarantine", "damaged", "repair"] as const).map((option) => (
                          <button
                            className={`rounded-[16px] border px-3 py-3 text-sm font-semibold transition ${
                              line.disposition === option
                                ? "border-blue-200 bg-blue-50 text-teal"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/70"
                            }`}
                            key={option}
                            onClick={() =>
                              updateLine(index, {
                                disposition: option
                              })
                            }
                            type="button"
                          >
                            {option === "quarantine"
                              ? "Quarantine"
                              : option === "damaged"
                                ? "Damaged"
                                : "Repair"}
                          </button>
                        ))}
                      </div>
                    </Field>
                  ) : (
                    <Field label="Quality status">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        {line.qualityResult === "pass"
                          ? "Stock will go straight into available shelf stock."
                          : "Stock will go into hold / quarantine on this shelf."}
                      </div>
                    </Field>
                  )}

                  <Field label="Defect category (optional)">
                    <select
                      className={inputClassName()}
                      onChange={(event) =>
                        updateLine(index, { defectCategory: event.target.value })
                      }
                      value={line.defectCategory}
                    >
                      <option value="">Select defect category</option>
                      <option value="packaging condition">Packaging condition</option>
                      <option value="labelling present">Labelling present</option>
                      <option value="stitching quality">Stitching quality</option>
                      <option value="contamination visible">Contamination visible</option>
                      <option value="rfid/tag present">RFID / tag present</option>
                      <option value="correct item / sku">Correct item / SKU</option>
                      <option value="quantity match">Quantity match</option>
                      <option value="clean / acceptable condition">Clean / acceptable condition</option>
                    </select>
                  </Field>

                  <Field label="Batch / lot number">
                    <input
                      className={inputClassName()}
                      onChange={(event) => updateLine(index, { batchLot: event.target.value })}
                      value={line.batchLot}
                    />
                  </Field>

                  <Field label="Expiry date">
                    <input
                      className={inputClassName()}
                      onChange={(event) => updateLine(index, { expiryDate: event.target.value })}
                      type="date"
                      value={line.expiryDate}
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Notes">
                      <textarea
                        className={inputClassName("min-h-24")}
                        onChange={(event) => updateLine(index, { notes: event.target.value })}
                        placeholder="Optional quality or receipt notes"
                        value={line.notes}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-24 mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Button className="w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
              Confirm receipt
            </Button>
          </div>
        </SurfaceCard>
      ) : null}

      <ScannerModal
        onClose={() => setScannerIndex(null)}
        onDetected={(value) => {
          if (scannerIndex === null) {
            return;
          }
          fillItem(scannerIndex, value);
          setScannerIndex(null);
        }}
        open={scannerIndex !== null}
      />

      <ConfirmModal
        confirmLabel={saving ? "Saving..." : "Confirm receipt"}
        description={`PO ${poNumber} from ${supplierName}`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submitReceipt}
        open={confirmOpen}
        title="Confirm receipt"
      >
        <div className="space-y-2 text-sm text-slate-600">
          {lines
            .filter((line) => line.code && line.shelfCode && Number(line.quantityReceived) > 0)
            .map((line, index) => (
              <div className="rounded-[20px] bg-slate-100 p-3" key={`${line.code}-${index}`}>
                <p className="font-semibold text-ink">{line.productName || line.code}</p>
                <p>
                  Qty {line.quantityReceived} • Shelf {line.shelfCode}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Quick quality: {line.qualityResult}
                  {line.qualityResult === "fail" ? ` • ${line.disposition}` : ""}
                </p>
              </div>
            ))}
        </div>
      </ConfirmModal>
    </div>
  );
}

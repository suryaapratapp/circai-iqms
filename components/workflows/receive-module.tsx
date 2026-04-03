"use client";

import { useMemo, useState } from "react";
import { Camera, Plus, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LookupsData, SearchItemResult } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field, inputClassName } from "@/components/ui/field";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ScannerModal } from "@/components/workflows/scanner-modal";

interface LineDraft {
  code: string;
  productName: string;
  quantityReceived: string;
  shelfCode: string;
  conditionOnArrival: string;
  batchLot: string;
  expiryDate: string;
  notes: string;
}

const emptyLine = (): LineDraft => ({
  code: "",
  productName: "",
  quantityReceived: "",
  shelfCode: "",
  conditionOnArrival: "Good",
  batchLot: "",
  expiryDate: "",
  notes: ""
});

export function ReceiveModule({
  lookups,
  initialLocationId
}: {
  lookups: LookupsData;
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
    () => lookups.shelves.filter((shelf) => shelf.locationId === locationId),
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
      (line) => line.code.trim() && Number(line.quantityReceived) > 0
    );
    if (!validLines.length) {
      toast.error("Add at least one item before confirming the receipt.");
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
          ...line,
          quantityReceived: Number(line.quantityReceived)
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

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-3xl font-bold text-ink">Receive</p>
            <p className="mt-2 text-sm text-slate-600">
              Start with the PO header, then add one or more receipt lines under the same PO.
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
            Supplier Name and PO Number are required before items appear.
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
        <SurfaceCard className="rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-2xl font-bold text-ink">Receipt lines</p>
              <p className="text-sm text-slate-600">
                Keep the PO header fixed and add as many items as needed.
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => setLines((current) => [...current, emptyLine()])}
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Add another item
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {lines.map((line, index) => (
              <div className="rounded-[28px] border border-blue-100 bg-white p-4" key={index}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">Item {index + 1}</p>
                  {lines.length > 1 ? (
                    <button
                      className="rounded-full bg-slate-100 p-2 text-slate-500"
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
                  <Field label="Scan item or manual SKU search">
                    <div className="flex gap-3">
                      <input
                        className={inputClassName()}
                        onBlur={() => line.code && fillItem(index, line.code)}
                        onChange={(event) =>
                          setLines((current) =>
                            current.map((entry, lineIndex) =>
                              lineIndex === index
                                ? { ...entry, code: event.target.value }
                                : entry
                            )
                          )
                        }
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
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, productName: event.target.value }
                              : entry
                          )
                        )
                      }
                      placeholder="Auto-fills when item is found"
                      value={line.productName}
                    />
                  </Field>
                  <Field label="Quantity received">
                    <input
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, quantityReceived: event.target.value }
                              : entry
                          )
                        )
                      }
                      placeholder="0"
                      type="number"
                      value={line.quantityReceived}
                    />
                  </Field>
                  <Field label="Shelf">
                    <select
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, shelfCode: event.target.value }
                              : entry
                          )
                        )
                      }
                      value={line.shelfCode}
                    >
                      <option value="">Select shelf</option>
                      {shelves.map((shelf) => (
                        <option key={shelf.shelfId} value={shelf.code}>
                          {shelf.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Condition on arrival">
                    <select
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, conditionOnArrival: event.target.value }
                              : entry
                          )
                        )
                      }
                      value={line.conditionOnArrival}
                    >
                      <option>Good</option>
                      <option>Minor issue</option>
                      <option>Damaged</option>
                    </select>
                  </Field>
                  <Field label="Batch / lot number">
                    <input
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, batchLot: event.target.value }
                              : entry
                          )
                        )
                      }
                      value={line.batchLot}
                    />
                  </Field>
                  <Field label="Expiry date">
                    <input
                      className={inputClassName()}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry, lineIndex) =>
                            lineIndex === index
                              ? { ...entry, expiryDate: event.target.value }
                              : entry
                          )
                        )
                      }
                      type="date"
                      value={line.expiryDate}
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Notes">
                      <textarea
                        className={inputClassName("min-h-24")}
                        onChange={(event) =>
                          setLines((current) =>
                            current.map((entry, lineIndex) =>
                              lineIndex === index
                                ? { ...entry, notes: event.target.value }
                                : entry
                            )
                          )
                        }
                        value={line.notes}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setConfirmOpen(true)}>Confirm receipt</Button>
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
            .filter((line) => line.code && Number(line.quantityReceived) > 0)
            .map((line, index) => (
              <div className="rounded-2xl bg-slate-100 p-3" key={`${line.code}-${index}`}>
                <p className="font-semibold text-ink">
                  {line.productName || line.code}
                </p>
                <p>
                  Qty {line.quantityReceived} • Shelf {line.shelfCode || "Not set"}
                </p>
              </div>
            ))}
        </div>
      </ConfirmModal>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { workflowDefinitions } from "@/lib/config/workflows";
import type { WorkflowType } from "@/lib/data/types";
import type {
  SearchItemResult,
  WorkflowLookupsData,
  WorkflowResponse
} from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ItemSelect } from "@/components/workflows/item-select";
import { ShelfInput } from "@/components/workflows/shelf-input";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";

type FormValue = string | boolean;

function defaultValues(locationId?: string) {
  return {
    locationId: locationId || "",
    code: "",
    quantity: "",
    countedQuantity: "",
    notes: "",
    blindCount: false,
    damagedOnArrival: false
  } as Record<string, FormValue>;
}

export function WorkflowModule({
  workflow,
  lookups,
  initialLocationId
}: {
  workflow: WorkflowType;
  lookups: WorkflowLookupsData;
  initialLocationId: string;
}) {
  const definition = workflowDefinitions[workflow];
  const [values, setValues] = useState<Record<string, FormValue>>(
    defaultValues(initialLocationId)
  );
  const [preview, setPreview] = useState<SearchItemResult | null>(null);
  const [lastResponse, setLastResponse] = useState<WorkflowResponse | null>(null);
  const [pending, setPending] = useState(false);

  const fieldOptions = useMemo(
    () => ({
      locations: lookups.locations.map((location) => ({
        label: location.name,
        value: location.locationId
      })),
      reasonCodes: (lookups.reasonCodes || []).map((reasonCode) => ({
        label: `${reasonCode.code} • ${reasonCode.label}`,
        value: reasonCode.code
      })),
      qualityTemplates: (lookups.qualityTemplates || []).map((template) => ({
        label: template.name,
        value: template.templateId
      })),
      users: []
    }),
    [lookups]
  );
  const availableShelves = useMemo(
    () =>
      (lookups.shelves || []).filter(
        (shelf) =>
          shelf.locationId === String(values.locationId || initialLocationId)
      ),
    [initialLocationId, lookups.shelves, values.locationId]
  );

  async function loadPreview(code: string) {
    if (!code.trim()) {
      return;
    }

    const response = await fetch(
      `/api/search?type=item&query=${encodeURIComponent(code.trim())}`
    );
    const data = (await response.json()) as SearchItemResult & { error?: string };
    if (!response.ok || !data.item) {
      setPreview(null);
      toast.error(data.error || "Item not found.");
      return;
    }
    setPreview(data);
  }

  function updateValue(name: string, value: FormValue) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit() {
    setPending(true);
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value])
    );

    const response = await fetch(`/api/workflows/${workflow}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as WorkflowResponse & { error?: string };
    setPending(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to save transaction.");
      return;
    }

    setLastResponse(data);
    toast.success(data.message);
    setValues((current) => ({
      ...defaultValues(String(current.locationId || initialLocationId)),
      locationId: String(current.locationId || initialLocationId)
    }));
    setPreview(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <SurfaceCard className="rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
              {definition.badge}
            </div>
            <h2 className="mt-3 font-heading text-3xl font-bold text-ink">
              {definition.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {definition.description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {definition.fields.map((field) => {
            const options =
              field.options ||
              (field.optionsSource ? fieldOptions[field.optionsSource] : undefined);
            const value = values[field.name];
            const fullWidth = field.type === "textarea" || field.type === "scan";
            return (
              <div className={fullWidth ? "md:col-span-2" : ""} key={field.name}>
                <Field helperText={field.helperText} label={field.label}>
                  {field.type === "textarea" ? (
                    <textarea
                      className={inputClassName("min-h-28")}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      value={String(value || "")}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className={inputClassName()}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      value={String(value || "")}
                    >
                      <option value="">Select...</option>
                      {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "toggle" ? (
                    <button
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        value
                          ? "border-teal bg-teal/10 text-teal"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                      onClick={() => updateValue(field.name, !value)}
                      type="button"
                    >
                      <span>{value ? "Enabled" : "Disabled"}</span>
                      <span>{value ? "Yes" : "No"}</span>
                    </button>
                  ) : field.name.toLowerCase().includes("shelf") ? (
                    <ShelfInput
                      onChange={(nextValue) => updateValue(field.name, nextValue)}
                      shelves={availableShelves}
                      value={String(value || "")}
                    />
                  ) : field.type === "scan" ? (
                    field.name === "code" ? (
                      <ItemSelect
                        items={lookups.items || []}
                        onBlur={() => {
                          if (values.code) {
                            void loadPreview(String(values.code));
                          }
                        }}
                        onChange={(nextValue) => updateValue(field.name, nextValue)}
                        onDetected={(nextValue) => {
                          if (nextValue) {
                            void loadPreview(nextValue);
                          }
                        }}
                        onOptionSelect={(nextValue) => {
                          if (nextValue) {
                            void loadPreview(nextValue);
                          }
                        }}
                        placeholder={field.placeholder || "Scan, search, or select item"}
                        value={String(value || "")}
                      />
                    ) : (
                      <input
                        className={inputClassName()}
                        onChange={(event) => updateValue(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        type="text"
                        value={String(value || "")}
                      />
                    )
                  ) : (
                    <div className="flex gap-3">
                      <input
                        className={inputClassName()}
                        onChange={(event) =>
                          updateValue(
                            field.name,
                            field.type === "number" ? event.target.value : event.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        type={field.type === "number" ? "number" : field.type}
                        value={String(value || "")}
                      />
                    </div>
                  )}
                </Field>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-24 mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" disabled={pending} onClick={handleSubmit}>
            {pending ? "Saving..." : `Confirm ${definition.title}`}
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setValues(defaultValues(initialLocationId));
              setPreview(null);
            }}
            variant="ghost"
          >
            Reset
          </Button>
          </div>
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <SurfaceCard className="rounded-[32px] p-6">
          <p className="font-heading text-xl font-bold text-ink">Before you confirm</p>
          <div className="mt-4 space-y-3">
            {definition.rules.map((rule) => (
              <div className="flex gap-3 text-sm text-slate-600" key={rule}>
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] p-6">
          <p className="font-heading text-xl font-bold text-ink">Last scanned item</p>
          {preview?.item && preview.matches[0] ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold text-ink">{preview.item.itemName}</p>
                <p className="text-sm text-slate-500">
                  {preview.item.sku} • {preview.item.upc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={preview.matches[0].inventory.status} />
                <StatusBadge value={preview.item.category} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[20px] bg-slate-100 p-3">
                  <p className="text-slate-500">Available</p>
                  <p className="text-lg font-semibold text-ink">
                    {formatQuantity(preview.matches[0].inventory.quantityAvailable)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-100 p-3">
                  <p className="text-slate-500">Shelf</p>
                  <p className="text-lg font-semibold text-ink">
                    {preview.matches[0].inventory.shelfCode || "Pending"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Updated {formatDateTime(preview.matches[0].inventory.lastUpdatedAt)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Scan or search an item to preview stock, shelf, and status before confirming.
            </p>
          )}
        </SurfaceCard>

        {lastResponse ? (
          <SurfaceCard className="rounded-[32px] border border-emerald-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">Latest transaction saved</p>
                <p className="text-sm text-slate-600">{lastResponse.message}</p>
              </div>
            </div>
            {lastResponse.transaction ? (
              <div className="mt-4 rounded-[20px] bg-slate-100 p-4 text-sm text-slate-700">
                <p>
                  {lastResponse.transaction.transactionType} • {lastResponse.transaction.referenceNumber || "No ref"}
                </p>
                <p className="mt-1">
                  {lastResponse.transaction.itemName} • Qty {lastResponse.transaction.quantity}
                </p>
              </div>
            ) : null}
          </SurfaceCard>
        ) : null}
      </div>
    </div>
  );
}

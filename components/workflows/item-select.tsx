"use client";

import dynamic from "next/dynamic";
import { ScanLine } from "lucide-react";
import type { ItemRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useEffect, useMemo, useState } from "react";

const ScannerModal = dynamic(
  () => import("@/components/workflows/scanner-modal").then((module) => module.ScannerModal),
  { ssr: false }
);

export function ItemSelect({
  items,
  value,
  onChange,
  placeholder = "Scan, search, or select item",
  onBlur,
  onDetected,
  onOptionSelect,
  remoteSearch = false,
  suggestionLimit = 12
}: {
  items?: ItemRecord[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onBlur?: () => void;
  onDetected?: (value: string) => void;
  onOptionSelect?: (value: string) => void;
  remoteSearch?: boolean;
  suggestionLimit?: number;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [remoteItems, setRemoteItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const localItems = items || [];
  const shouldUseRemote = remoteSearch || !items;

  useEffect(() => {
    if (!shouldUseRemote) {
      return;
    }

    const query = value.trim();
    if (!query) {
      setRemoteItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          query,
          limit: String(suggestionLimit)
        });
        const response = await fetch(`/api/items/suggest?${params.toString()}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as ItemRecord[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          setRemoteItems([]);
          return;
        }
        setRemoteItems(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRemoteItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, query ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [shouldUseRemote, suggestionLimit, value]);

  const optionItems = shouldUseRemote ? remoteItems : localItems;
  const options = useMemo(
    () =>
      optionItems.map((item) => ({
        value: item.sku || item.itemId,
        label: item.itemName,
        description: [item.sku, item.upc].filter(Boolean).join(" • "),
        searchText: [item.sku, item.upc, item.qrCode, item.itemName].filter(Boolean).join(" ")
      })),
    [optionItems]
  );

  return (
    <div className="flex gap-3">
      <SearchableSelect
        className="flex-1"
        emptyMessage={loading ? "Loading items..." : "No matching items."}
        onBlur={onBlur}
        onChange={onChange}
        onOptionSelect={onOptionSelect}
        options={options}
        placeholder={placeholder}
        value={value}
      />
      <Button className="shrink-0 gap-2" onClick={() => setScannerOpen(true)} variant="ghost">
        <ScanLine className="h-4 w-4" />
        Scan
      </Button>

      <ScannerModal
        onClose={() => setScannerOpen(false)}
        onDetected={(scanValue) => {
          onChange(scanValue);
          onDetected?.(scanValue);
          setScannerOpen(false);
        }}
        open={scannerOpen}
      />
    </div>
  );
}

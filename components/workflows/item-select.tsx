"use client";

import { ScanLine } from "lucide-react";
import type { ItemRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScannerModal } from "@/components/workflows/scanner-modal";
import { useState } from "react";

export function ItemSelect({
  items,
  value,
  onChange,
  placeholder = "Scan, search, or select item",
  onBlur,
  onDetected,
  onOptionSelect
}: {
  items: ItemRecord[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onBlur?: () => void;
  onDetected?: (value: string) => void;
  onOptionSelect?: (value: string) => void;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="flex gap-3">
      <SearchableSelect
        className="flex-1"
        emptyMessage="No matching items."
        onBlur={onBlur}
        onChange={onChange}
        onOptionSelect={onOptionSelect}
        options={items.map((item) => ({
          value: item.sku || item.itemId,
          label: item.itemName,
          description: [item.sku, item.upc].filter(Boolean).join(" • "),
          searchText: [item.sku, item.upc, item.qrCode, item.itemName].filter(Boolean).join(" ")
        }))}
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

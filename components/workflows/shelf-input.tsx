"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import type { ShelfRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";

const ScannerModal = dynamic(
  () => import("@/components/workflows/scanner-modal").then((module) => module.ScannerModal),
  { ssr: false }
);

export function ShelfInput({
  shelves,
  value,
  onChange,
  placeholder = "Scan, select, or enter shelf"
}: {
  shelves: ShelfRecord[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const options = useMemo(
    () =>
      shelves.map((shelf) => ({
        value: shelf.code,
        label: shelf.code,
        description: [shelf.zone, shelf.aisle, shelf.rack, shelf.shelf]
          .filter(Boolean)
          .join(" • "),
        searchText: [shelf.code, shelf.zone, shelf.aisle, shelf.rack, shelf.shelf]
          .filter(Boolean)
          .join(" ")
      })),
    [shelves]
  );

  return (
    <div className="flex gap-3">
      <SearchableSelect
        className="flex-1"
        emptyMessage="No matching shelves."
        onChange={onChange}
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
          setScannerOpen(false);
        }}
        open={scannerOpen}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import type { ShelfRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import { ScannerModal } from "@/components/workflows/scanner-modal";

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
  const [filter, setFilter] = useState("");

  const filteredShelves = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return shelves;
    }
    return shelves.filter((shelf) =>
      [shelf.code, shelf.zone, shelf.aisle, shelf.rack, shelf.shelf]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [filter, shelves]);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          className={inputClassName()}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <Button className="shrink-0 gap-2" onClick={() => setScannerOpen(true)} variant="ghost">
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
      </div>

      {shelves.length ? (
        <div className="grid gap-3">
          <input
            className={inputClassName()}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter shelves"
            value={filter}
          />
          <select
            className={inputClassName()}
            onChange={(event) => onChange(event.target.value)}
            value={value}
          >
            <option value="">Select shelf</option>
            {filteredShelves.map((shelf) => (
              <option key={shelf.shelfId} value={shelf.code}>
                {shelf.code} • {shelf.zone} / {shelf.rack}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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

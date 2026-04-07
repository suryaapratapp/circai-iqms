import * as XLSX from "xlsx";
import { createId } from "@/lib/utils/id";
import type {
  InventoryRecord,
  ItemRecord,
  LocationRecord,
  ShelfRecord
} from "@/lib/data/types";
import {
  rzCircularSampleStock,
  type StockImportRow
} from "@/lib/data/rz-circular-stock";

export interface ImportSummary {
  rowsRead: number;
  rowsAccepted: number;
  duplicatesAggregated: number;
  itemsCreated: number;
  inventoryRecordsCreated: number;
}

export interface ImportedInventoryBundle {
  items: ItemRecord[];
  inventory: InventoryRecord[];
  shelves: ShelfRecord[];
  locations: LocationRecord[];
  summary: ImportSummary;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normaliseHeader(header: string) {
  return header.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function readRowsFromBuffer(fileName: string, buffer: Buffer): StockImportRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: ""
  });

  return rows
    .map((row) => {
      const mapped = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normaliseHeader(key), value])
      );
      const quantityValue =
        mapped.units || mapped.quantity || mapped.stock || mapped.qty || "";
      const quantity = Number(quantityValue);

      return {
        location:
          String(mapped.location || mapped.site || mapped.warehouse || "Bengaluru Main Hub").trim(),
        shelf: String(mapped.shelf || mapped.shelfcode || mapped.locationcode || "").trim(),
        sku: String(mapped.sku || mapped.productsku || mapped.code || "").trim(),
        productName: String(mapped.productname || mapped.product || mapped.item || "").trim(),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        supplier: String(mapped.supplier || "RZ-Circular Textiles").trim(),
        category: String(mapped.category || "Medical Textiles").trim()
      };
    })
    .filter((row) => row.shelf && row.sku && row.productName && row.quantity > 0);
}

export function buildImportedInventory(
  rows: StockImportRow[] = rzCircularSampleStock
): ImportedInventoryBundle {
  const now = new Date().toISOString();
  const locationsMap = new Map<string, LocationRecord>();
  const shelvesMap = new Map<string, ShelfRecord>();
  const itemsMap = new Map<string, ItemRecord>();
  const inventoryMap = new Map<string, InventoryRecord>();
  let duplicatesAggregated = 0;

  rows.forEach((row) => {
    const locationKey = slug(row.location);
    if (!locationsMap.has(locationKey)) {
      locationsMap.set(locationKey, {
        locationId: `loc_${locationKey}`,
        code: row.location
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 6)
          .toUpperCase(),
        name: row.location,
        address: `${row.location}, India`,
        timezone: "Asia/Kolkata",
        status: "active"
      });
    }

    const location = locationsMap.get(locationKey)!;
    const shelfKey = `${location.locationId}:${row.shelf.toUpperCase()}`;
    if (!shelvesMap.has(shelfKey)) {
      shelvesMap.set(shelfKey, {
        shelfId: `shelf_${slug(shelfKey)}`,
        locationId: location.locationId,
        warehouse: row.location,
        zone: row.shelf.charAt(0).toUpperCase(),
        aisle: row.shelf.charAt(0).toUpperCase(),
        rack: row.shelf.toUpperCase(),
        shelf: row.shelf.toUpperCase(),
        code: row.shelf.toUpperCase(),
        capacityUnits: 500,
        status: "active"
      });
    }

    if (!itemsMap.has(row.sku)) {
      itemsMap.set(row.sku, {
        itemId: `item_${slug(row.sku)}`,
        sku: row.sku,
        upc: `501${String(Math.abs(hashCode(row.sku))).padStart(10, "0").slice(0, 10)}`,
        qrCode: `IQMS-${row.sku}`,
        itemName: row.productName,
        description: `${row.productName} for medical textile and equipment operations.`,
        category: row.category,
        unitOfMeasure: "Units",
        packSize: "Standard pack",
        reorderThreshold: 20,
        status: "active",
        supplier: row.supplier,
        requiresQualityCheck:
          /(gown|mask|drape|rfid|wrap)/i.test(row.productName) || /(gown|mask)/i.test(row.category),
        createdAt: now,
        updatedAt: now
      });
    }

    const inventoryKey = `${location.locationId}:${row.shelf.toUpperCase()}:${row.sku}`;
    if (inventoryMap.has(inventoryKey)) {
      const inventory = inventoryMap.get(inventoryKey)!;
      inventory.quantityOnHand += row.quantity;
      inventory.quantityAvailable += row.quantity;
      inventory.lastUpdatedAt = now;
      duplicatesAggregated += 1;
      return;
    }

    const item = itemsMap.get(row.sku)!;
    const shelf = shelvesMap.get(shelfKey)!;
    inventoryMap.set(inventoryKey, {
      inventoryId: `inv_${slug(inventoryKey)}`,
      itemId: item.itemId,
      locationId: location.locationId,
      shelfId: shelf.shelfId,
      shelfCode: shelf.code,
      quantityOnHand: row.quantity,
      quantityAvailable: row.quantity,
      quantityDamaged: 0,
      quantityDamagedToRepair: 0,
      quantityDamagedBeyondRepair: 0,
      quantityUnderRepair: 0,
      quantityPacked: 0,
      quantityPendingInbound: 0,
      quantityQuarantined: 0,
      reorderThreshold: item.reorderThreshold,
      supplier: row.supplier,
      status: "stored",
      createdAt: now,
      lastUpdatedAt: now
    });
  });

  return {
    locations: Array.from(locationsMap.values()),
    shelves: Array.from(shelvesMap.values()),
    items: Array.from(itemsMap.values()),
    inventory: Array.from(inventoryMap.values()),
    summary: {
      rowsRead: rows.length,
      rowsAccepted: rows.length,
      duplicatesAggregated,
      itemsCreated: itemsMap.size,
      inventoryRecordsCreated: inventoryMap.size
    }
  };
}

export function buildImportedInventoryFromFile(
  fileName: string,
  buffer: Buffer
): ImportedInventoryBundle {
  const rows = readRowsFromBuffer(fileName, buffer);
  return buildImportedInventory(rows.length ? rows : rzCircularSampleStock);
}

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

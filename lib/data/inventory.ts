import type { InventoryRecord } from "@/lib/data/types";

export function getDamagedToRepairQuantity(record: InventoryRecord) {
  return Number(record.quantityDamagedToRepair || 0);
}

export function getDamagedBeyondRepairQuantity(record: InventoryRecord) {
  return Number(record.quantityDamagedBeyondRepair || 0);
}

export function getTotalDamagedQuantity(record: InventoryRecord) {
  return getDamagedToRepairQuantity(record) + getDamagedBeyondRepairQuantity(record);
}

export function isRepairEligibleInventory(record: InventoryRecord) {
  return getDamagedToRepairQuantity(record) > 0;
}

export function syncInventoryBuckets(record: InventoryRecord) {
  record.quantityDamaged = getTotalDamagedQuantity(record);
  record.quantityUnderRepair = 0;
  return record;
}

export function deriveInventoryStatus(record: InventoryRecord): InventoryRecord["status"] {
  if (Number(record.quantityPacked || 0) > 0 && Number(record.quantityAvailable || 0) <= 0) {
    return "packed";
  }
  if (Number(record.quantityAvailable || 0) > 0) {
    return "stored";
  }
  if (Number(record.quantityQuarantined || 0) > 0) {
    return "quarantined";
  }
  if (getDamagedToRepairQuantity(record) > 0) {
    return "damaged (to repair)";
  }
  if (getDamagedBeyondRepairQuantity(record) > 0) {
    return "damaged (beyond repair)";
  }
  if (Number(record.quantityOnHand || 0) > 0) {
    return "received";
  }
  return "stored";
}

export function syncInventoryStatus(record: InventoryRecord) {
  syncInventoryBuckets(record);
  record.status = deriveInventoryStatus(record);
  return record;
}

export function isBlockedForPacking(record: InventoryRecord) {
  return record.status === "quarantined" || record.status === "quality failed";
}

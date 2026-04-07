import { promises as fs } from "fs";
import path from "path";
import { syncInventoryStatus } from "@/lib/data/inventory";
import { createSeedDatabase } from "@/lib/data/seed";
import type { DatabaseShape } from "@/lib/data/types";

const dataDirectory = path.join(process.cwd(), ".data");
const databaseFile = path.join(dataDirectory, "iqms-demo-db.json");

async function ensureDatabaseFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(databaseFile);
  } catch {
    await fs.writeFile(databaseFile, JSON.stringify(createSeedDatabase(), null, 2));
  }
}

export async function readDatabase(): Promise<DatabaseShape> {
  await ensureDatabaseFile();
  const content = await fs.readFile(databaseFile, "utf8");
  const parsed = JSON.parse(content) as Partial<DatabaseShape>;
  if (
    parsed.schemaVersion !== 5 ||
    !Array.isArray(parsed.roles) ||
    !Array.isArray(parsed.receipts) ||
    !Array.isArray(parsed.packingOrders)
  ) {
    const fresh = createSeedDatabase();
    await writeDatabase(fresh);
    return fresh;
  }
  const database = parsed as DatabaseShape;
  database.inventory = (database.inventory || []).map((record) => {
    const quantityDamaged = Number(record.quantityDamaged || 0);
    const quantityUnderRepair = Number(record.quantityUnderRepair || 0);
    const quantityDamagedToRepair =
      typeof record.quantityDamagedToRepair === "number"
        ? Number(record.quantityDamagedToRepair || 0)
        : record.status === "under repair"
          ? quantityUnderRepair
          : quantityDamaged;
    const quantityDamagedBeyondRepair =
      typeof record.quantityDamagedBeyondRepair === "number"
        ? Number(record.quantityDamagedBeyondRepair || 0)
        : 0;

    return syncInventoryStatus({
      ...record,
      quantityAvailable: Number(record.quantityAvailable || 0),
      quantityOnHand: Number(record.quantityOnHand || 0),
      quantityDamaged,
      quantityDamagedToRepair,
      quantityDamagedBeyondRepair,
      quantityUnderRepair: 0,
      quantityPacked: Number(record.quantityPacked || 0),
      quantityPendingInbound: Number(record.quantityPendingInbound || 0),
      quantityQuarantined: Number(record.quantityQuarantined || 0),
      lastUpdatedAt: record.lastUpdatedAt || record.createdAt || new Date().toISOString()
    });
  });
  database.packingOrderItems = (database.packingOrderItems || []).map((item) => ({
    ...item,
    unpackedQuantity: Number(item.unpackedQuantity || 0)
  }));
  database.packingOrders = (database.packingOrders || []).map((order) => {
    const unpackedQuantity =
      typeof order.unpackedQuantity === "number"
        ? order.unpackedQuantity
        : database.packingOrderItems
            .filter((item) => item.packingOrderId === order.packingOrderId)
            .reduce((sum, item) => sum + Number(item.unpackedQuantity || 0), 0);
    const totalQuantity = Number(order.totalQuantity || 0);
    const status =
      order.status ||
      (unpackedQuantity <= 0
        ? "packed"
        : unpackedQuantity >= totalQuantity
          ? "unpacked"
          : "partially unpacked");
    return {
      ...order,
      unpackedQuantity,
      status,
      updatedAt: order.updatedAt || order.packedAt
    };
  });
  database.unpackLog = (database.unpackLog || []).map((record) => ({
    ...record,
    packingOrderId: record.packingOrderId || "",
    packingOrderItemId: record.packingOrderItemId || "",
    orderNumber: record.orderNumber || ""
  }));
  return database;
}

export async function writeDatabase(database: DatabaseShape) {
  await ensureDatabaseFile();
  await fs.writeFile(databaseFile, JSON.stringify(database, null, 2));
}

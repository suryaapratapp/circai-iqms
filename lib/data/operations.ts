import { promises as fs } from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createId } from "@/lib/utils/id";
import { buildImportedInventoryFromFile } from "@/lib/data/import";
import { isBlockedForPacking, syncInventoryStatus } from "@/lib/data/inventory";
import { readDatabase, writeDatabase } from "@/lib/data/local-db";
import { buildAudit, buildTransaction, findShelf, requireItemByCode } from "@/lib/data/repository";
import type {
  InventoryRecord,
  PackingOrderItemRecord,
  PackingOrderRecord,
  QualityCheckRecord,
  SessionUser,
  UploadedFileRecord
} from "@/lib/data/types";

const uploadsDir = path.join(process.cwd(), ".data", "uploads");

function isAppsScriptMode() {
  return process.env.DATA_SOURCE === "apps-script" && process.env.GOOGLE_APPS_SCRIPT_URL;
}

async function requestAppsScript<T>(pathName: string, body: Record<string, unknown>) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL is not configured.");
  }
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("path", pathName);
  if (process.env.GOOGLE_APPS_SCRIPT_TOKEN) {
    requestUrl.searchParams.set("token", process.env.GOOGLE_APPS_SCRIPT_TOKEN);
  }
  const response = await fetch(requestUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Apps Script request failed for ${pathName}.`);
  }
  const data = (await response.json()) as T & { error?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.error);
  }
  return data as T;
}

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

function findInventoryOrThrow(
  inventory: InventoryRecord | undefined,
  message: string
) {
  if (!inventory) {
    throw new Error(message);
  }
  return inventory;
}

export async function saveUploadedFile(
  file: File,
  session: SessionUser,
  referenceType: UploadedFileRecord["referenceType"],
  referenceId?: string
) {
  if (isAppsScriptMode()) {
    return requestAppsScript<UploadedFileRecord>("uploadFile", {
      session,
      fileName: file.name,
      fileType: file.type,
      referenceType,
      referenceId,
      base64: Buffer.from(await file.arrayBuffer()).toString("base64")
    });
  }

  await ensureUploadsDir();
  const extension = path.extname(file.name) || ".bin";
  const fileId = createId("file");
  const fileName = `${fileId}${extension}`;
  const targetPath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(targetPath, buffer);

  const database = await readDatabase();
  const uploadedFile: UploadedFileRecord = {
    fileId,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    storageMode: "local",
    localPath: targetPath,
    referenceType,
    referenceId,
    uploadedBy: session.userId,
    uploadedAt: new Date().toISOString()
  };
  database.uploadedFiles.unshift(uploadedFile);
  await writeDatabase(database);
  return uploadedFile;
}

export async function importStockWorkbook(
  fileName: string,
  buffer: Buffer,
  session: SessionUser
) {
  if (isAppsScriptMode()) {
    return requestAppsScript("importInventory", {
      session,
      fileName,
      base64: buffer.toString("base64")
    });
  }

  const database = await readDatabase();
  const imported = buildImportedInventoryFromFile(fileName, buffer);
  database.locations = imported.locations;
  database.shelves = imported.shelves;
  database.items = imported.items;
  database.inventory = imported.inventory;
  database.auditTrail.unshift(
    buildAudit({
      actionType: "stock import",
      session,
      locationId: session.assignedLocationId,
      notes: `Imported ${imported.summary.rowsAccepted} rows from ${fileName}.`
    })
  );
  await writeDatabase(database);
  return imported.summary;
}

export async function createReceipt(
  payload: {
    supplierName: string;
    poNumber: string;
    locationId: string;
    poPhotoFileId?: string;
    notes?: string;
    lines: Array<{
      code: string;
      quantityReceived: number;
      shelfCode: string;
      qualityResult: "pass" | "fail" | "hold";
      disposition?: "damaged-to-repair" | "damaged-beyond-repair";
      defectCategory?: string;
      batchLot?: string;
      expiryDate?: string;
      notes?: string;
    }>;
  },
  session: SessionUser
) {
  if (isAppsScriptMode()) {
    return requestAppsScript("receiveStock", { session, ...payload });
  }

  const database = await readDatabase();
  if (!payload.lines.length) {
    throw new Error("Add at least one receipt line before confirming.");
  }

  const receiptId = createId("receipt");
  const receipt = {
    receiptId,
    poNumber: payload.poNumber,
    supplierName: payload.supplierName,
    poPhotoFileId: payload.poPhotoFileId,
    locationId: payload.locationId,
    receivedBy: session.userId,
    receivedByName: session.fullName,
    receivedAt: new Date().toISOString(),
    totalLines: payload.lines.length,
    totalQuantity: payload.lines.reduce((sum, line) => sum + line.quantityReceived, 0),
    notes: payload.notes
  };
  database.receipts.unshift(receipt);

  for (const line of payload.lines) {
    const item = requireItemByCode(database, line.code);
    if (!item) {
      throw new Error(`Item not found for ${line.code}.`);
    }
    const shelf = findShelf(database, line.shelfCode, payload.locationId);
    if (!shelf) {
      throw new Error(`Shelf ${line.shelfCode} is not recognised.`);
    }

    const inventory =
      database.inventory.find(
        (record) =>
          record.itemId === item.itemId &&
          record.locationId === payload.locationId &&
          record.shelfCode === shelf.code
      ) ||
      {
        inventoryId: createId("inv"),
        itemId: item.itemId,
        locationId: payload.locationId,
        shelfId: shelf.shelfId,
        shelfCode: shelf.code,
        quantityOnHand: 0,
        quantityAvailable: 0,
        quantityDamaged: 0,
        quantityDamagedToRepair: 0,
        quantityDamagedBeyondRepair: 0,
        quantityUnderRepair: 0,
        quantityPacked: 0,
        quantityPendingInbound: 0,
        quantityQuarantined: 0,
        reorderThreshold: item.reorderThreshold,
        supplier: item.supplier,
        batchLot: line.batchLot,
        expiryDate: line.expiryDate,
        status: "received" as const,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      };
    if (!database.inventory.find((record) => record.inventoryId === inventory.inventoryId)) {
      database.inventory.push(inventory);
    }

    const previousValue = { ...inventory };
    inventory.quantityOnHand += line.quantityReceived;
    inventory.quantityPendingInbound = 0;
    if (line.qualityResult === "pass") {
      inventory.quantityAvailable += line.quantityReceived;
    } else if (
      line.qualityResult === "fail" &&
      line.disposition === "damaged-to-repair"
    ) {
      inventory.quantityDamagedToRepair += line.quantityReceived;
    } else if (
      line.qualityResult === "fail" &&
      line.disposition === "damaged-beyond-repair"
    ) {
      inventory.quantityDamagedBeyondRepair += line.quantityReceived;
    } else {
      inventory.quantityQuarantined += line.quantityReceived;
    }
    inventory.batchLot = line.batchLot || inventory.batchLot;
    inventory.expiryDate = line.expiryDate || inventory.expiryDate;
    inventory.lastUpdatedAt = new Date().toISOString();
    syncInventoryStatus(inventory);

    const qualityCheck: QualityCheckRecord = {
      qualityCheckId: createId("qc"),
      itemId: item.itemId,
      inventoryId: inventory.inventoryId,
      locationId: payload.locationId,
      shelfCode: shelf.code,
      checklistTemplateId: "receive-quick-check",
      result: line.qualityResult,
      defectCategory: line.defectCategory,
      disposition: line.qualityResult === "fail" ? line.disposition : undefined,
      notes: line.notes,
      checkedBy: session.userId,
      checkedByName: session.fullName,
      checkedAt: new Date().toISOString()
    };
    database.qualityChecks.unshift(qualityCheck);

    database.receiptItems.unshift({
      receiptItemId: createId("receipt-item"),
      receiptId,
      itemId: item.itemId,
      sku: item.sku,
      productName: item.itemName,
      quantityReceived: line.quantityReceived,
      shelfCode: shelf.code,
      qualityResult: line.qualityResult,
      disposition: line.qualityResult === "fail" ? line.disposition : undefined,
      defectCategory: line.defectCategory,
      batchLot: line.batchLot,
      expiryDate: line.expiryDate,
      notes: line.notes
    });
    const transaction = buildTransaction({
      item,
      session,
      quantity: line.quantityReceived,
      transactionType: "receive",
      locationId: payload.locationId,
      shelfCode: shelf.code,
      notes: line.notes || payload.notes,
      referenceNumber: payload.poNumber,
      previousValue,
      newValue: inventory,
      status: inventory.status
    });
    database.transactions.unshift(transaction);
    database.auditTrail.unshift(
      buildAudit({
        actionType: "receive",
        session,
        locationId: payload.locationId,
        quantity: line.quantityReceived,
        item,
        shelfCode: shelf.code,
        referenceNumber: payload.poNumber,
        notes: line.notes || payload.notes,
        previousValue,
        newValue: inventory
      })
    );
  }

  await writeDatabase(database);
  return receipt;
}

export async function createPackingOrder(
  payload: {
    locationId: string;
    notes?: string;
    rows: Array<{
      code: string;
      shelfCode: string;
      quantity: number;
    }>;
  },
  session: SessionUser
) {
  if (isAppsScriptMode()) {
    return requestAppsScript("packOrder", { session, ...payload });
  }

  if (!payload.rows.length) {
    throw new Error("Add at least one packing line.");
  }
  const database = await readDatabase();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(database.packingOrders.length + 1).padStart(4, "0")}`;
  const packingOrderId = createId("packing-order");
  const items: PackingOrderItemRecord[] = [];

  for (const row of payload.rows) {
    const item = requireItemByCode(database, row.code);
    if (!item) {
      throw new Error(`Item not found for ${row.code}.`);
    }
    const shelf = findShelf(database, row.shelfCode, payload.locationId);
    if (!shelf) {
      throw new Error(`Shelf ${row.shelfCode} is not recognised.`);
    }
    const inventory = findInventoryOrThrow(
      database.inventory.find(
        (record) =>
          record.itemId === item.itemId &&
          record.locationId === payload.locationId &&
          record.shelfCode === shelf.code
      ),
      `Stock for ${item.sku} was not found on shelf ${shelf.code}.`
    );
    if (isBlockedForPacking(inventory)) {
      throw new Error(`${item.itemName} cannot be packed from its current status.`);
    }
    if (inventory.quantityAvailable < row.quantity) {
      throw new Error(`Quantity for ${item.sku} exceeds available stock.`);
    }

    const previousValue = { ...inventory };
    inventory.quantityAvailable -= row.quantity;
    inventory.quantityPacked += row.quantity;
    inventory.lastUpdatedAt = new Date().toISOString();
    syncInventoryStatus(inventory);

    items.push({
      packingOrderItemId: createId("packing-item"),
      packingOrderId,
      itemId: item.itemId,
      sku: item.sku,
      upc: item.upc,
      productName: item.itemName,
      shelfCode: shelf.code,
      quantity: row.quantity,
      unpackedQuantity: 0
    });

    database.transactions.unshift(
      buildTransaction({
        item,
        session,
        quantity: row.quantity,
        transactionType: "pack",
        locationId: payload.locationId,
        shelfCode: shelf.code,
        notes: payload.notes,
        referenceNumber: orderNumber,
        previousValue,
        newValue: inventory,
        status: inventory.status
      })
    );
    database.auditTrail.unshift(
      buildAudit({
        actionType: "pack",
        session,
        locationId: payload.locationId,
        quantity: row.quantity,
        item,
        shelfCode: shelf.code,
        referenceNumber: orderNumber,
        notes: payload.notes,
        previousValue,
        newValue: inventory
      })
    );
  }

  const packingOrder: PackingOrderRecord = {
    packingOrderId,
    orderNumber,
    locationId: payload.locationId,
    packedBy: session.userId,
    packedByName: session.fullName,
    packedAt: new Date().toISOString(),
    status: "packed",
    notes: payload.notes,
    totalLines: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    unpackedQuantity: 0,
    updatedAt: new Date().toISOString()
  };

  database.packingOrders.unshift(packingOrder);
  database.packingOrderItems.unshift(...items);
  await writeDatabase(database);
  return { order: packingOrder, items };
}

export async function getPackingSlip(orderId: string, session?: SessionUser) {
  if (isAppsScriptMode()) {
    return requestAppsScript<{
      order: PackingOrderRecord;
      items: PackingOrderItemRecord[];
      location?: { name?: string };
    }>("getPackedOrder", { packingOrderId: orderId, session });
  }

  const database = await readDatabase();
  const order = database.packingOrders.find((record) => record.packingOrderId === orderId);
  if (!order) {
    throw new Error("Pack order not found.");
  }
  const items = database.packingOrderItems.filter(
    (record) => record.packingOrderId === orderId
  );
  const location = database.locations.find(
    (record) => record.locationId === order.locationId
  );
  return { order, items, location };
}

export async function generatePackingSlipPdf(orderId: string, session?: SessionUser) {
  const { order, items, location } = await getPackingSlip(orderId, session);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.11, 0.29, 0.56);

  page.drawText("IQMS", { x: 40, y: 790, size: 22, font: bold, color: blue });
  page.drawText("by CIRCAI LTD", {
    x: 40,
    y: 770,
    size: 12,
    font
  });
  page.drawText("for RZ-Circular", {
    x: 40,
    y: 754,
    size: 10,
    font
  });

  page.drawText(`Packing Slip`, { x: 40, y: 715, size: 18, font: bold });
  page.drawText(`Order Number: ${order.orderNumber}`, { x: 40, y: 690, size: 11, font });
  page.drawText(`Packed by: ${order.packedByName}`, { x: 40, y: 674, size: 11, font });
  page.drawText(`Location: ${location?.name || order.locationId}`, {
    x: 40,
    y: 658,
    size: 11,
    font
  });
  page.drawText(`Date/Time: ${new Date(order.packedAt).toLocaleString("en-GB")}`, {
    x: 40,
    y: 642,
    size: 11,
    font
  });

  let y = 600;
  page.drawText("Shelf", { x: 40, y, size: 11, font: bold });
  page.drawText("Product Name", { x: 110, y, size: 11, font: bold });
  page.drawText("SKU", { x: 320, y, size: 11, font: bold });
  page.drawText("UPC", { x: 400, y, size: 11, font: bold });
  page.drawText("Quantity", { x: 505, y, size: 11, font: bold });
  y -= 20;

  items.forEach((item) => {
    page.drawText(item.shelfCode, { x: 40, y, size: 10, font });
    page.drawText(item.productName.slice(0, 34), { x: 110, y, size: 10, font });
    page.drawText(item.sku, { x: 320, y, size: 10, font });
    page.drawText(item.upc, { x: 400, y, size: 10, font });
    page.drawText(String(item.quantity), { x: 520, y, size: 10, font });
    y -= 18;
  });

  page.drawText(`Total lines: ${order.totalLines}`, { x: 40, y: y - 20, size: 11, font: bold });
  page.drawText(`Total quantity: ${order.totalQuantity}`, { x: 180, y: y - 20, size: 11, font: bold });

  return Buffer.from(await pdf.save());
}

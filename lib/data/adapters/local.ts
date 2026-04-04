import { verifyPassword } from "@/lib/auth/password";
import { createId } from "@/lib/utils/id";
import { readDatabase, writeDatabase } from "@/lib/data/local-db";
import type {
  AdminData,
  AuthResult,
  DashboardData,
  InventoryListItem,
  LookupsData,
  RegisterInput,
  ReportsData,
  Repository,
  SearchItemResult,
  SearchShelfResult,
  WorkflowLookupsData,
  WorkflowResponse
} from "@/lib/data/repository";
import {
  buildAudit,
  buildTransaction,
  findShelf,
  getLocationMap,
  getShelfMap,
  isAccessibleLocation,
  getWorkflowLookupRequirements,
  normalizeText,
  requireItemByCode,
  resolveLocation
} from "@/lib/data/repository";
import type {
  DamageRecord,
  DatabaseShape,
  InventoryRecord,
  ItemRecord,
  PackingOrderRecord,
  RepairRecord,
  SessionUser,
  TransactionRecord,
  UnpackRecord,
  UserRecord,
  WorkflowType
} from "@/lib/data/types";

function rowsForSession(database: DatabaseShape, session: SessionUser): InventoryListItem[] {
  const locationMap = getLocationMap(database.locations);
  const shelfMap = getShelfMap(database.shelves);
  return database.inventory
    .filter((record) => session.locationIds.includes(record.locationId))
    .map((inventory) => ({
      item: database.items.find((item) => item.itemId === inventory.itemId)!,
      inventory,
      location: locationMap.get(inventory.locationId),
      shelf: inventory.shelfId ? shelfMap.get(inventory.shelfId) : undefined
    }));
}

function requireActiveApprovedUser(user?: UserRecord | null) {
  if (!user || user.status !== "active") {
    return "No active user found for that account.";
  }
  if (user.approvalStatus !== "approved") {
    return "Your account is awaiting admin approval.";
  }
  return null;
}

function requireInventory(
  database: DatabaseShape,
  itemId: string,
  locationId: string,
  shelfCode?: string
) {
  return database.inventory.find(
    (record) =>
      record.itemId === itemId &&
      record.locationId === locationId &&
      (!shelfCode || record.shelfCode === shelfCode)
  );
}

function ensureInventory(
  database: DatabaseShape,
  item: ItemRecord,
  locationId: string,
  shelfCode?: string
) {
  const existing =
    requireInventory(database, item.itemId, locationId, shelfCode) ||
    database.inventory.find(
      (record) => record.itemId === item.itemId && record.locationId === locationId
    );
  if (existing) {
    return existing;
  }

  const shelf = shelfCode ? findShelf(database, shelfCode, locationId) : undefined;
  const inventory: InventoryRecord = {
    inventoryId: createId("inv"),
    itemId: item.itemId,
    locationId,
    shelfId: shelf?.shelfId,
    shelfCode: shelf?.code,
    quantityOnHand: 0,
    quantityAvailable: 0,
    quantityDamaged: 0,
    quantityUnderRepair: 0,
    quantityPacked: 0,
    quantityPendingInbound: 0,
    quantityQuarantined: 0,
    reorderThreshold: item.reorderThreshold,
    supplier: item.supplier,
    batchLot: item.batchLot,
    expiryDate: item.expiryDate,
    status: "received",
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };
  database.inventory.push(inventory);
  return inventory;
}

function parseText(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function parseQuantity(value: unknown, label = "Quantity") {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return quantity;
}

function parseCountedQuantity(value: unknown, label = "Counted quantity") {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  return quantity;
}

function checkAvailable(inventory: InventoryRecord, quantity: number, message: string) {
  if (inventory.quantityAvailable < quantity) {
    throw new Error(message);
  }
}

function appendTransactionAndAudit(
  database: DatabaseShape,
  transaction: TransactionRecord,
  audit = buildAudit({
    actionType: transaction.transactionType,
    session: {
      userId: transaction.userId,
      fullName: transaction.userName,
      email: "",
      role: transaction.role,
      assignedLocationId: transaction.locationId,
      locationIds: [transaction.locationId]
    },
    locationId: transaction.locationId,
    quantity: transaction.quantity,
    referenceNumber: transaction.referenceNumber,
    notes: transaction.notes
  })
) {
  database.transactions.unshift(transaction);
  database.auditTrail.unshift(audit);
}

const localRepository: Repository = {
  async authenticate(email, password): Promise<AuthResult> {
    const database = await readDatabase();
    const user = database.users.find(
      (candidate) => normalizeText(candidate.email) === normalizeText(email)
    );
    const invalid = requireActiveApprovedUser(user);
    if (invalid) {
      return { user: null, message: invalid };
    }
    return verifyPassword(password, user!.passwordHash)
      ? { user: user! }
      : { user: null, message: "Invalid email or password." };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    const database = await readDatabase();
    if (
      database.users.some(
        (user) => normalizeText(user.email) === normalizeText(input.email)
      )
    ) {
      return { user: null, message: "Email already exists." };
    }

    const user: UserRecord = {
      userId: createId("user"),
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      assignedLocationId: input.assignedLocationId,
      locationIds: [input.assignedLocationId],
      status: "active",
      approvalStatus: "pending approval",
      googleLinked: false,
      createdAt: new Date().toISOString()
    };
    database.users.push(user);
    await writeDatabase(database);
    return {
      user: null,
      message: "Registration submitted. An admin must approve this account before sign-in."
    };
  },

  async findUserByGoogleIdentity(email, subject) {
    const database = await readDatabase();
    const user = database.users.find(
      (candidate) =>
        normalizeText(candidate.email) === normalizeText(email) ||
        candidate.googleSubject === subject
    );
    const invalid = requireActiveApprovedUser(user);
    return invalid ? null : user || null;
  },

  async linkGoogleAccount(userId, googleEmail, googleSubject) {
    const database = await readDatabase();
    const user = database.users.find((candidate) => candidate.userId === userId);
    if (!user) {
      throw new Error("User not found.");
    }
    user.googleLinked = true;
    user.googleEmail = googleEmail;
    user.googleSubject = googleSubject;
    await writeDatabase(database);
    return user;
  },

  async updateLastLogin(userId) {
    const database = await readDatabase();
    const user = database.users.find((candidate) => candidate.userId === userId);
    if (!user) {
      return;
    }
    user.lastLogin = new Date().toISOString();
    await writeDatabase(database);
  },

  async getAccessibleLocations(session) {
    const database = await readDatabase();
    return database.locations.filter((location) =>
      session.locationIds.includes(location.locationId)
    );
  },

  async getDashboard(session): Promise<DashboardData> {
    const database = await readDatabase();
    const rows = rowsForSession(database, session);
    const recentActivity = database.transactions
      .filter((record) => session.locationIds.includes(record.locationId))
      .slice(0, 10);
    const quickActionsByRole: Record<
      SessionUser["role"],
      Array<{ href: string; label: string }>
    > = {
      admin: [
        { href: "/receive", label: "Receive" },
        { href: "/search", label: "Search" },
        { href: "/damage-item", label: "Damage Item" },
        { href: "/repair-item", label: "Repair Item" },
        { href: "/packing", label: "Pack Order" },
        { href: "/packed-orders", label: "Packed Orders" },
        { href: "/unpack", label: "Unpack" },
        { href: "/inventory", label: "Inventory" }
      ],
      supervisor: [
        { href: "/receive", label: "Receive" },
        { href: "/search", label: "Search" },
        { href: "/damage-item", label: "Damage Item" },
        { href: "/repair-item", label: "Repair Item" },
        { href: "/packing", label: "Pack Order" },
        { href: "/packed-orders", label: "Packed Orders" },
        { href: "/unpack", label: "Unpack" },
        { href: "/inventory", label: "Inventory" }
      ],
      operator: [
        { href: "/receive", label: "Receive" },
        { href: "/search", label: "Search" },
        { href: "/damage-item", label: "Damage Item" },
        { href: "/repair-item", label: "Repair Item" },
        { href: "/packing", label: "Pack Order" }
      ]
    };

    return {
      summaryStrip: [
        {
          label: "Stock lines",
          value: rows.length
        },
        {
          label: "Available units",
          value: rows.reduce((sum, row) => sum + row.inventory.quantityAvailable, 0)
        },
        {
          label: "Held stock",
          value: rows.reduce(
            (sum, row) =>
              sum +
              row.inventory.quantityQuarantined +
              row.inventory.quantityDamaged +
              row.inventory.quantityUnderRepair,
            0
          )
        }
      ],
      quickActions: quickActionsByRole[session.role],
      recentActivity,
      lastAction: recentActivity[0]
    };
  },

  async getWorkflowLookups(session, workflow): Promise<WorkflowLookupsData> {
    const database = await readDatabase();
    const requirements = getWorkflowLookupRequirements(workflow);
    const locations = database.locations.filter((location) =>
      session.locationIds.includes(location.locationId)
    );

    return {
      locations,
      shelves: requirements.includeShelves
        ? database.shelves.filter((shelf) =>
            session.locationIds.includes(shelf.locationId)
          )
        : undefined,
      reasonCodes: requirements.includeReasonCodes
        ? database.reasonCodes
        : undefined,
      qualityTemplates: requirements.includeQualityTemplates
        ? database.qualityTemplates.filter((template) => template.active)
        : undefined
    };
  },

  async getLookups(session): Promise<LookupsData> {
    const database = await readDatabase();
    return {
      locations: database.locations.filter((location) =>
        session.locationIds.includes(location.locationId)
      ),
      shelves: database.shelves.filter((shelf) =>
        session.locationIds.includes(shelf.locationId)
      ),
      items: database.items,
      reasonCodes: database.reasonCodes,
      qualityTemplates: database.qualityTemplates,
      users: database.users
        .filter((user) => session.locationIds.includes(user.assignedLocationId))
        .map(({ userId, fullName, role, assignedLocationId, googleLinked }) => ({
          userId,
          fullName,
          role,
          assignedLocationId,
          googleLinked
        }))
    };
  },

  async searchShelf(code, session): Promise<SearchShelfResult> {
    const database = await readDatabase();
    const shelf = database.shelves.find(
      (candidate) =>
        normalizeText(candidate.code) === normalizeText(code) &&
        session.locationIds.includes(candidate.locationId)
    );
    if (!shelf) {
      return { inventory: [] };
    }
    const location = database.locations.find(
      (candidate) => candidate.locationId === shelf.locationId
    );
    const inventory = rowsForSession(database, session).filter(
      (row) => row.inventory.shelfCode === shelf.code
    );
    return { shelf, location, inventory };
  },

  async searchItem(query, session): Promise<SearchItemResult> {
    const database = await readDatabase();
    const item = requireItemByCode(database, query);
    if (!item) {
      return { matches: [], transactions: [] };
    }
    const matches = rowsForSession(database, session).filter(
      (row) => row.item.itemId === item.itemId
    );
    return {
      item,
      matches,
      transactions: database.transactions
        .filter(
          (record) =>
            record.itemId === item.itemId &&
            session.locationIds.includes(record.locationId)
        )
        .slice(0, 12)
    };
  },

  async listInventory(session) {
    return rowsForSession(await readDatabase(), session);
  },

  async getInventoryItem(itemId, session) {
    const database = await readDatabase();
    const item = database.items.find((candidate) => candidate.itemId === itemId);
    if (!item) {
      return { matches: [], transactions: [] };
    }
    return this.searchItem(item.sku, session);
  },

  async getReports(session): Promise<ReportsData> {
    const database = await readDatabase();
    return {
      inventoryOnHand: rowsForSession(database, session),
      damagedItems: database.damageLog.filter((record) =>
        session.locationIds.includes(record.locationId)
      ),
      repairItems: database.repairLog.filter((record) =>
        session.locationIds.includes(record.locationId)
      ),
      qualityResults: database.qualityChecks.filter((record) =>
        session.locationIds.includes(record.locationId)
      ),
      userActivity: database.transactions.filter((record) =>
        session.locationIds.includes(record.locationId)
      ),
      dailyTransactions: database.transactions.filter(
        (record) =>
          session.locationIds.includes(record.locationId) &&
          new Date(record.timestamp).toDateString() === new Date().toDateString()
      ),
      packingOrders: database.packingOrders.filter((record) =>
        session.locationIds.includes(record.locationId)
      )
    };
  },

  async getAdminData(session): Promise<AdminData> {
    if (session.role === "operator") {
      throw new Error("Admin access is only available to supervisors and admins.");
    }
    const database = await readDatabase();
    return {
      users: database.users,
      roles: database.roles,
      locations: database.locations,
      shelves: database.shelves,
      items: database.items,
      reasonCodes: database.reasonCodes,
      qualityTemplates: database.qualityTemplates,
      settings: database.settings,
      auditTrail: database.auditTrail.slice(0, 30),
      uploadedFiles: database.uploadedFiles.slice(0, 20),
      receipts: database.receipts.slice(0, 20)
    };
  },

  async listTransactions(session) {
    const database = await readDatabase();
    return database.transactions.filter((record) =>
      session.locationIds.includes(record.locationId)
    );
  },

  async listPackedOrders(session) {
    const database = await readDatabase();
    return database.packingOrders
      .filter((record) => session.locationIds.includes(record.locationId))
      .map((order) => ({
        order,
        itemCount: database.packingOrderItems.filter(
          (item) => item.packingOrderId === order.packingOrderId
        ).length,
        packedByName: order.packedByName
      }));
  },

  async getPackedOrder(packingOrderId, session) {
    const database = await readDatabase();
    const order = database.packingOrders.find(
      (record) =>
        record.packingOrderId === packingOrderId &&
        session.locationIds.includes(record.locationId)
    );
    if (!order) {
      return null;
    }
    return {
      order,
      items: database.packingOrderItems.filter(
        (item) => item.packingOrderId === packingOrderId
      ),
      location: database.locations.find(
        (location) => location.locationId === order.locationId
      )
    };
  },

  async processWorkflow(workflow, payload, session): Promise<WorkflowResponse> {
    const database = await readDatabase();
    const locationId = resolveLocation(
      session,
      payload.locationId ? String(payload.locationId) : undefined
    );
    const code = payload.code ? String(payload.code) : "";
    const notes = payload.notes ? String(payload.notes) : undefined;
    const item = code ? requireItemByCode(database, code) : undefined;

    if (workflow !== "unpack" && !item) {
      throw new Error("Item not found for the scanned code.");
    }

    switch (workflow) {
      case "damage-item": {
        const quantity = parseQuantity(payload.quantity);
        const shelfCode = parseText(payload.shelfCode, "Shelf");
        const inventory = requireInventory(database, item!.itemId, locationId, shelfCode);
        if (!inventory) {
          throw new Error("Shelf does not match the current stock record.");
        }
        checkAvailable(
          inventory,
          quantity,
          "Quantity cannot exceed available stock."
        );
        const previousValue = { ...inventory };
        inventory.quantityAvailable -= quantity;
        inventory.quantityDamaged += quantity;
        inventory.status = "damaged";
        inventory.lastUpdatedAt = new Date().toISOString();
        const damage: DamageRecord = {
          damageId: createId("damage"),
          itemId: item!.itemId,
          locationId,
          shelfCode,
          quantity,
          damageReason: parseText(payload.damageReason, "Damage reason"),
          notes,
          createdBy: session.userId,
          createdByName: session.fullName,
          createdAt: new Date().toISOString()
        };
        database.damageLog.unshift(damage);
        const transaction = buildTransaction({
          item,
          session,
          quantity,
          transactionType: "damage",
          locationId,
          shelfCode,
          notes,
          reasonCode: damage.damageReason,
          previousValue,
          newValue: inventory,
          status: "damaged"
        });
        appendTransactionAndAudit(
          database,
          transaction,
          buildAudit({
            actionType: "damage",
            session,
            locationId,
            quantity,
            item,
            shelfCode,
            notes,
            previousValue,
            newValue: damage
          })
        );
        await writeDatabase(database);
        return { message: "Damage saved and stock reduced.", item, inventory, damage, transaction };
      }

      case "repair-item": {
        const quantity = parseQuantity(payload.quantity);
        const shelfCode = parseText(payload.shelfCode, "Shelf");
        const inventory = ensureInventory(database, item!, locationId, shelfCode);
        const repairStatus = parseText(payload.repairStatus, "Repair status") as RepairRecord["repairStatus"];
        const previousValue = { ...inventory };

        if (repairStatus === "returned to stock" || repairStatus === "repaired") {
          if (inventory.quantityUnderRepair < quantity) {
            throw new Error("Not enough stock is currently under repair.");
          }
          inventory.quantityUnderRepair -= quantity;
          inventory.quantityAvailable += quantity;
          inventory.status = "stored";
        } else {
          checkAvailable(
            inventory,
            quantity,
            "Quantity cannot exceed available stock."
          );
          inventory.quantityAvailable -= quantity;
          inventory.quantityUnderRepair += quantity;
          inventory.status = "under repair";
        }
        inventory.lastUpdatedAt = new Date().toISOString();

        const repair: RepairRecord = {
          repairId: createId("repair"),
          itemId: item!.itemId,
          locationId,
          shelfCode,
          quantity,
          repairReason: parseText(payload.repairReason, "Repair reason"),
          repairStatus,
          assignedTo: parseText(payload.assignedTo, "Assigned to"),
          notes,
          createdBy: session.userId,
          createdByName: session.fullName,
          updatedAt: new Date().toISOString()
        };
        database.repairLog.unshift(repair);
        const transaction = buildTransaction({
          item,
          session,
          quantity,
          transactionType:
            repairStatus === "returned to stock" || repairStatus === "repaired"
              ? "repair complete"
              : "repair intake",
          locationId,
          shelfCode,
          notes,
          reasonCode: repair.repairReason,
          previousValue,
          newValue: inventory,
          status: inventory.status
        });
        appendTransactionAndAudit(
          database,
          transaction,
          buildAudit({
            actionType: "repair",
            session,
            locationId,
            quantity,
            item,
            shelfCode,
            notes,
            previousValue,
            newValue: repair
          })
        );
        await writeDatabase(database);
        return { message: "Repair activity saved.", item, inventory, repair, transaction };
      }

      case "unpack": {
        const quantity = parseQuantity(payload.quantity);
        const shelfCode = parseText(payload.shelfCode, "Shelf");
        const inventory = requireInventory(database, item!.itemId, locationId, shelfCode);
        if (!inventory) {
          throw new Error("Shelf does not match the packed stock record.");
        }
        if (inventory.quantityPacked < quantity) {
          throw new Error("Quantity cannot exceed packed stock.");
        }
        const previousValue = { ...inventory };
        inventory.quantityPacked -= quantity;
        if (parseText(payload.returnDisposition, "Return disposition") === "quarantine") {
          inventory.quantityQuarantined += quantity;
          inventory.status = "quarantined";
        } else {
          inventory.quantityAvailable += quantity;
          inventory.status = "unpacked";
        }
        inventory.lastUpdatedAt = new Date().toISOString();
        const unpack: UnpackRecord = {
          unpackId: createId("unpack"),
          itemId: item!.itemId,
          locationId,
          shelfCode,
          quantity,
          unpackReason: parseText(payload.unpackReason, "Unpack reason"),
          returnDisposition: parseText(
            payload.returnDisposition,
            "Return disposition"
          ) as UnpackRecord["returnDisposition"],
          notes,
          unpackedBy: session.userId,
          unpackedByName: session.fullName,
          unpackedAt: new Date().toISOString()
        };
        database.unpackLog.unshift(unpack);
        const transaction = buildTransaction({
          item,
          session,
          quantity,
          transactionType: "unpack",
          locationId,
          shelfCode,
          notes,
          reasonCode: unpack.unpackReason,
          previousValue,
          newValue: inventory,
          status: inventory.status
        });
        appendTransactionAndAudit(
          database,
          transaction,
          buildAudit({
            actionType: "unpack",
            session,
            locationId,
            quantity,
            item,
            shelfCode,
            notes,
            previousValue,
            newValue: unpack
          })
        );
        await writeDatabase(database);
        return { message: "Unpack saved.", item, inventory, unpack, transaction };
      }

      case "receive":
      case "packing":
        throw new Error("This workflow uses a dedicated route.");
    }
  }
};

export default localRepository;

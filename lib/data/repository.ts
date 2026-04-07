import { appConfig } from "@/lib/config/app";
import {
  deriveInventoryStatus,
  getDamagedBeyondRepairQuantity,
  getDamagedToRepairQuantity,
  getTotalDamagedQuantity,
  syncInventoryStatus
} from "@/lib/data/inventory";
import { createId } from "@/lib/utils/id";
import type {
  AuditRecord,
  DamageRecord,
  DatabaseShape,
  ExceptionRecord,
  InventoryRecord,
  ItemRecord,
  LocationRecord,
  PackingOrderRecord,
  QualityCheckRecord,
  QualityTemplate,
  ReasonCodeRecord,
  ReceiptRecord,
  RepairRecord,
  RoleRecord,
  SessionUser,
  ShelfRecord,
  TransactionRecord,
  UnpackRecord,
  UploadedFileRecord,
  UserRecord,
  WorkflowType
} from "@/lib/data/types";

export interface DashboardData {
  summaryStrip: Array<{
    label: string;
    value: number;
  }>;
  quickActions: Array<{ href: string; label: string }>;
  recentActivity: TransactionRecord[];
  lastAction?: TransactionRecord;
}

export interface LookupsData {
  locations: LocationRecord[];
  shelves: ShelfRecord[];
  items: ItemRecord[];
  reasonCodes: ReasonCodeRecord[];
  qualityTemplates: QualityTemplate[];
  users: Pick<
    UserRecord,
    "userId" | "fullName" | "role" | "assignedLocationId" | "googleLinked"
  >[];
}

export interface WorkflowLookupsData {
  locations: LocationRecord[];
  shelves?: ShelfRecord[];
  items?: ItemRecord[];
  reasonCodes?: ReasonCodeRecord[];
  qualityTemplates?: QualityTemplate[];
}

export interface InventoryListItem {
  item: ItemRecord;
  inventory: InventoryRecord;
  location?: LocationRecord;
  shelf?: ShelfRecord;
}

export interface SearchShelfResult {
  shelf?: ShelfRecord;
  location?: LocationRecord;
  inventory: InventoryListItem[];
}

export interface SearchItemResult {
  item?: ItemRecord;
  matches: InventoryListItem[];
  transactions: TransactionRecord[];
}

export interface ReportsData {
  inventoryOnHand: InventoryListItem[];
  damagedItems: DamageRecord[];
  repairItems: RepairRecord[];
  qualityResults: QualityCheckRecord[];
  userActivity: TransactionRecord[];
  packingOrders: PackingOrderRecord[];
}

export interface AdminData {
  users: UserRecord[];
  roles: RoleRecord[];
  locations: LocationRecord[];
  shelves: ShelfRecord[];
  items: ItemRecord[];
  reasonCodes: ReasonCodeRecord[];
  qualityTemplates: QualityTemplate[];
  settings: DatabaseShape["settings"];
  auditTrail: AuditRecord[];
  uploadedFiles: UploadedFileRecord[];
  receipts: ReceiptRecord[];
}

export interface PackedOrderListItem {
  order: PackingOrderRecord;
  itemCount: number;
  packedByName: string;
}

export interface PackedOrderDetail {
  order: PackingOrderRecord;
  items: DatabaseShape["packingOrderItems"];
  location?: LocationRecord;
}

export interface WorkflowResponse {
  message: string;
  item?: ItemRecord;
  inventory?: InventoryRecord;
  transaction?: TransactionRecord;
  packingOrder?: PackingOrderRecord;
  qualityCheck?: QualityCheckRecord;
  damage?: DamageRecord;
  repair?: RepairRecord;
  unpack?: UnpackRecord;
  unpacks?: UnpackRecord[];
  exception?: ExceptionRecord;
}

export interface AuthResult {
  user: UserRecord | null;
  message?: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRecord["role"];
  assignedLocationId: string;
}

export interface Repository {
  authenticate(email: string, password: string): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  findUserByGoogleIdentity(email: string, subject: string): Promise<UserRecord | null>;
  linkGoogleAccount(
    userId: string,
    googleEmail: string,
    googleSubject: string
  ): Promise<UserRecord>;
  updateLastLogin(userId: string): Promise<void>;
  getAccessibleLocations(session: SessionUser): Promise<LocationRecord[]>;
  getDashboard(session: SessionUser): Promise<DashboardData>;
  getWorkflowLookups(
    session: SessionUser,
    workflow: WorkflowType
  ): Promise<WorkflowLookupsData>;
  getLookups(session: SessionUser): Promise<LookupsData>;
  searchShelf(code: string, session: SessionUser): Promise<SearchShelfResult>;
  searchItem(query: string, session: SessionUser): Promise<SearchItemResult>;
  listInventory(session: SessionUser): Promise<InventoryListItem[]>;
  getInventoryItem(itemId: string, session: SessionUser): Promise<SearchItemResult>;
  getReports(session: SessionUser): Promise<ReportsData>;
  getAdminData(session: SessionUser): Promise<AdminData>;
  listTransactions(session: SessionUser): Promise<TransactionRecord[]>;
  listPackedOrders(session: SessionUser): Promise<PackedOrderListItem[]>;
  getPackedOrder(
    packingOrderId: string,
    session: SessionUser
  ): Promise<PackedOrderDetail | null>;
  processWorkflow(
    workflow: WorkflowType,
    payload: Record<string, unknown>,
    session: SessionUser
  ): Promise<WorkflowResponse>;
}

export function isAccessibleLocation(
  session: SessionUser,
  locationId: string | undefined
) {
  return Boolean(locationId && session.locationIds.includes(locationId));
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function resolveLocation(
  session: SessionUser,
  requestedLocationId?: string
): string {
  return requestedLocationId && session.locationIds.includes(requestedLocationId)
    ? requestedLocationId
    : session.assignedLocationId;
}

export function requireItemByCode(database: DatabaseShape, query: string) {
  const normalized = normalizeText(query);
  return database.items.find((candidate) =>
    [candidate.itemId, candidate.upc, candidate.qrCode, candidate.sku, candidate.itemName]
      .filter(Boolean)
      .map((value) => normalizeText(value))
      .includes(normalized)
  );
}

export function findShelf(database: DatabaseShape, code: string, locationId?: string) {
  const normalized = normalizeText(code);
  return database.shelves.find(
    (shelf) =>
      normalizeText(shelf.code) === normalized &&
      (!locationId || shelf.locationId === locationId)
  );
}

export function getLocationMap(locations: LocationRecord[]) {
  return new Map(locations.map((location) => [location.locationId, location]));
}

export function getShelfMap(shelves: ShelfRecord[]) {
  return new Map(shelves.map((shelf) => [shelf.shelfId, shelf]));
}

export function getWorkflowLookupRequirements(workflow: WorkflowType) {
  switch (workflow) {
    case "receive":
      return {
        includeShelves: true,
        includeItems: true,
        includeReasonCodes: false,
        includeQualityTemplates: false
      };
    case "move":
      return {
        includeShelves: true,
        includeItems: true,
        includeReasonCodes: false,
        includeQualityTemplates: false
      };
    case "packing":
      return {
        includeShelves: true,
        includeItems: true,
        includeReasonCodes: false,
        includeQualityTemplates: false
      };
    case "damage-item":
    case "repair-item":
    case "unpack":
      return {
        includeShelves: true,
        includeItems: true,
        includeReasonCodes: true,
        includeQualityTemplates: false
      };
    default:
      return {
        includeShelves: false,
        includeItems: false,
        includeReasonCodes: false,
        includeQualityTemplates: false
      };
  }
}

export function buildTransaction(params: {
  item?: ItemRecord;
  session: SessionUser;
  quantity: number;
  transactionType: string;
  locationId: string;
  shelfCode?: string;
  notes?: string;
  referenceNumber?: string;
  reasonCode?: string;
  previousValue?: unknown;
  newValue?: unknown;
  status: TransactionRecord["status"];
}): TransactionRecord {
  return {
    transactionId: createId("txn"),
    itemId: params.item?.itemId,
    itemName: params.item?.itemName,
    sku: params.item?.sku,
    upc: params.item?.upc,
    transactionType: params.transactionType,
    quantity: params.quantity,
    locationId: params.locationId,
    shelfCode: params.shelfCode,
    userId: params.session.userId,
    userName: params.session.fullName,
    role: params.session.role,
    timestamp: new Date().toISOString(),
    notes: params.notes,
    referenceNumber: params.referenceNumber,
    reasonCode: params.reasonCode,
    previousValue: params.previousValue
      ? JSON.stringify(params.previousValue)
      : undefined,
    newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
    status: params.status
  };
}

export function buildAudit(params: {
  actionType: string;
  session: SessionUser;
  locationId: string;
  quantity?: number;
  item?: ItemRecord;
  shelfCode?: string;
  referenceNumber?: string;
  notes?: string;
  previousValue?: unknown;
  newValue?: unknown;
}): AuditRecord {
  return {
    actionId: createId("audit"),
    actionType: params.actionType,
    userId: params.session.userId,
    userName: params.session.fullName,
    role: params.session.role,
    locationId: params.locationId,
    sku: params.item?.sku,
    productName: params.item?.itemName,
    shelfCode: params.shelfCode,
    quantity: params.quantity,
    previousValue: params.previousValue
      ? JSON.stringify(params.previousValue)
      : undefined,
    newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
    timestamp: new Date().toISOString(),
    referenceNumber: params.referenceNumber,
    notes: params.notes
  };
}

export function buildException(params: {
  type: ExceptionRecord["type"];
  session: SessionUser;
  locationId: string;
  itemId?: string;
  notes?: string;
  supervisorReview?: boolean;
}): ExceptionRecord {
  return {
    exceptionId: createId("exc"),
    type: params.type,
    itemId: params.itemId,
    locationId: params.locationId,
    notes: params.notes,
    supervisorReview: Boolean(params.supervisorReview),
    createdAt: new Date().toISOString(),
    createdBy: params.session.userId,
    createdByName: params.session.fullName
  };
}

export function isSupervisor(session: SessionUser) {
  return session.role === "admin" || session.role === "supervisor";
}

export function getVarianceThreshold(database: DatabaseShape) {
  return Number(
    database.settings.find((setting) => setting.key === "cycleCountVarianceThreshold")
      ?.value ?? appConfig.cycleCountVarianceThreshold
  );
}

export {
  deriveInventoryStatus,
  getDamagedBeyondRepairQuantity,
  getDamagedToRepairQuantity,
  getTotalDamagedQuantity,
  syncInventoryStatus
};

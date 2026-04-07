export type UserRole = "admin" | "supervisor" | "operator";
export type RecordStatus = "active" | "inactive";
export type ApprovalStatus = "approved" | "pending approval";
export type InventoryStatus =
  | "received"
  | "pending putaway"
  | "stored"
  | "pending quality check"
  | "quality passed"
  | "quality failed"
  | "damaged"
  | "damaged (to repair)"
  | "damaged (beyond repair)"
  | "under repair"
  | "ready to pack"
  | "packed"
  | "unpacked"
  | "quarantined";
export type QualityResult = "pass" | "fail" | "hold";
export type CountStatus = "pending" | "submitted" | "approved";
export type RepairStatus =
  | "pending repair"
  | "in repair"
  | "repaired"
  | "beyond repair"
  | "returned to stock";
export type PackingOrderStatus = "packed" | "partially unpacked" | "unpacked";
export type WorkflowType =
  | "receive"
  | "move"
  | "damage-item"
  | "repair-item"
  | "packing"
  | "unpack";

export interface SessionUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  assignedLocationId: string;
  locationIds: string[];
  googleLinked?: boolean;
  googleEmail?: string;
}

export interface UserRecord {
  userId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  assignedLocationId: string;
  locationIds: string[];
  status: RecordStatus;
  approvalStatus: ApprovalStatus;
  googleLinked: boolean;
  googleEmail?: string;
  googleSubject?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface RoleRecord {
  roleId: string;
  name: UserRole;
  description: string;
  permissions: string[];
}

export interface LocationRecord {
  locationId: string;
  code: string;
  name: string;
  address: string;
  timezone: string;
  status: RecordStatus;
}

export interface ShelfRecord {
  shelfId: string;
  locationId: string;
  warehouse: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  code: string;
  capacityUnits: number;
  status: RecordStatus;
}

export interface ItemRecord {
  itemId: string;
  sku: string;
  upc: string;
  qrCode: string;
  itemName: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  packSize: string;
  imageUrl?: string;
  reorderThreshold: number;
  status: RecordStatus;
  supplier: string;
  batchLot?: string;
  expiryDate?: string;
  requiresQualityCheck: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  inventoryId: string;
  itemId: string;
  locationId: string;
  shelfId?: string;
  shelfCode?: string;
  quantityOnHand: number;
  quantityAvailable: number;
  quantityDamaged: number;
  quantityDamagedToRepair: number;
  quantityDamagedBeyondRepair: number;
  quantityUnderRepair: number;
  quantityPacked: number;
  quantityPendingInbound: number;
  quantityQuarantined: number;
  reorderThreshold?: number;
  supplier?: string;
  batchLot?: string;
  expiryDate?: string;
  status: InventoryStatus;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface TransactionRecord {
  transactionId: string;
  itemId?: string;
  itemName?: string;
  sku?: string;
  upc?: string;
  transactionType: string;
  quantity: number;
  locationId: string;
  shelfCode?: string;
  userId: string;
  userName: string;
  role: UserRole;
  timestamp: string;
  notes?: string;
  referenceNumber?: string;
  reasonCode?: string;
  previousValue?: string;
  newValue?: string;
  status: InventoryStatus | CountStatus | RepairStatus | "logged";
}

export interface ReceiptRecord {
  receiptId: string;
  poNumber: string;
  supplierName: string;
  poPhotoFileId?: string;
  locationId: string;
  receivedBy: string;
  receivedByName: string;
  receivedAt: string;
  totalLines: number;
  totalQuantity: number;
  notes?: string;
}

export interface ReceiptItemRecord {
  receiptItemId: string;
  receiptId: string;
  itemId: string;
  sku: string;
  productName: string;
  quantityReceived: number;
  shelfCode?: string;
  qualityResult?: QualityResult;
  disposition?: QualityCheckRecord["disposition"];
  defectCategory?: string;
  batchLot?: string;
  expiryDate?: string;
  notes?: string;
}

export interface QualityTemplate {
  templateId: string;
  category: string;
  name: string;
  checklist: string[];
  samplingMode: "sample" | "100%";
  active: boolean;
}

export interface QualityCheckRecord {
  qualityCheckId: string;
  itemId: string;
  inventoryId?: string;
  locationId: string;
  shelfCode?: string;
  checklistTemplateId: string;
  result: QualityResult;
  defectCategory?: string;
  disposition?: "quarantine" | "damaged-to-repair" | "damaged-beyond-repair";
  notes?: string;
  checkedBy: string;
  checkedByName: string;
  checkedAt: string;
  photoFileId?: string;
}

export interface CycleCountRecord {
  cycleCountId: string;
  itemId?: string;
  shelfCode?: string;
  locationId: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  reasonCode: string;
  status: CountStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  countedBy: string;
  countedByName: string;
  countedAt: string;
}

export interface DamageRecord {
  damageId: string;
  itemId: string;
  locationId: string;
  shelfCode?: string;
  quantity: number;
  damageOutcome: "to repair" | "beyond repair";
  damageReason?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface RepairRecord {
  repairId: string;
  itemId: string;
  locationId: string;
  shelfCode?: string;
  quantity: number;
  repairStatus: RepairStatus;
  repairReason?: string;
  assignedTo?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
}

export interface PackingOrderRecord {
  packingOrderId: string;
  orderNumber: string;
  locationId: string;
  packedBy: string;
  packedByName: string;
  packedAt: string;
  status: PackingOrderStatus;
  notes?: string;
  totalLines: number;
  totalQuantity: number;
  unpackedQuantity: number;
  pdfFileId?: string;
  updatedAt: string;
}

export interface PackingOrderItemRecord {
  packingOrderItemId: string;
  packingOrderId: string;
  itemId: string;
  sku: string;
  upc: string;
  productName: string;
  shelfCode: string;
  quantity: number;
  unpackedQuantity: number;
}

export interface UnpackRecord {
  unpackId: string;
  itemId: string;
  packingOrderId: string;
  packingOrderItemId?: string;
  orderNumber?: string;
  locationId: string;
  shelfCode?: string;
  quantity: number;
  unpackReason: string;
  returnDisposition: "return to stock" | "quarantine";
  notes?: string;
  unpackedBy: string;
  unpackedByName: string;
  unpackedAt: string;
}

export interface ReasonCodeRecord {
  reasonCodeId: string;
  code: string;
  category: string;
  label: string;
  approvalRequired: boolean;
}

export interface AuditRecord {
  actionId: string;
  actionType: string;
  userId: string;
  userName: string;
  role: UserRole;
  locationId: string;
  sku?: string;
  productName?: string;
  shelfCode?: string;
  quantity?: number;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  referenceNumber?: string;
  notes?: string;
}

export interface UploadedFileRecord {
  fileId: string;
  fileName: string;
  fileType: string;
  storageMode: "local" | "google-drive";
  localPath?: string;
  driveFileId?: string;
  referenceType: "po-photo" | "quality-photo" | "packing-slip";
  referenceId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PdfLogRecord {
  pdfId: string;
  packingOrderId: string;
  fileId?: string;
  createdAt: string;
  createdBy: string;
}

export interface SettingsRecord {
  settingId: string;
  key: string;
  value: string;
  description: string;
}

export interface ExceptionRecord {
  exceptionId: string;
  type:
    | "item not found"
    | "barcode not recognised"
    | "quantity mismatch"
    | "shelf mismatch"
    | "duplicate scan"
    | "damaged on receipt"
    | "packing shortfall"
    | "failed quality check";
  itemId?: string;
  locationId: string;
  notes?: string;
  photoFileId?: string;
  supervisorReview: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface DatabaseShape {
  schemaVersion: number;
  users: UserRecord[];
  roles: RoleRecord[];
  locations: LocationRecord[];
  shelves: ShelfRecord[];
  items: ItemRecord[];
  inventory: InventoryRecord[];
  transactions: TransactionRecord[];
  receipts: ReceiptRecord[];
  receiptItems: ReceiptItemRecord[];
  qualityTemplates: QualityTemplate[];
  qualityChecks: QualityCheckRecord[];
  cycleCounts: CycleCountRecord[];
  damageLog: DamageRecord[];
  repairLog: RepairRecord[];
  packingOrders: PackingOrderRecord[];
  packingOrderItems: PackingOrderItemRecord[];
  unpackLog: UnpackRecord[];
  reasonCodes: ReasonCodeRecord[];
  settings: SettingsRecord[];
  auditTrail: AuditRecord[];
  exceptions: ExceptionRecord[];
  uploadedFiles: UploadedFileRecord[];
  pdfLogs: PdfLogRecord[];
}

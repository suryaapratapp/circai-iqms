import { addDays, subHours } from "date-fns";
import { hashPassword } from "@/lib/auth/password";
import { buildImportedInventory } from "@/lib/data/import";
import type {
  AuditRecord,
  CycleCountRecord,
  DamageRecord,
  DatabaseShape,
  ExceptionRecord,
  PackingOrderItemRecord,
  PackingOrderRecord,
  PdfLogRecord,
  QualityCheckRecord,
  QualityTemplate,
  ReceiptItemRecord,
  ReceiptRecord,
  ReasonCodeRecord,
  RepairRecord,
  RoleRecord,
  SessionUser,
  SettingsRecord,
  TransactionRecord,
  UnpackRecord,
  UploadedFileRecord,
  UserRecord
} from "@/lib/data/types";

function iso(date: Date) {
  return date.toISOString();
}

function makeUsers(now: Date): UserRecord[] {
  const adminPassword = hashPassword("Admin@123");
  const supervisorPassword = hashPassword("Supervisor@123");
  const operatorPassword = hashPassword("Operator@123");
  return [
    {
      userId: "user_admin",
      fullName: "Admin User",
      email: "admin@rz-circular.com",
      passwordHash: adminPassword,
      role: "admin",
      assignedLocationId: "loc_bengaluru-main-hub",
      locationIds: [
        "loc_bengaluru-main-hub",
        "loc_pune-repair-qa-hub",
        "loc_hyderabad-dispatch-center"
      ],
      status: "active",
      approvalStatus: "approved",
      googleLinked: true,
      googleEmail: "admin@rz-circular.com",
      googleSubject: "google-subject-admin",
      createdAt: iso(subHours(now, 400)),
      lastLogin: iso(subHours(now, 2))
    },
    {
      userId: "user_supervisor",
      fullName: "Supervisor User",
      email: "supervisor@rz-circular.com",
      passwordHash: supervisorPassword,
      role: "supervisor",
      assignedLocationId: "loc_hyderabad-dispatch-center",
      locationIds: [
        "loc_hyderabad-dispatch-center",
        "loc_bengaluru-main-hub",
        "loc_pune-repair-qa-hub"
      ],
      status: "active",
      approvalStatus: "approved",
      googleLinked: true,
      googleEmail: "supervisor@rz-circular.com",
      googleSubject: "google-subject-supervisor",
      createdAt: iso(subHours(now, 320)),
      lastLogin: iso(subHours(now, 4))
    },
    {
      userId: "user_operator_1",
      fullName: "Warehouse Operator",
      email: "operator@rz-circular.com",
      passwordHash: operatorPassword,
      role: "operator",
      assignedLocationId: "loc_pune-repair-qa-hub",
      locationIds: ["loc_pune-repair-qa-hub"],
      status: "active",
      approvalStatus: "approved",
      googleLinked: false,
      createdAt: iso(subHours(now, 220)),
      lastLogin: iso(subHours(now, 6))
    }
  ];
}

function makeRoles(): RoleRecord[] {
  return [
    {
      roleId: "role_admin",
      name: "admin",
      description: "Full system administration and Google access control.",
      permissions: [
        "users",
        "roles",
        "locations",
        "shelves",
        "products",
        "imports",
        "settings",
        "transactions",
        "packed-orders",
        "reports",
        "approvals",
        "receive",
        "search",
        "damage",
        "repair",
        "packing"
      ]
    },
    {
      roleId: "role_supervisor",
      name: "supervisor",
      description: "Operational oversight, approvals, and stock control.",
      permissions: [
        "receive",
        "search",
        "damage",
        "repair",
        "packing",
        "approvals",
        "inventory",
        "transactions",
        "packed-orders",
        "reports",
        "settings"
      ]
    },
    {
      roleId: "role_operator",
      name: "operator",
      description: "Day-to-day warehouse execution on mobile devices.",
      permissions: [
        "receive",
        "search",
        "packing",
        "damage",
        "repair"
      ]
    }
  ];
}

function makeReasonCodes(): ReasonCodeRecord[] {
  return [
    { reasonCodeId: "reason_2", code: "PKG-DMG", category: "damage", label: "Torn packaging", approvalRequired: false },
    { reasonCodeId: "reason_3", code: "CONTAM", category: "damage", label: "Contamination", approvalRequired: true },
    { reasonCodeId: "reason_4", code: "STITCH", category: "damage", label: "Stitching issue", approvalRequired: false },
    { reasonCodeId: "reason_5", code: "REPAIR", category: "repair", label: "Send to repair", approvalRequired: false },
    { reasonCodeId: "reason_6", code: "Q-HOLD", category: "quality", label: "Quality hold", approvalRequired: true },
    { reasonCodeId: "reason_7", code: "UNPACK", category: "unpack", label: "Packing error", approvalRequired: false }
  ];
}

function makeQualityTemplates(): QualityTemplate[] {
  return [
    {
      templateId: "qt_gowns",
      category: "Gowns",
      name: "Medical Textile Garment Check",
      checklist: [
        "Packaging condition",
        "Labelling present",
        "Stitching quality",
        "Contamination visible",
        "Correct item / SKU"
      ],
      samplingMode: "sample",
      active: true
    },
    {
      templateId: "qt_packaging",
      category: "Packaging",
      name: "Packaging Material Check",
      checklist: [
        "Packaging condition",
        "Labelling present",
        "Quantity match",
        "Clean / acceptable condition"
      ],
      samplingMode: "100%",
      active: true
    },
    {
      templateId: "qt_rfid",
      category: "RFID Garments",
      name: "RFID Garment Check",
      checklist: [
        "Packaging condition",
        "Labelling present",
        "RFID/tag present",
        "Correct item / SKU",
        "Clean / acceptable condition"
      ],
      samplingMode: "sample",
      active: true
    }
  ];
}

function makeSettings(): SettingsRecord[] {
  return [
    {
      settingId: "setting_1",
      key: "cycleCountVarianceThreshold",
      value: "10",
      description: "Variance above this quantity requires supervisor approval."
    },
    {
      settingId: "setting_2",
      key: "brandingLine",
      value: "IQMS by CIRCAI LTD",
      description: "Branding shown across the login, header, dashboard, and packing slips."
    },
    {
      settingId: "setting_3",
      key: "googleDriveMode",
      value: "optional",
      description: "PO photos and packing slips may be stored locally or in Google Drive."
    }
  ];
}

function makeTransactions(now: Date): TransactionRecord[] {
  return [
    {
      transactionId: "txn_1",
      itemId: "item_rz-gown-012",
      itemName: "Standard Surgical Gown",
      sku: "RZ-GOWN-012",
      upc: "5011741641688",
      transactionType: "receive",
      quantity: 36,
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "A3",
      userId: "user_admin",
      userName: "Admin User",
      role: "admin",
      timestamp: iso(subHours(now, 4)),
      referenceNumber: "PO-24811",
      status: "received"
    },
    {
      transactionId: "txn_2",
      itemId: "item_rz-rfid-050",
      itemName: "RFID Theatre Gown",
      sku: "RZ-RFID-050",
      upc: "5016369799306",
      transactionType: "quality pass",
      quantity: 12,
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "C2",
      userId: "user_supervisor",
      userName: "Supervisor User",
      role: "supervisor",
      timestamp: iso(subHours(now, 3)),
      status: "quality passed"
    },
    {
      transactionId: "txn_3",
      itemId: "item_rz-pack-100",
      itemName: "Sterile Packaging Tie",
      sku: "RZ-PACK-100",
      upc: "5011259898443",
      transactionType: "pack",
      quantity: 20,
      locationId: "loc_hyderabad-dispatch-center",
      shelfCode: "P4",
      userId: "user_supervisor",
      userName: "Supervisor User",
      role: "supervisor",
      timestamp: iso(subHours(now, 2)),
      referenceNumber: "ORD-2026-0009",
      status: "packed"
    },
    {
      transactionId: "txn_4",
      itemId: "item_rz-gown-011",
      itemName: "Reinforced Surgical Gown",
      sku: "RZ-GOWN-011",
      upc: "5011741641687",
      transactionType: "damage",
      quantity: 3,
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "A5",
      userId: "user_admin",
      userName: "Admin User",
      role: "admin",
      timestamp: iso(subHours(now, 1)),
      reasonCode: "PKG-DMG",
      status: "damaged"
    },
    {
      transactionId: "txn_5",
      itemId: "item_rz-gown-011",
      itemName: "Reinforced Surgical Gown",
      sku: "RZ-GOWN-011",
      upc: "5011741641687",
      transactionType: "repair intake",
      quantity: 4,
      locationId: "loc_pune-repair-qa-hub",
      shelfCode: "R1",
      userId: "user_operator_1",
      userName: "Warehouse Operator",
      role: "operator",
      timestamp: iso(subHours(now, 5)),
      reasonCode: "REPAIR",
      status: "under repair"
    }
  ];
}

function makeReceipts(now: Date): { receipts: ReceiptRecord[]; receiptItems: ReceiptItemRecord[] } {
  const receiptId = "receipt_1";
  return {
    receipts: [
      {
        receiptId,
        poNumber: "PO-24811",
        supplierName: "RZ-Circular Textiles",
        locationId: "loc_bengaluru-main-hub",
        receivedBy: "user_admin",
        receivedByName: "Admin User",
        receivedAt: iso(subHours(now, 4)),
        totalLines: 2,
        totalQuantity: 60
      }
    ],
    receiptItems: [
      {
        receiptItemId: "receipt_item_1",
        receiptId,
        itemId: "item_rz-gown-012",
        sku: "RZ-GOWN-012",
        productName: "Standard Surgical Gown",
        quantityReceived: 36,
        shelfCode: "A3",
        qualityResult: "pass",
        defectCategory: ""
      },
      {
        receiptItemId: "receipt_item_2",
        receiptId,
        itemId: "item_rz-mask-001",
        sku: "RZ-MASK-001",
        productName: "Reusable Theatre Mask",
        quantityReceived: 24,
        shelfCode: "A1",
        qualityResult: "pass",
        defectCategory: ""
      }
    ]
  };
}

function makeQualityChecks(now: Date): QualityCheckRecord[] {
  return [
    {
      qualityCheckId: "qc_1",
      itemId: "item_rz-rfid-050",
      inventoryId: "inv_loc-bengaluru-main-hub-c2-rz-rfid-050",
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "C2",
      checklistTemplateId: "qt_rfid",
      result: "pass",
      checkedBy: "user_supervisor",
      checkedByName: "Supervisor User",
      checkedAt: iso(subHours(now, 3))
    },
    {
      qualityCheckId: "qc_2",
      itemId: "item_rz-gown-011",
      inventoryId: "inv_loc-bengaluru-main-hub-a5-rz-gown-011",
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "A5",
      checklistTemplateId: "qt_gowns",
      result: "hold",
      defectCategory: "stitching quality",
      disposition: "repair",
      notes: "Minor seam issue found during inspection.",
      checkedBy: "user_supervisor",
      checkedByName: "Supervisor User",
      checkedAt: iso(subHours(now, 2))
    }
  ];
}

function makeCycleCounts(now: Date): CycleCountRecord[] {
  return [
    {
      cycleCountId: "count_1",
      shelfCode: "A1",
      locationId: "loc_bengaluru-main-hub",
      expectedQuantity: 200,
      countedQuantity: 198,
      variance: -2,
      reasonCode: "COUNT-DIFF",
      status: "approved",
      approvalRequired: false,
      approvedBy: "user_supervisor",
      countedBy: "user_admin",
      countedByName: "Admin User",
      countedAt: iso(subHours(now, 6))
    }
  ];
}

function makeDamageLog(now: Date): DamageRecord[] {
  return [
    {
      damageId: "damage_1",
      itemId: "item_rz-gown-011",
      locationId: "loc_bengaluru-main-hub",
      shelfCode: "A5",
      quantity: 3,
      damageReason: "torn packaging",
      notes: "Outer wrapper split during shelf handling.",
      createdBy: "user_admin",
      createdByName: "Admin User",
      createdAt: iso(subHours(now, 1))
    }
  ];
}

function makeRepairLog(now: Date): RepairRecord[] {
  return [
    {
      repairId: "repair_1",
      itemId: "item_rz-gown-011",
      locationId: "loc_pune-repair-qa-hub",
      shelfCode: "R1",
      quantity: 4,
      repairReason: "Stitching issue",
      repairStatus: "in repair",
      assignedTo: "Repair Team A",
      notes: "Awaiting seam reinforcement.",
      createdBy: "user_supervisor",
      createdByName: "Supervisor User",
      updatedAt: iso(subHours(now, 5))
    }
  ];
}

function makePacking(now: Date): {
  packingOrders: PackingOrderRecord[];
  packingOrderItems: PackingOrderItemRecord[];
  pdfLogs: PdfLogRecord[];
} {
  const orderId = "pack_order_1";
  const fileId = "pdf_1";
  return {
    packingOrders: [
      {
        packingOrderId: orderId,
        orderNumber: "ORD-2026-0009",
        locationId: "loc_hyderabad-dispatch-center",
        packedBy: "user_supervisor",
        packedByName: "Supervisor User",
        packedAt: iso(subHours(now, 2)),
        totalLines: 2,
        totalQuantity: 28,
        pdfFileId: fileId
      }
    ],
    packingOrderItems: [
      {
        packingOrderItemId: "pack_item_1",
        packingOrderId: orderId,
        itemId: "item_rz-pack-100",
        sku: "RZ-PACK-100",
        upc: "5011259898443",
        productName: "Sterile Packaging Tie",
        shelfCode: "P4",
        quantity: 20
      },
      {
        packingOrderItemId: "pack_item_2",
        packingOrderId: orderId,
        itemId: "item_rz-drape-030",
        sku: "RZ-DRAPE-030",
        upc: "5011816096899",
        productName: "Procedure Drape",
        shelfCode: "P2",
        quantity: 8
      }
    ],
    pdfLogs: [
      {
        pdfId: "pdf_log_1",
        packingOrderId: orderId,
        fileId,
        createdAt: iso(subHours(now, 2)),
        createdBy: "user_supervisor"
      }
    ]
  };
}

function makeUnpackLog(now: Date): UnpackRecord[] {
  return [
    {
      unpackId: "unpack_1",
      itemId: "item_rz-pack-100",
      locationId: "loc_hyderabad-dispatch-center",
      shelfCode: "P4",
      quantity: 2,
      unpackReason: "packing error",
      returnDisposition: "return to stock",
      unpackedBy: "user_supervisor",
      unpackedByName: "Supervisor User",
      unpackedAt: iso(subHours(now, 1))
    }
  ];
}

function makeUploadedFiles(now: Date): UploadedFileRecord[] {
  return [
    {
      fileId: "upload_1",
      fileName: "po-24811.jpg",
      fileType: "image/jpeg",
      storageMode: "local",
      localPath: ".data/uploads/po-24811.jpg",
      referenceType: "po-photo",
      referenceId: "receipt_1",
      uploadedBy: "user_admin",
      uploadedAt: iso(subHours(now, 4))
    }
  ];
}

function makeExceptions(now: Date): ExceptionRecord[] {
  return [
    {
      exceptionId: "exception_1",
      type: "failed quality check",
      itemId: "item_rz-gown-011",
      locationId: "loc_bengaluru-main-hub",
      notes: "Held for repair after stitching issue found.",
      supervisorReview: true,
      createdAt: iso(subHours(now, 2)),
      createdBy: "user_supervisor",
      createdByName: "Supervisor User"
    }
  ];
}

function makeAuditTrail(now: Date): AuditRecord[] {
  return [
    {
      actionId: "audit_1",
      actionType: "pack",
      userId: "user_supervisor",
      userName: "Supervisor User",
      role: "supervisor",
      locationId: "loc_hyderabad-dispatch-center",
      sku: "RZ-PACK-100",
      productName: "Sterile Packaging Tie",
      shelfCode: "P4",
      quantity: 20,
      timestamp: iso(subHours(now, 2)),
      referenceNumber: "ORD-2026-0009"
    }
  ];
}

export function createSeedDatabase(): DatabaseShape {
  const now = new Date();
  const imported = buildImportedInventory();
  const users = makeUsers(now);
  const { receipts, receiptItems } = makeReceipts(now);
  const qualityChecks = makeQualityChecks(now);
  const cycleCounts = makeCycleCounts(now);
  const damageLog = makeDamageLog(now);
  const repairLog = makeRepairLog(now);
  const { packingOrders, packingOrderItems, pdfLogs } = makePacking(now);
  const unpackLog = makeUnpackLog(now);
  const uploadedFiles = makeUploadedFiles(now);

  return {
    schemaVersion: 4,
    users,
    roles: makeRoles(),
    locations: imported.locations,
    shelves: imported.shelves,
    items: imported.items,
    inventory: imported.inventory,
    transactions: makeTransactions(now),
    receipts,
    receiptItems,
    qualityTemplates: makeQualityTemplates(),
    qualityChecks,
    cycleCounts,
    damageLog,
    repairLog,
    packingOrders,
    packingOrderItems,
    unpackLog,
    reasonCodes: makeReasonCodes(),
    settings: makeSettings(),
    auditTrail: makeAuditTrail(now),
    exceptions: makeExceptions(now),
    uploadedFiles,
    pdfLogs
  };
}

export function getDemoCredentials() {
  return [
    { role: "Admin", email: "admin@rz-circular.com", password: "Admin@123" },
    {
      role: "Supervisor",
      email: "supervisor@rz-circular.com",
      password: "Supervisor@123"
    },
    {
      role: "Operator",
      email: "operator@rz-circular.com",
      password: "Operator@123"
    }
  ];
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    assignedLocationId: user.assignedLocationId,
    locationIds: user.locationIds,
    googleLinked: user.googleLinked,
    googleEmail: user.googleEmail
  };
}

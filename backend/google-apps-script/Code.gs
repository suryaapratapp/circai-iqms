const CONFIG = {
  TOKEN: PropertiesService.getScriptProperties().getProperty("API_TOKEN"),
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"),
  UPLOADS_FOLDER_ID:
    PropertiesService.getScriptProperties().getProperty("UPLOADS_FOLDER_ID") ||
    "18-qlwhSAaP2Sgv39Q_ogoWNMKzPWrp55",
  PDF_FOLDER_ID: PropertiesService.getScriptProperties().getProperty("PDF_FOLDER_ID"),
  SHEETS: {
    USERS: "Users",
    ROLES: "Roles",
    LOCATIONS: "Locations",
    SHELVES: "Shelves",
    PRODUCT_MASTER: "ProductMaster",
    INVENTORY: "Inventory",
    TRANSACTIONS: "Transactions",
    RECEIPTS: "Receipts",
    RECEIPT_ITEMS: "ReceiptItems",
    QUALITY_TEMPLATES: "QualityTemplates",
    QUALITY_CHECKS: "QualityChecks",
    DAMAGE_LOG: "DamageLog",
    REPAIR_LOG: "RepairLog",
    CYCLE_COUNTS: "CycleCounts",
    PACKING_ORDERS: "PackingOrders",
    PACKING_ORDER_ITEMS: "PackingOrderItems",
    UNPACK_LOG: "UnpackLog",
    SETTINGS: "Settings",
    REASON_CODES: "ReasonCodes",
    AUDIT_TRAIL: "AuditTrail",
    UPLOADED_FILES: "UploadedFiles",
    PDF_LOGS: "PDFLogs"
  }
};

const RUNTIME_RECORD_CACHE = {};

const DEMO_LOCATIONS = [
  {
    locationId: "loc_bengaluru-main-hub",
    code: "BMH",
    name: "Bengaluru Main Hub",
    address: "Bengaluru, India",
    timezone: "Asia/Kolkata",
    status: "active"
  },
  {
    locationId: "loc_hyderabad-dispatch-center",
    code: "HDC",
    name: "Hyderabad Dispatch Center",
    address: "Hyderabad, India",
    timezone: "Asia/Kolkata",
    status: "active"
  },
  {
    locationId: "loc_pune-repair-qa-hub",
    code: "PRQ",
    name: "Pune Repair & QA Hub",
    address: "Pune, India",
    timezone: "Asia/Kolkata",
    status: "active"
  }
];

const DEMO_ROLES = [
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

const DEMO_USERS = [
  {
    userId: "user_admin",
    fullName: "Admin User",
    email: "admin@rz-circular.com",
    passwordHash:
      "335223a340b17c915ecbaf32b1c89791:3b840fe865409cf37eed921f4cd28bcbbc379b6e6acc0684b94b752151bdb251140b05a109230ccbd0d1355d92a593219aec55479e8bcd3c74b0148eff641244",
    role: "admin",
    assignedLocationId: "loc_bengaluru-main-hub",
    locationIds: [
      "loc_bengaluru-main-hub",
      "loc_hyderabad-dispatch-center",
      "loc_pune-repair-qa-hub"
    ],
    status: "active",
    approvalStatus: "approved",
    googleLinked: true,
    googleEmail: "admin@rz-circular.com",
    googleSubject: "google-subject-admin"
  },
  {
    userId: "user_supervisor",
    fullName: "Supervisor User",
    email: "supervisor@rz-circular.com",
    passwordHash:
      "b16a8a0120aaa268ab4d492ad9a2f45e:5092eda2bc83a20f92d0a385fb3a4b762fed5c22feec8d33b44a70b62590e646fb778a1557fb27eba66cb51614e3491bdbfa116099aaec40d77d9d00557e770c",
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
    googleSubject: "google-subject-supervisor"
  },
  {
    userId: "user_operator_1",
    fullName: "Warehouse Operator",
    email: "operator@rz-circular.com",
    passwordHash:
      "d2f8a3094669a93a0fc1a6086388b3a1:864116161494c61908e5c36e034e22b666e7ab5e0a435b22b8fcf28335aee9d8910e3b1d0817d04f441421b32ee90cd54238b61aff16f310011bf3fbdd7a2e08",
    role: "operator",
    assignedLocationId: "loc_pune-repair-qa-hub",
    locationIds: ["loc_pune-repair-qa-hub"],
    status: "active",
    approvalStatus: "approved",
    googleLinked: false,
    googleEmail: "",
    googleSubject: ""
  }
];

function doGet(e) {
  return handleRequest_(e, "GET");
}

function doPost(e) {
  return handleRequest_(e, "POST");
}

function handleRequest_(e, method) {
  try {
    const payload = parsePayload_(e);
    const path = String((e.parameter && e.parameter.path) || payload.path || "")
      .replace(/^\/+/, "")
      .trim();

    assertAuthorised_(e, payload);
    ensureDemoIdentitySeed_();
    const result = routeRequest_(path, method, payload);
    return jsonResponse_(result);
  } catch (error) {
    return jsonResponse_({
      error: error && error.message ? error.message : "Unexpected Apps Script error."
    });
  }
}

function routeRequest_(path, method, payload) {
  switch (path) {
    case "health":
      return { ok: true, service: "IQMS Apps Script" };

    case "login":
    case "auth/login":
      return login_(payload);
    case "auth/register":
      return register_(payload);
    case "auth/google-user":
      return findGoogleUser_(payload);
    case "auth/google-link":
      return linkGoogleAccount_(payload);
    case "auth/last-login":
      return updateLastLogin_(payload);
    case "initialiseDemoUsers":
      return initialiseDemoUsers_();

    case "getUsers":
      return getUsers_();
    case "getLocations":
      return getScopedLocations_(payload.session);
    case "getShelves":
      return getScopedShelves_(payload.session);
    case "getProducts":
      return getItems_();

    case "getDashboard":
      return getDashboard_(payload.session);
    case "getWorkflowLookups":
      return getWorkflowLookups_(payload.session, payload);
    case "getLookups":
      return getLookups_(payload.session);
    case "searchByShelf":
      return searchByShelf_(payload.code, payload.session);
    case "searchBySku":
      return searchBySku_(payload.query, payload.session);
    case "getInventory":
      return listInventory_(payload.session);
    case "getInventoryItem":
      return getInventoryItem_(payload.itemId, payload.session);
    case "getReports":
      return getReports_(payload.session);
    case "getAdminData":
      return getAdminData_(payload.session);
    case "getTransactions":
      return getTransactions_(payload.session);
    case "getPackedOrders":
      return getPackedOrders_(payload.session);
    case "getPackedOrder":
      return getPackedOrder_(payload.packingOrderId, payload.session);

    case "receiveStock":
      return receiveStock_(payload);
    case "moveItem":
      return moveItem_(payload);
    case "damageItem":
      return damageItem_(payload);
    case "repairItem":
      return repairItem_(payload);
    case "packOrder":
      return packOrder_(payload);
    case "unpackOrder":
      return unpackOrder_(payload);

    case "uploadFile":
      return uploadFile_(payload);
    case "importInventory":
      return importInventory_(payload);
    case "getPackingSlipPdf":
      return getPackingSlipPdf_(payload);

    default:
      throw new Error("Unsupported route: " + path);
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents);
}

function ensureDemoIdentitySeed_() {
  const usersSheet = getSheet_(CONFIG.SHEETS.USERS);
  const userRowCount = Math.max(usersSheet.getLastRow() - 1, 0);
  if (userRowCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  if (Math.max(getSheet_(CONFIG.SHEETS.ROLES).getLastRow() - 1, 0) === 0) {
    DEMO_ROLES.forEach(function (role) {
      appendRecord_(CONFIG.SHEETS.ROLES, role);
    });
  }

  if (Math.max(getSheet_(CONFIG.SHEETS.LOCATIONS).getLastRow() - 1, 0) === 0) {
    DEMO_LOCATIONS.forEach(function (location) {
      appendRecord_(CONFIG.SHEETS.LOCATIONS, location);
    });
  }

  DEMO_USERS.forEach(function (user) {
    appendRecord_(CONFIG.SHEETS.USERS, {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      assignedLocationId: user.assignedLocationId,
      locationIds: user.locationIds,
      status: user.status,
      approvalStatus: user.approvalStatus,
      googleLinked: user.googleLinked,
      googleEmail: user.googleEmail,
      googleSubject: user.googleSubject,
      createdAt: now,
      lastLogin: ""
    });
  });
}

function initialiseDemoUsers_() {
  ensureDemoIdentitySeed_();
  return {
    ok: true,
    users: getUsers_().length,
    roles: getRoles_().length,
    locations: getLocations_().length
  };
}

function assertAuthorised_(e, payload) {
  if (!CONFIG.TOKEN) {
    throw new Error("API_TOKEN is not configured.");
  }

  const token = String(
    (e.parameter && e.parameter.token) ||
      payload.token ||
      ""
  );
  if (token !== CONFIG.TOKEN) {
    throw new Error("Unauthorised");
  }
}

function getSpreadsheet_() {
  if (!CONFIG.SPREADSHEET_ID) {
    throw new Error("SPREADSHEET_ID is not configured.");
  }
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheet_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }
  return sheet;
}

function getHeaders_(sheetName) {
  const sheet = getSheet_(sheetName);
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) {
    throw new Error("Missing header row on sheet: " + sheetName);
  }
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function isReferenceSheet_(sheetName) {
  return [
    CONFIG.SHEETS.ROLES,
    CONFIG.SHEETS.LOCATIONS,
    CONFIG.SHEETS.SHELVES,
    CONFIG.SHEETS.QUALITY_TEMPLATES,
    CONFIG.SHEETS.REASON_CODES,
    CONFIG.SHEETS.SETTINGS
  ].indexOf(sheetName) > -1;
}

function getSheetCacheKey_(sheetName) {
  return "records::" + sheetName;
}

function clearSheetCaches_(sheetName) {
  delete RUNTIME_RECORD_CACHE[sheetName];
  CacheService.getScriptCache().remove(getSheetCacheKey_(sheetName));
}

function getRecords_(sheetName) {
  if (RUNTIME_RECORD_CACHE[sheetName]) {
    return RUNTIME_RECORD_CACHE[sheetName];
  }

  const cacheKey = getSheetCacheKey_(sheetName);
  if (isReferenceSheet_(sheetName)) {
    const cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      RUNTIME_RECORD_CACHE[sheetName] = parsed;
      return parsed;
    }
  }

  const values = getSheet_(sheetName).getDataRange().getValues();
  if (values.length < 2) {
    RUNTIME_RECORD_CACHE[sheetName] = [];
    return [];
  }

  const headers = values[0];
  const records = values.slice(1).map(function (row) {
    const record = {};
    headers.forEach(function (header, index) {
      record[header] = row[index];
    });
    return record;
  });

  RUNTIME_RECORD_CACHE[sheetName] = records;
  if (isReferenceSheet_(sheetName)) {
    try {
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(records), 300);
    } catch (_error) {
      // Ignore cache serialisation limits and continue with live sheet data.
    }
  }
  return records;
}

function appendRecord_(sheetName, record) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheetName);
  const row = headers.map(function (header) {
    return serialiseForSheet_(record[header]);
  });
  sheet.appendRow(row);
  clearSheetCaches_(sheetName);
}

function updateRecord_(sheetName, idField, idValue, nextRecord) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idField);

  if (idIndex === -1) {
    throw new Error("Missing id field " + idField + " on " + sheetName);
  }

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(idValue)) {
      const row = headers.map(function (header, headerIndex) {
        if (Object.prototype.hasOwnProperty.call(nextRecord, header)) {
          return serialiseForSheet_(nextRecord[header]);
        }
        return values[rowIndex][headerIndex];
      });
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
      clearSheetCaches_(sheetName);
      return;
    }
  }

  throw new Error("Record not found for update in " + sheetName + ".");
}

function serialiseForSheet_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

function createId_(prefix) {
  return prefix + "_" + Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}

function cloneObject_(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalise_(value) {
  return String(value || "").trim().toLowerCase();
}

function parseBoolean_(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return ["true", "yes", "1"].indexOf(normalise_(value)) > -1;
}

function parseNumber_(value, fallback) {
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

function parseArray_(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  const text = String(value).trim();
  if (!text) {
    return [];
  }
  if (text.charAt(0) === "[") {
    try {
      return JSON.parse(text);
    } catch (_error) {
      return [];
    }
  }
  return text
    .split(",")
    .map(function (entry) {
      return String(entry).trim();
    })
    .filter(Boolean);
}

function parseText_(value, label) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(label + " is required.");
  }
  return text;
}

function parsePositiveNumber_(value, label) {
  const quantity = Number(value);
  if (!isFinite(quantity) || quantity <= 0) {
    throw new Error(label + " must be greater than zero.");
  }
  return quantity;
}

function parseNonNegativeNumber_(value, label) {
  const quantity = Number(value);
  if (!isFinite(quantity) || quantity < 0) {
    throw new Error(label + " cannot be negative.");
  }
  return quantity;
}

function requireSession_(session) {
  if (!session || !session.userId) {
    throw new Error("Session is required.");
  }
  return {
    userId: String(session.userId),
    fullName: String(session.fullName || ""),
    email: String(session.email || ""),
    role: String(session.role || "operator"),
    assignedLocationId: String(session.assignedLocationId || ""),
    locationIds: parseArray_(session.locationIds)
  };
}

function locationAllowed_(session, locationId) {
  if (!session || !session.locationIds || !session.locationIds.length) {
    return true;
  }
  return session.locationIds.indexOf(String(locationId || "")) > -1;
}

function scopeRecords_(records, session, locationField) {
  return records.filter(function (record) {
    return locationAllowed_(session, record[locationField]);
  });
}

function resolveLocationId_(session, requestedLocationId) {
  const text = String(requestedLocationId || "").trim();
  if (text && locationAllowed_(session, text)) {
    return text;
  }
  return session.assignedLocationId;
}

function getUsers_() {
  return getRecords_(CONFIG.SHEETS.USERS).map(function (user) {
    const assignedLocationId = String(
      user.assignedLocationId || user.location || ""
    );
    const parsedLocationIds = parseArray_(user.locationIds);
    return {
      userId: String(user.userId || ""),
      fullName: String(user.fullName || ""),
      email: String(user.email || ""),
      passwordHash: String(user.passwordHash || ""),
      role: String(user.role || "operator"),
      assignedLocationId: assignedLocationId,
      locationIds: parsedLocationIds.length
        ? parsedLocationIds
        : assignedLocationId
          ? [assignedLocationId]
          : [],
      status: String(user.status || "active"),
      approvalStatus: String(user.approvalStatus || "approved"),
      googleLinked: parseBoolean_(user.googleLinked),
      googleEmail: user.googleEmail ? String(user.googleEmail) : "",
      googleSubject: user.googleSubject ? String(user.googleSubject) : "",
      createdAt: String(user.createdAt || ""),
      lastLogin: user.lastLogin ? String(user.lastLogin) : ""
    };
  });
}

function getRoles_() {
  return getRecords_(CONFIG.SHEETS.ROLES).map(function (role) {
    return {
      roleId: String(role.roleId || ""),
      name: String(role.name || ""),
      description: String(role.description || ""),
      permissions: parseArray_(role.permissions)
    };
  });
}

function getLocations_() {
  return getRecords_(CONFIG.SHEETS.LOCATIONS).map(function (location) {
    return {
      locationId: String(location.locationId || ""),
      code: String(location.code || ""),
      name: String(location.name || ""),
      address: String(location.address || ""),
      timezone: String(location.timezone || ""),
      status: String(location.status || "active")
    };
  });
}

function getScopedLocations_(session) {
  const activeSession = session ? requireSession_(session) : null;
  return activeSession
    ? scopeRecords_(getLocations_(), activeSession, "locationId")
    : getLocations_();
}

function getShelves_() {
  return getRecords_(CONFIG.SHEETS.SHELVES).map(function (shelf) {
    return {
      shelfId: String(shelf.shelfId || ""),
      locationId: String(shelf.locationId || ""),
      warehouse: String(shelf.warehouse || ""),
      zone: String(shelf.zone || ""),
      aisle: String(shelf.aisle || ""),
      rack: String(shelf.rack || ""),
      shelf: String(shelf.shelf || ""),
      code: String(shelf.code || ""),
      capacityUnits: parseNumber_(shelf.capacityUnits, 0),
      status: String(shelf.status || "active")
    };
  });
}

function getScopedShelves_(session) {
  const activeSession = session ? requireSession_(session) : null;
  return activeSession
    ? scopeRecords_(getShelves_(), activeSession, "locationId")
    : getShelves_();
}

function getItems_() {
  return getRecords_(CONFIG.SHEETS.PRODUCT_MASTER).map(function (item) {
    return {
      itemId: String(item.itemId || ""),
      sku: String(item.sku || ""),
      upc: String(item.upc || ""),
      qrCode: String(item.qrCode || ""),
      itemName: String(item.itemName || ""),
      description: String(item.description || ""),
      category: String(item.category || ""),
      unitOfMeasure: String(item.unitOfMeasure || "Units"),
      packSize: String(item.packSize || ""),
      imageUrl: item.imageUrl ? String(item.imageUrl) : "",
      reorderThreshold: parseNumber_(item.reorderThreshold, 0),
      status: String(item.status || "active"),
      supplier: String(item.supplier || ""),
      batchLot: item.batchLot ? String(item.batchLot) : "",
      expiryDate: item.expiryDate ? String(item.expiryDate) : "",
      requiresQualityCheck: parseBoolean_(item.requiresQualityCheck),
      createdAt: String(item.createdAt || ""),
      updatedAt: String(item.updatedAt || "")
    };
  });
}

function getInventory_() {
  return getRecords_(CONFIG.SHEETS.INVENTORY).map(function (record) {
    const inventory = {
      inventoryId: String(record.inventoryId || ""),
      itemId: String(record.itemId || ""),
      locationId: String(record.locationId || ""),
      shelfId: record.shelfId ? String(record.shelfId) : "",
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      quantityOnHand: parseNumber_(record.quantityOnHand, 0),
      quantityAvailable: parseNumber_(record.quantityAvailable, 0),
      quantityDamaged: parseNumber_(record.quantityDamaged, 0),
      quantityDamagedToRepair: parseNumber_(
        record.quantityDamagedToRepair,
        record.status === "under repair"
          ? parseNumber_(record.quantityUnderRepair, 0)
          : parseNumber_(record.quantityDamaged, 0)
      ),
      quantityDamagedBeyondRepair: parseNumber_(record.quantityDamagedBeyondRepair, 0),
      quantityUnderRepair: 0,
      quantityPacked: parseNumber_(record.quantityPacked, 0),
      quantityPendingInbound: parseNumber_(record.quantityPendingInbound, 0),
      quantityQuarantined: parseNumber_(record.quantityQuarantined, 0),
      reorderThreshold: parseNumber_(record.reorderThreshold, 0),
      supplier: record.supplier ? String(record.supplier) : "",
      batchLot: record.batchLot ? String(record.batchLot) : "",
      expiryDate: record.expiryDate ? String(record.expiryDate) : "",
      status: String(record.status || "stored"),
      createdAt: String(record.createdAt || ""),
      lastUpdatedAt: String(record.lastUpdatedAt || "")
    };
    return syncInventoryStatus_(inventory);
  });
}

function getDamagedToRepairQuantity_(inventory) {
  return parseNumber_(inventory.quantityDamagedToRepair, 0);
}

function getDamagedBeyondRepairQuantity_(inventory) {
  return parseNumber_(inventory.quantityDamagedBeyondRepair, 0);
}

function getTotalDamagedQuantity_(inventory) {
  return (
    getDamagedToRepairQuantity_(inventory) +
    getDamagedBeyondRepairQuantity_(inventory)
  );
}

function isRepairEligibleInventory_(inventory) {
  return getDamagedToRepairQuantity_(inventory) > 0;
}

function syncInventoryBuckets_(inventory) {
  inventory.quantityDamaged = getTotalDamagedQuantity_(inventory);
  inventory.quantityUnderRepair = 0;
  return inventory;
}

function deriveInventoryStatus_(inventory) {
  if (
    parseNumber_(inventory.quantityPacked, 0) > 0 &&
    parseNumber_(inventory.quantityAvailable, 0) <= 0
  ) {
    return "packed";
  }
  if (parseNumber_(inventory.quantityAvailable, 0) > 0) {
    return "stored";
  }
  if (parseNumber_(inventory.quantityQuarantined, 0) > 0) {
    return "quarantined";
  }
  if (getDamagedToRepairQuantity_(inventory) > 0) {
    return "damaged (to repair)";
  }
  if (getDamagedBeyondRepairQuantity_(inventory) > 0) {
    return "damaged (beyond repair)";
  }
  if (parseNumber_(inventory.quantityOnHand, 0) > 0) {
    return "received";
  }
  return "stored";
}

function syncInventoryStatus_(inventory) {
  syncInventoryBuckets_(inventory);
  inventory.status = deriveInventoryStatus_(inventory);
  return inventory;
}

function isBlockedForPacking_(inventory) {
  return inventory.status === "quarantined" || inventory.status === "quality failed";
}

function getTransactionsRaw_() {
  return getRecords_(CONFIG.SHEETS.TRANSACTIONS).map(function (transaction) {
    return {
      transactionId: String(transaction.transactionId || ""),
      itemId: transaction.itemId ? String(transaction.itemId) : "",
      itemName: transaction.itemName ? String(transaction.itemName) : "",
      sku: transaction.sku ? String(transaction.sku) : "",
      upc: transaction.upc ? String(transaction.upc) : "",
      transactionType: String(transaction.transactionType || ""),
      quantity: parseNumber_(transaction.quantity, 0),
      locationId: String(transaction.locationId || ""),
      shelfCode: transaction.shelfCode ? String(transaction.shelfCode) : "",
      userId: String(transaction.userId || ""),
      userName: String(transaction.userName || ""),
      role: String(transaction.role || "operator"),
      timestamp: String(transaction.timestamp || ""),
      notes: transaction.notes ? String(transaction.notes) : "",
      referenceNumber: transaction.referenceNumber
        ? String(transaction.referenceNumber)
        : "",
      reasonCode: transaction.reasonCode ? String(transaction.reasonCode) : "",
      previousValue: transaction.previousValue ? String(transaction.previousValue) : "",
      newValue: transaction.newValue ? String(transaction.newValue) : "",
      status: String(transaction.status || "logged")
    };
  });
}

function getQualityTemplates_() {
  return getRecords_(CONFIG.SHEETS.QUALITY_TEMPLATES).map(function (template) {
    return {
      templateId: String(template.templateId || ""),
      category: String(template.category || ""),
      name: String(template.name || ""),
      checklist: parseArray_(template.checklist),
      samplingMode: String(template.samplingMode || "100%"),
      active: parseBoolean_(template.active)
    };
  });
}

function getQualityChecks_() {
  return getRecords_(CONFIG.SHEETS.QUALITY_CHECKS).map(function (record) {
    return {
      qualityCheckId: String(record.qualityCheckId || ""),
      itemId: String(record.itemId || ""),
      inventoryId: record.inventoryId ? String(record.inventoryId) : "",
      locationId: String(record.locationId || ""),
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      checklistTemplateId: String(record.checklistTemplateId || ""),
      result: String(record.result || ""),
      defectCategory: record.defectCategory ? String(record.defectCategory) : "",
      disposition: record.disposition ? String(record.disposition) : "",
      notes: record.notes ? String(record.notes) : "",
      checkedBy: String(record.checkedBy || ""),
      checkedByName: String(record.checkedByName || ""),
      checkedAt: String(record.checkedAt || ""),
      photoFileId: record.photoFileId ? String(record.photoFileId) : ""
    };
  });
}

function getDamageLog_() {
  return getRecords_(CONFIG.SHEETS.DAMAGE_LOG).map(function (record) {
    return {
      damageId: String(record.damageId || ""),
      itemId: String(record.itemId || ""),
      locationId: String(record.locationId || ""),
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      quantity: parseNumber_(record.quantity, 0),
      damageOutcome: String(record.damageOutcome || record.damageReason || ""),
      damageReason: String(record.damageReason || ""),
      notes: record.notes ? String(record.notes) : "",
      createdBy: String(record.createdBy || ""),
      createdByName: String(record.createdByName || ""),
      createdAt: String(record.createdAt || "")
    };
  });
}

function getRepairLog_() {
  return getRecords_(CONFIG.SHEETS.REPAIR_LOG).map(function (record) {
    return {
      repairId: String(record.repairId || ""),
      itemId: String(record.itemId || ""),
      locationId: String(record.locationId || ""),
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      quantity: parseNumber_(record.quantity, 0),
      repairReason: String(record.repairReason || ""),
      repairStatus: String(record.repairStatus || ""),
      assignedTo: String(record.assignedTo || ""),
      notes: record.notes ? String(record.notes) : "",
      createdBy: String(record.createdBy || ""),
      createdByName: String(record.createdByName || ""),
      updatedAt: String(record.updatedAt || "")
    };
  });
}

function getCycleCounts_() {
  return getRecords_(CONFIG.SHEETS.CYCLE_COUNTS).map(function (record) {
    return {
      cycleCountId: String(record.cycleCountId || ""),
      itemId: record.itemId ? String(record.itemId) : "",
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      locationId: String(record.locationId || ""),
      expectedQuantity: parseNumber_(record.expectedQuantity, 0),
      countedQuantity: parseNumber_(record.countedQuantity, 0),
      variance: parseNumber_(record.variance, 0),
      reasonCode: String(record.reasonCode || ""),
      status: String(record.status || "pending"),
      approvalRequired: parseBoolean_(record.approvalRequired),
      approvedBy: record.approvedBy ? String(record.approvedBy) : "",
      countedBy: String(record.countedBy || ""),
      countedByName: String(record.countedByName || ""),
      countedAt: String(record.countedAt || "")
    };
  });
}

function getPackingOrders_() {
  return getRecords_(CONFIG.SHEETS.PACKING_ORDERS).map(function (record) {
    return {
      packingOrderId: String(record.packingOrderId || ""),
      orderNumber: String(record.orderNumber || ""),
      locationId: String(record.locationId || ""),
      packedBy: String(record.packedBy || ""),
      packedByName: String(record.packedByName || ""),
      packedAt: String(record.packedAt || ""),
      status: String(record.status || "packed"),
      notes: record.notes ? String(record.notes) : "",
      totalLines: parseNumber_(record.totalLines, 0),
      totalQuantity: parseNumber_(record.totalQuantity, 0),
      unpackedQuantity: parseNumber_(record.unpackedQuantity, 0),
      pdfFileId: record.pdfFileId ? String(record.pdfFileId) : "",
      updatedAt: String(record.updatedAt || record.packedAt || "")
    };
  });
}

function getPackingOrderItems_() {
  return getRecords_(CONFIG.SHEETS.PACKING_ORDER_ITEMS).map(function (record) {
    return {
      packingOrderItemId: String(record.packingOrderItemId || ""),
      packingOrderId: String(record.packingOrderId || ""),
      itemId: String(record.itemId || ""),
      sku: String(record.sku || ""),
      upc: String(record.upc || ""),
      productName: String(record.productName || ""),
      shelfCode: String(record.shelfCode || ""),
      quantity: parseNumber_(record.quantity, 0),
      unpackedQuantity: parseNumber_(record.unpackedQuantity, 0)
    };
  });
}

function getReceipts_() {
  return getRecords_(CONFIG.SHEETS.RECEIPTS).map(function (record) {
    return {
      receiptId: String(record.receiptId || ""),
      poNumber: String(record.poNumber || ""),
      supplierName: String(record.supplierName || ""),
      poPhotoFileId: record.poPhotoFileId ? String(record.poPhotoFileId) : "",
      locationId: String(record.locationId || ""),
      receivedBy: String(record.receivedBy || ""),
      receivedByName: String(record.receivedByName || ""),
      receivedAt: String(record.receivedAt || ""),
      totalLines: parseNumber_(record.totalLines, 0),
      totalQuantity: parseNumber_(record.totalQuantity, 0),
      notes: record.notes ? String(record.notes) : ""
    };
  });
}

function getReasonCodes_() {
  return getRecords_(CONFIG.SHEETS.REASON_CODES).map(function (record) {
    return {
      reasonCodeId: record.reasonCodeId ? String(record.reasonCodeId) : "",
      code: String(record.code || ""),
      category: String(record.category || ""),
      label: String(record.label || ""),
      approvalRequired: parseBoolean_(record.approvalRequired)
    };
  });
}

function getSettings_() {
  return getRecords_(CONFIG.SHEETS.SETTINGS).map(function (record) {
    return {
      settingId: String(record.settingId || ""),
      key: String(record.key || ""),
      value: String(record.value || ""),
      description: record.description ? String(record.description) : ""
    };
  });
}

function getAuditTrail_() {
  return getRecords_(CONFIG.SHEETS.AUDIT_TRAIL).map(function (record) {
    return {
      actionId: String(record.actionId || ""),
      actionType: String(record.actionType || ""),
      userId: String(record.userId || ""),
      userName: String(record.userName || ""),
      role: String(record.role || ""),
      locationId: String(record.locationId || ""),
      sku: record.sku ? String(record.sku) : "",
      productName: record.productName ? String(record.productName) : "",
      shelfCode: record.shelfCode ? String(record.shelfCode) : "",
      quantity: parseNumber_(record.quantity, 0),
      previousValue: record.previousValue ? String(record.previousValue) : "",
      newValue: record.newValue ? String(record.newValue) : "",
      timestamp: String(record.timestamp || ""),
      referenceNumber: record.referenceNumber ? String(record.referenceNumber) : "",
      notes: record.notes ? String(record.notes) : ""
    };
  });
}

function getUploadedFiles_() {
  return getRecords_(CONFIG.SHEETS.UPLOADED_FILES).map(function (record) {
    return {
      fileId: String(record.fileId || ""),
      fileName: String(record.fileName || ""),
      fileType: String(record.fileType || ""),
      storageMode: String(record.storageMode || ""),
      localPath: record.localPath ? String(record.localPath) : "",
      driveFileId: record.driveFileId ? String(record.driveFileId) : "",
      referenceType: record.referenceType ? String(record.referenceType) : "",
      referenceId: record.referenceId ? String(record.referenceId) : "",
      uploadedBy: String(record.uploadedBy || ""),
      uploadedAt: String(record.uploadedAt || "")
    };
  });
}

function getPdfLogs_() {
  return getRecords_(CONFIG.SHEETS.PDF_LOGS).map(function (record) {
    return {
      pdfId: String(record.pdfId || ""),
      packingOrderId: String(record.packingOrderId || ""),
      fileId: String(record.fileId || ""),
      createdAt: String(record.createdAt || ""),
      createdBy: String(record.createdBy || "")
    };
  });
}

function getPackingOrderStatus_(totalQuantity, unpackedQuantity) {
  if (unpackedQuantity <= 0) {
    return "packed";
  }
  if (unpackedQuantity >= totalQuantity) {
    return "unpacked";
  }
  return "partially unpacked";
}

function syncPackingOrder_(order, items) {
  const unpackedQuantity = items.reduce(function (sum, item) {
    return sum + parseNumber_(item.unpackedQuantity, 0);
  }, 0);
  order.unpackedQuantity = unpackedQuantity;
  order.status = getPackingOrderStatus_(order.totalQuantity, unpackedQuantity);
  order.updatedAt = new Date().toISOString();
  updateRecord_(CONFIG.SHEETS.PACKING_ORDERS, "packingOrderId", order.packingOrderId, order);
}

function getLocationMap_() {
  const map = {};
  getLocations_().forEach(function (location) {
    map[location.locationId] = location;
  });
  return map;
}

function getShelfMap_() {
  const map = {};
  getShelves_().forEach(function (shelf) {
    map[shelf.shelfId] = shelf;
  });
  return map;
}

function rowsForSession_(session) {
  const activeSession = requireSession_(session);
  const locationMap = getLocationMap_();
  const shelfMap = getShelfMap_();
  const items = getItems_();
  const itemMap = {};
  items.forEach(function (item) {
    itemMap[item.itemId] = item;
  });

  return getInventory_()
    .filter(function (record) {
      return activeSession.locationIds.indexOf(record.locationId) > -1;
    })
    .map(function (inventory) {
      return {
        item: itemMap[inventory.itemId],
        inventory: inventory,
        location: locationMap[inventory.locationId],
        shelf: inventory.shelfId ? shelfMap[inventory.shelfId] : undefined
      };
    })
    .filter(function (row) {
      return !!row.item;
    });
}

function getTransactions_(session) {
  return scopeRecords_(getTransactionsRaw_(), requireSession_(session), "locationId").sort(
    function (a, b) {
      return String(b.timestamp).localeCompare(String(a.timestamp));
    }
  );
}

function getRecentTransactions_(session, limit) {
  const activeSession = requireSession_(session);
  const sheet = getSheet_(CONFIG.SHEETS.TRANSACTIONS);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || !lastColumn) {
    return [];
  }

  const headers = getHeaders_(CONFIG.SHEETS.TRANSACTIONS);
  const readWindow = Math.max(limit * 12, 120);
  const startRow = Math.max(2, lastRow - readWindow + 1);
  const values = sheet
    .getRange(startRow, 1, lastRow - startRow + 1, lastColumn)
    .getValues();

  return values
    .map(function (row) {
      const record = {};
      headers.forEach(function (header, index) {
        record[header] = row[index];
      });
      return {
        transactionId: String(record.transactionId || ""),
        itemId: record.itemId ? String(record.itemId) : "",
        itemName: record.itemName ? String(record.itemName) : "",
        sku: record.sku ? String(record.sku) : "",
        upc: record.upc ? String(record.upc) : "",
        transactionType: String(record.transactionType || ""),
        quantity: parseNumber_(record.quantity, 0),
        locationId: String(record.locationId || ""),
        shelfCode: record.shelfCode ? String(record.shelfCode) : "",
        userId: String(record.userId || ""),
        userName: String(record.userName || ""),
        role: String(record.role || "operator"),
        timestamp: String(record.timestamp || ""),
        notes: record.notes ? String(record.notes) : "",
        referenceNumber: record.referenceNumber ? String(record.referenceNumber) : "",
        reasonCode: record.reasonCode ? String(record.reasonCode) : "",
        previousValue: record.previousValue ? String(record.previousValue) : "",
        newValue: record.newValue ? String(record.newValue) : "",
        status: String(record.status || "logged")
      };
    })
    .filter(function (record) {
      return locationAllowed_(activeSession, record.locationId);
    })
    .sort(function (a, b) {
      return String(b.timestamp).localeCompare(String(a.timestamp));
    })
    .slice(0, limit);
}

function findItemByCode_(query) {
  const normalised = normalise_(query);
  return getItems_().find(function (item) {
    return [
      item.itemId,
      item.sku,
      item.upc,
      item.qrCode,
      item.itemName
    ]
      .filter(Boolean)
      .some(function (candidate) {
        return normalise_(candidate) === normalised;
      });
  });
}

function findShelfByCode_(code, locationId) {
  const normalised = normalise_(code);
  return getShelves_().find(function (shelf) {
    return (
      normalise_(shelf.code) === normalised &&
      (!locationId || String(shelf.locationId) === String(locationId))
    );
  });
}

function findInventoryRecord_(itemId, locationId, shelfCode) {
  const normalisedShelfCode = normalise_(shelfCode || "");
  return getInventory_().find(function (inventory) {
    return (
      String(inventory.itemId) === String(itemId) &&
      String(inventory.locationId) === String(locationId) &&
      normalise_(inventory.shelfCode || "") === normalisedShelfCode
    );
  });
}

function ensureInventoryRecord_(item, locationId, shelfCode, batchLot, expiryDate) {
  const shelf = shelfCode ? findShelfByCode_(shelfCode, locationId) : null;
  const existing = findInventoryRecord_(item.itemId, locationId, shelfCode);

  if (existing) {
    return existing;
  }

  const inventory = {
    inventoryId: createId_("inv"),
    itemId: item.itemId,
    locationId: locationId,
    shelfId: shelf ? shelf.shelfId : "",
    shelfCode: shelf ? shelf.code : "",
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
    batchLot: batchLot || item.batchLot || "",
    expiryDate: expiryDate || item.expiryDate || "",
    status: "received",
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };

  syncInventoryStatus_(inventory);
  appendRecord_(CONFIG.SHEETS.INVENTORY, inventory);
  return inventory;
}

function saveInventory_(inventory) {
  syncInventoryStatus_(inventory);
  updateRecord_(CONFIG.SHEETS.INVENTORY, "inventoryId", inventory.inventoryId, inventory);
}

function appendTransaction_(params) {
  const record = {
    transactionId: createId_("txn"),
    itemId: params.item ? params.item.itemId : "",
    itemName: params.item ? params.item.itemName : "",
    sku: params.item ? params.item.sku : "",
    upc: params.item ? params.item.upc : "",
    transactionType: params.transactionType,
    quantity: params.quantity,
    locationId: params.locationId,
    shelfCode: params.shelfCode || "",
    userId: params.session.userId,
    userName: params.session.fullName,
    role: params.session.role,
    timestamp: new Date().toISOString(),
    notes: params.notes || "",
    referenceNumber: params.referenceNumber || "",
    reasonCode: params.reasonCode || "",
    previousValue: params.previousValue ? JSON.stringify(params.previousValue) : "",
    newValue: params.newValue ? JSON.stringify(params.newValue) : "",
    status: params.status || "logged"
  };
  appendRecord_(CONFIG.SHEETS.TRANSACTIONS, record);
  return record;
}

function appendAudit_(params) {
  const record = {
    actionId: createId_("audit"),
    actionType: params.actionType,
    userId: params.session.userId,
    userName: params.session.fullName,
    role: params.session.role,
    locationId: params.locationId,
    sku: params.item ? params.item.sku : "",
    productName: params.item ? params.item.itemName : "",
    shelfCode: params.shelfCode || "",
    quantity: params.quantity || "",
    previousValue: params.previousValue ? JSON.stringify(params.previousValue) : "",
    newValue: params.newValue ? JSON.stringify(params.newValue) : "",
    timestamp: new Date().toISOString(),
    referenceNumber: params.referenceNumber || "",
    notes: params.notes || ""
  };
  appendRecord_(CONFIG.SHEETS.AUDIT_TRAIL, record);
  return record;
}

function getVarianceThreshold_() {
  const match = getSettings_().find(function (setting) {
    return setting.key === "cycleCountVarianceThreshold";
  });
  return parseNumber_(match ? match.value : "", 5);
}

function requireAvailable_(inventory, quantity, message) {
  if (inventory.quantityAvailable < quantity) {
    throw new Error(message);
  }
}

function unwrapPayload_(payload) {
  return payload && payload.payload ? payload.payload : payload;
}

function login_(payload) {
  const email = normalise_(payload.email);
  const passwordHash = String(payload.passwordHash || "");
  const password = String(payload.password || "");
  const user = getUsers_().find(function (candidate) {
    return normalise_(candidate.email) === email;
  });

  if (!user || user.status !== "active") {
    return { user: null, message: "No active user found for that account." };
  }
  if (user.approvalStatus !== "approved") {
    return { user: null, message: "Your account is awaiting admin approval." };
  }

  if (passwordHash && user.passwordHash === passwordHash) {
    return { user: user };
  }
  if (password && user.passwordHash === password) {
    return { user: user };
  }

  throw new Error(
    "Direct password validation is expected to run in the Next.js server layer for scrypt compatibility."
  );
}

function register_(payload) {
  const email = parseText_(payload.email, "Email");
  if (
    getUsers_().some(function (user) {
      return normalise_(user.email) === normalise_(email);
    })
  ) {
    return { user: null, message: "Email already exists." };
  }

  const locationId = parseText_(payload.assignedLocationId, "Assigned location");
  const user = {
    userId: createId_("user"),
    fullName: parseText_(payload.fullName, "Full name"),
    email: email,
    passwordHash: parseText_(payload.passwordHash, "Password hash"),
    role: parseText_(payload.role, "Role"),
    assignedLocationId: locationId,
    locationIds: [locationId],
    status: "active",
    approvalStatus: "pending approval",
    googleLinked: false,
    googleEmail: "",
    googleSubject: "",
    createdAt: new Date().toISOString(),
    lastLogin: ""
  };

  appendRecord_(CONFIG.SHEETS.USERS, user);
  return {
    user: null,
    message: "Registration submitted. An admin must approve this account before sign-in."
  };
}

function findGoogleUser_(payload) {
  const email = normalise_(payload.email);
  const subject = String(payload.subject || "");
  const user = getUsers_().find(function (candidate) {
    return (
      normalise_(candidate.email) === email ||
      String(candidate.googleSubject || "") === subject
    );
  });

  if (!user || user.status !== "active" || user.approvalStatus !== "approved") {
    return null;
  }
  return user;
}

function linkGoogleAccount_(payload) {
  const userId = parseText_(payload.userId, "User");
  const user = getUsers_().find(function (candidate) {
    return candidate.userId === userId;
  });
  if (!user) {
    throw new Error("User not found.");
  }

  user.googleLinked = true;
  user.googleEmail = parseText_(payload.googleEmail, "Google email");
  user.googleSubject = parseText_(payload.googleSubject, "Google subject");
  updateRecord_(CONFIG.SHEETS.USERS, "userId", user.userId, user);
  return user;
}

function updateLastLogin_(payload) {
  const userId = parseText_(payload.userId, "User");
  const user = getUsers_().find(function (candidate) {
    return candidate.userId === userId;
  });
  if (!user) {
    return { ok: true };
  }

  user.lastLogin = new Date().toISOString();
  updateRecord_(CONFIG.SHEETS.USERS, "userId", user.userId, user);
  return { ok: true };
}

function getDashboard_(session) {
  const activeSession = requireSession_(session);
  const rows = rowsForSession_(activeSession);
  const recentActivity = getRecentTransactions_(activeSession, 10);
  const quickActionsByRole = {
    admin: [
      { href: "/receive", label: "Receive" },
      { href: "/search", label: "Search" },
      { href: "/move", label: "Move" },
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
      { href: "/move", label: "Move" },
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
      { href: "/move", label: "Move" },
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
        value: rows.reduce(function (sum, row) {
          return sum + Number(row.inventory.quantityAvailable || 0);
        }, 0)
      },
      {
        label: "Held stock",
        value: rows.reduce(function (sum, row) {
          return (
            sum +
            getTotalDamagedQuantity_(row.inventory) +
            Number(row.inventory.quantityQuarantined || 0)
          );
        }, 0)
      }
    ],
    quickActions: quickActionsByRole[activeSession.role] || quickActionsByRole.operator,
    recentActivity: recentActivity,
    lastAction: recentActivity.length ? recentActivity[0] : null
  };
}

function getWorkflowLookups_(session, payload) {
  const activeSession = requireSession_(session);
  const includeShelves = parseBoolean_(payload.includeShelves);
  const includeItems = parseBoolean_(payload.includeItems);
  const includeReasonCodes = parseBoolean_(payload.includeReasonCodes);
  const includeQualityTemplates = parseBoolean_(payload.includeQualityTemplates);

  return {
    locations: scopeRecords_(getLocations_(), activeSession, "locationId"),
    shelves: includeShelves
      ? scopeRecords_(getShelves_(), activeSession, "locationId")
      : undefined,
    items: includeItems ? getItems_() : undefined,
    reasonCodes: includeReasonCodes ? getReasonCodes_() : undefined,
    qualityTemplates: includeQualityTemplates
      ? getQualityTemplates_().filter(function (template) {
          return template.active;
        })
      : undefined
  };
}

function getLookups_(session) {
  const activeSession = requireSession_(session);
  return {
    locations: scopeRecords_(getLocations_(), activeSession, "locationId"),
    shelves: scopeRecords_(getShelves_(), activeSession, "locationId"),
    items: getItems_(),
    reasonCodes: getReasonCodes_(),
    qualityTemplates: getQualityTemplates_().filter(function (template) {
      return template.active;
    }),
    users: getUsers_()
      .filter(function (user) {
        return locationAllowed_(activeSession, user.assignedLocationId);
      })
      .map(function (user) {
        return {
          userId: user.userId,
          fullName: user.fullName,
          role: user.role,
          assignedLocationId: user.assignedLocationId,
          googleLinked: user.googleLinked
        };
      })
  };
}

function searchByShelf_(code, session) {
  const activeSession = requireSession_(session);
  const shelf = getScopedShelves_(activeSession).find(function (entry) {
    return normalise_(entry.code) === normalise_(code);
  });
  if (!shelf) {
    return { inventory: [] };
  }

  const location = getLocations_().find(function (entry) {
    return entry.locationId === shelf.locationId;
  });
  const inventory = rowsForSession_(activeSession).filter(function (row) {
    return (
      String(row.inventory.locationId) === String(shelf.locationId) &&
      normalise_(row.inventory.shelfCode || "") === normalise_(shelf.code)
    );
  });

  return { shelf: shelf, location: location, inventory: inventory };
}

function searchBySku_(query, session) {
  const activeSession = requireSession_(session);
  const item = findItemByCode_(query);
  if (!item) {
    return { matches: [], transactions: [] };
  }

  const matches = rowsForSession_(activeSession).filter(function (row) {
    return row.item.itemId === item.itemId;
  });
  const transactions = getTransactions_(activeSession)
    .filter(function (transaction) {
      return transaction.itemId === item.itemId;
    })
    .slice(0, 12);

  return {
    item: item,
    matches: matches,
    transactions: transactions
  };
}

function getInventoryItem_(itemId, session) {
  const activeSession = requireSession_(session);
  const item = getItems_().find(function (entry) {
    return entry.itemId === String(itemId || "");
  });
  if (!item) {
    return { matches: [], transactions: [] };
  }
  return searchBySku_(item.sku, activeSession);
}

function listInventory_(session) {
  return rowsForSession_(requireSession_(session));
}

function getReports_(session) {
  const activeSession = requireSession_(session);
  return {
    inventoryOnHand: rowsForSession_(activeSession),
    damagedItems: scopeRecords_(getDamageLog_(), activeSession, "locationId"),
    repairItems: scopeRecords_(getRepairLog_(), activeSession, "locationId"),
    qualityResults: scopeRecords_(getQualityChecks_(), activeSession, "locationId"),
    userActivity: getTransactions_(activeSession),
    packingOrders: scopeRecords_(getPackingOrders_(), activeSession, "locationId")
  };
}

function getAdminData_(session) {
  const activeSession = requireSession_(session);
  if (activeSession.role === "operator") {
    throw new Error("Admin access is only available to supervisors and admins.");
  }

  return {
    users: getUsers_(),
    roles: getRoles_(),
    locations: getLocations_(),
    shelves: getShelves_(),
    items: getItems_(),
    reasonCodes: getReasonCodes_(),
    qualityTemplates: getQualityTemplates_(),
    settings: getSettings_(),
    auditTrail: getAuditTrail_().slice(-30).reverse(),
    uploadedFiles: getUploadedFiles_().slice(-20).reverse(),
    receipts: getReceipts_().slice(-20).reverse()
  };
}

function getPackedOrders_(session) {
  const activeSession = requireSession_(session);
  const items = getPackingOrderItems_();

  return scopeRecords_(getPackingOrders_(), activeSession, "locationId")
    .sort(function (a, b) {
      return String(b.packedAt).localeCompare(String(a.packedAt));
    })
    .map(function (order) {
      return {
        order: order,
        itemCount: items.filter(function (item) {
          return item.packingOrderId === order.packingOrderId;
        }).length,
        packedByName: order.packedByName
      };
    });
}

function getPackedOrder_(packingOrderId, session) {
  const activeSession = requireSession_(session);
  const order = scopeRecords_(getPackingOrders_(), activeSession, "locationId").find(
    function (entry) {
      return entry.packingOrderId === String(packingOrderId || "");
    }
  );

  if (!order) {
    return null;
  }

  return {
    order: order,
    items: getPackingOrderItems_().filter(function (item) {
      return item.packingOrderId === order.packingOrderId;
    }),
    location: getLocations_().find(function (location) {
      return location.locationId === order.locationId;
    })
  };
}

function getPackedOrderById_(packingOrderId) {
  const order = getPackingOrders_().find(function (entry) {
    return entry.packingOrderId === String(packingOrderId || "");
  });

  if (!order) {
    return null;
  }

  return {
    order: order,
    items: getPackingOrderItems_().filter(function (item) {
      return item.packingOrderId === order.packingOrderId;
    }),
    location: getLocations_().find(function (location) {
      return location.locationId === order.locationId;
    })
  };
}

function receiveStock_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const supplierName = parseText_(data.supplierName, "Supplier Name");
  const poNumber = parseText_(data.poNumber, "PO Number");
  const locationId = resolveLocationId_(session, data.locationId);
  const lines = data.lines || [];

  if (!lines.length) {
    throw new Error("Add at least one receipt line before confirming.");
  }

  const receipt = {
    receiptId: createId_("receipt"),
    poNumber: poNumber,
    supplierName: supplierName,
    poPhotoFileId: data.poPhotoFileId ? String(data.poPhotoFileId) : "",
    locationId: locationId,
    receivedBy: session.userId,
    receivedByName: session.fullName,
    receivedAt: new Date().toISOString(),
    totalLines: lines.length,
    totalQuantity: lines.reduce(function (sum, line) {
      return sum + parsePositiveNumber_(line.quantityReceived, "Quantity received");
    }, 0),
    notes: data.notes ? String(data.notes) : ""
  };
  appendRecord_(CONFIG.SHEETS.RECEIPTS, receipt);

  lines.forEach(function (line) {
    const item = findItemByCode_(line.code);
    if (!item) {
      throw new Error("Item not found for " + line.code + ".");
    }

    const shelf = findShelfByCode_(line.shelfCode, locationId);
    if (!shelf) {
      throw new Error("Shelf " + line.shelfCode + " is not recognised.");
    }

    const inventory = ensureInventoryRecord_(
      item,
      locationId,
      shelf.code,
      line.batchLot,
      line.expiryDate
    );
    const previousValue = cloneObject_(inventory);
    const quantityReceived = parsePositiveNumber_(line.quantityReceived, "Quantity received");
    inventory.quantityOnHand += quantityReceived;
    inventory.quantityPendingInbound = 0;
    inventory.shelfId = shelf.shelfId;
    inventory.shelfCode = shelf.code;
    inventory.batchLot = line.batchLot || inventory.batchLot;
    inventory.expiryDate = line.expiryDate || inventory.expiryDate;
    if (normalise_(line.qualityResult) === "pass") {
      inventory.quantityAvailable += quantityReceived;
    } else if (
      normalise_(line.qualityResult) === "fail" &&
      normalise_(line.disposition) === "damaged-to-repair"
    ) {
      inventory.quantityDamagedToRepair += quantityReceived;
    } else if (
      normalise_(line.qualityResult) === "fail" &&
      normalise_(line.disposition) === "damaged-beyond-repair"
    ) {
      inventory.quantityDamagedBeyondRepair += quantityReceived;
    } else {
      inventory.quantityQuarantined += quantityReceived;
    }
    inventory.lastUpdatedAt = new Date().toISOString();
    saveInventory_(inventory);

    appendRecord_(CONFIG.SHEETS.QUALITY_CHECKS, {
      qualityCheckId: createId_("qc"),
      itemId: item.itemId,
      inventoryId: inventory.inventoryId,
      locationId: locationId,
      shelfCode: shelf.code,
      checklistTemplateId: "receive-quick-check",
      result: normalise_(line.qualityResult),
      defectCategory: line.defectCategory ? String(line.defectCategory) : "",
      disposition:
        normalise_(line.qualityResult) === "fail"
          ? String(line.disposition || "")
          : "",
      notes: line.notes ? String(line.notes) : "",
      checkedBy: session.userId,
      checkedByName: session.fullName,
      checkedAt: new Date().toISOString(),
      photoFileId: ""
    });

    appendRecord_(CONFIG.SHEETS.RECEIPT_ITEMS, {
      receiptItemId: createId_("receipt_item"),
      receiptId: receipt.receiptId,
      itemId: item.itemId,
      sku: item.sku,
      productName: item.itemName,
      quantityReceived: quantityReceived,
      shelfCode: shelf.code,
      qualityResult: String(line.qualityResult || ""),
      disposition:
        normalise_(line.qualityResult) === "fail"
          ? String(line.disposition || "")
          : "",
      defectCategory: line.defectCategory ? String(line.defectCategory) : "",
      batchLot: line.batchLot ? String(line.batchLot) : "",
      expiryDate: line.expiryDate ? String(line.expiryDate) : "",
      notes: line.notes ? String(line.notes) : ""
    });

    const transaction = appendTransaction_({
      item: item,
      session: session,
      quantity: quantityReceived,
      transactionType: "receive",
      locationId: locationId,
      shelfCode: shelf.code,
      notes: line.notes || receipt.notes,
      referenceNumber: poNumber,
      previousValue: previousValue,
      newValue: inventory,
      status: inventory.status
    });

    appendAudit_({
      actionType: "receive",
      session: session,
      locationId: locationId,
      quantity: quantityReceived,
      item: item,
      shelfCode: shelf.code,
      referenceNumber: poNumber,
      notes: line.notes || receipt.notes,
      previousValue: previousValue,
      newValue: inventory
    });
  });

  return receipt;
}

function damageItem_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const locationId = resolveLocationId_(session, data.locationId);
  const item = findItemByCode_(parseText_(data.code, "Item"));
  if (!item) {
    throw new Error("Item not found for the scanned code.");
  }

  const quantity = parsePositiveNumber_(data.quantity, "Quantity");
  const shelfCode = parseText_(data.shelfCode, "Shelf");
  const inventory = findInventoryRecord_(item.itemId, locationId, shelfCode);
  if (!inventory) {
    throw new Error("Shelf does not match the current stock record.");
  }

  requireAvailable_(inventory, quantity, "Quantity cannot exceed available stock.");
  const damageOutcome = parseText_(data.damageOutcome, "Damage outcome");
  const previousValue = cloneObject_(inventory);
  inventory.quantityAvailable -= quantity;
  if (normalise_(damageOutcome) === "to repair") {
    inventory.quantityDamagedToRepair += quantity;
  } else {
    inventory.quantityDamagedBeyondRepair += quantity;
  }
  inventory.lastUpdatedAt = new Date().toISOString();
  saveInventory_(inventory);

  const damage = {
    damageId: createId_("damage"),
    itemId: item.itemId,
    locationId: locationId,
    shelfCode: shelfCode,
    quantity: quantity,
    damageOutcome: normalise_(damageOutcome),
    damageReason: normalise_(damageOutcome),
    notes: data.notes ? String(data.notes) : "",
    createdBy: session.userId,
    createdByName: session.fullName,
    createdAt: new Date().toISOString()
  };
  appendRecord_(CONFIG.SHEETS.DAMAGE_LOG, damage);

  const transaction = appendTransaction_({
    item: item,
    session: session,
    quantity: quantity,
    transactionType: "damage",
    locationId: locationId,
    shelfCode: shelfCode,
    notes: data.notes || "",
    reasonCode: damage.damageOutcome,
    previousValue: previousValue,
    newValue: inventory,
    status: inventory.status
  });

  appendAudit_({
    actionType: "damage",
    session: session,
    locationId: locationId,
    quantity: quantity,
    item: item,
    shelfCode: shelfCode,
    notes: data.notes || "",
    previousValue: previousValue,
    newValue: damage
  });

  return {
    message: "Damage saved and stock reduced.",
    item: item,
    inventory: inventory,
    damage: damage,
    transaction: transaction
  };
}

function moveItem_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const locationId = resolveLocationId_(session, data.locationId);
  const item = findItemByCode_(parseText_(data.code, "Item"));
  if (!item) {
    throw new Error("Item not found for the scanned code.");
  }

  const quantity = parsePositiveNumber_(data.quantity, "Quantity");
  const sourceShelfCode = parseText_(data.shelfCode, "Current shelf");
  const destinationShelfCode = parseText_(data.destinationShelfCode, "Destination shelf");

  if (normalise_(sourceShelfCode) === normalise_(destinationShelfCode)) {
    throw new Error("Source and destination shelf must be different.");
  }

  const destinationShelf = findShelfByCode_(destinationShelfCode, locationId);
  if (!destinationShelf) {
    throw new Error("Destination shelf is not recognised.");
  }

  const sourceInventory = findInventoryRecord_(item.itemId, locationId, sourceShelfCode);
  if (!sourceInventory) {
    throw new Error("Item was not found on the selected source shelf.");
  }

  requireAvailable_(
    sourceInventory,
    quantity,
    "Quantity cannot exceed available stock on the source shelf."
  );

  const sourcePreviousValue = cloneObject_(sourceInventory);
  sourceInventory.quantityAvailable -= quantity;
  sourceInventory.quantityOnHand -= quantity;
  sourceInventory.lastUpdatedAt = new Date().toISOString();
  saveInventory_(sourceInventory);

  const destinationInventory = ensureInventoryRecord_(item, locationId, destinationShelf.code);
  const destinationPreviousValue = cloneObject_(destinationInventory);
  destinationInventory.shelfId = destinationShelf.shelfId;
  destinationInventory.shelfCode = destinationShelf.code;
  destinationInventory.quantityAvailable += quantity;
  destinationInventory.quantityOnHand += quantity;
  destinationInventory.lastUpdatedAt = new Date().toISOString();
  saveInventory_(destinationInventory);

  const note =
    data.notes ||
    "Moved from shelf " + sourceShelfCode + " to shelf " + destinationShelf.code + ".";

  const transaction = appendTransaction_({
    item: item,
    session: session,
    quantity: quantity,
    transactionType: "move",
    locationId: locationId,
    shelfCode: destinationShelf.code,
    notes: note,
    reasonCode: "from:" + sourceShelfCode,
    previousValue: {
      source: sourcePreviousValue,
      destination: destinationPreviousValue
    },
    newValue: {
      source: sourceInventory,
      destination: destinationInventory
    },
    status: destinationInventory.status
  });

  appendAudit_({
    actionType: "move",
    session: session,
    locationId: locationId,
    quantity: quantity,
    item: item,
    shelfCode: destinationShelf.code,
    notes: note,
    previousValue: {
      source: sourcePreviousValue,
      destination: destinationPreviousValue
    },
    newValue: {
      source: sourceInventory,
      destination: destinationInventory
    }
  });

  return {
    message: "Stock moved successfully.",
    item: item,
    inventory: destinationInventory,
    transaction: transaction
  };
}

function repairItem_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const locationId = resolveLocationId_(session, data.locationId);
  const item = findItemByCode_(parseText_(data.code, "Item"));
  if (!item) {
    throw new Error("Item not found for the scanned code.");
  }

  const quantity = parsePositiveNumber_(data.quantity, "Quantity");
  const shelfCode = parseText_(data.shelfCode, "Shelf");
  const inventory = findInventoryRecord_(item.itemId, locationId, shelfCode);
  if (!inventory || !isRepairEligibleInventory_(inventory)) {
    throw new Error("Only damaged items can be repaired.");
  }
  const repairStatus = parseText_(data.repairStatus, "Repair status");
  const previousValue = cloneObject_(inventory);

  if (getDamagedToRepairQuantity_(inventory) < quantity) {
    throw new Error("Quantity cannot exceed damaged stock awaiting repair.");
  }

  if (repairStatus === "returned to stock" || repairStatus === "repaired") {
    inventory.quantityDamagedToRepair -= quantity;
    inventory.quantityAvailable += quantity;
  } else if (repairStatus === "beyond repair") {
    inventory.quantityDamagedToRepair -= quantity;
    inventory.quantityDamagedBeyondRepair += quantity;
  } else {
    throw new Error("Repair status must be Returned to Stock or Beyond Repair.");
  }
  inventory.lastUpdatedAt = new Date().toISOString();
  saveInventory_(inventory);

  const repair = {
    repairId: createId_("repair"),
    itemId: item.itemId,
    locationId: locationId,
    shelfCode: shelfCode,
    quantity: quantity,
    repairReason: "",
    repairStatus: repairStatus,
    assignedTo: "",
    notes: data.notes ? String(data.notes) : "",
    createdBy: session.userId,
    createdByName: session.fullName,
    updatedAt: new Date().toISOString()
  };
  appendRecord_(CONFIG.SHEETS.REPAIR_LOG, repair);

  const transaction = appendTransaction_({
    item: item,
    session: session,
    quantity: quantity,
    transactionType:
      repairStatus === "beyond repair"
        ? "repair beyond repair"
        : "repair returned to stock",
    locationId: locationId,
    shelfCode: shelfCode,
    notes: data.notes || "",
    reasonCode: repair.repairStatus,
    previousValue: previousValue,
    newValue: inventory,
    status: inventory.status
  });

  appendAudit_({
    actionType:
      repairStatus === "beyond repair"
        ? "repair beyond repair"
        : "repair returned to stock",
    session: session,
    locationId: locationId,
    quantity: quantity,
    item: item,
    shelfCode: shelfCode,
    notes: data.notes || "",
    previousValue: previousValue,
    newValue: repair
  });

  return {
    message: "Repair activity saved.",
    item: item,
    inventory: inventory,
    repair: repair,
    transaction: transaction
  };
}

function unpackOrder_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const packingOrderId = parseText_(data.packingOrderId, "Packed order");
  const order = scopeRecords_(getPackingOrders_(), session, "locationId").find(function (entry) {
    return entry.packingOrderId === packingOrderId;
  });
  if (!order) {
    throw new Error("Packed order not found.");
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const unpackRows = rows
    .map(function (row) {
      return {
        packingOrderItemId: String(row.packingOrderItemId || ""),
        itemId: String(row.itemId || ""),
        sku: String(row.sku || ""),
        shelfCode: String(row.shelfCode || ""),
        quantity: parseNumber_(row.quantity, 0)
      };
    })
    .filter(function (row) {
      return (row.packingOrderItemId || row.itemId || row.sku) && row.shelfCode && row.quantity > 0;
    });
  if (!unpackRows.length) {
    throw new Error("Enter a quantity to unpack for at least one item.");
  }

  const orderItems = getPackingOrderItems_().filter(function (row) {
    return row.packingOrderId === order.packingOrderId;
  });
  const returnDisposition = parseText_(data.returnDisposition, "Return disposition");
  const unpackReason = parseText_(data.unpackReason, "Unpack reason");
  const unpacks = [];
  let lastItem = null;
  let lastInventory = null;
  let lastTransaction = null;

  unpackRows.forEach(function (row) {
    const orderItem = orderItems.find(function (entry) {
      return (
        entry.packingOrderItemId === row.packingOrderItemId ||
        (
          row.itemId &&
          String(entry.itemId || "") === String(row.itemId || "") &&
          String(entry.shelfCode || "") === String(row.shelfCode || "")
        ) ||
        (
          row.sku &&
          normalise_(entry.sku) === normalise_(row.sku) &&
          String(entry.shelfCode || "") === String(row.shelfCode || "")
        )
      );
    });
    if (!orderItem) {
      throw new Error("Packed order line not found.");
    }

    const remainingQuantity =
      parseNumber_(orderItem.quantity, 0) - parseNumber_(orderItem.unpackedQuantity, 0);
    if (row.quantity > remainingQuantity) {
      throw new Error("Quantity cannot exceed remaining packed stock for " + orderItem.sku + ".");
    }

    const item = getItems_().find(function (entry) {
      return entry.itemId === orderItem.itemId;
    });
    if (!item) {
      throw new Error("Item not found for " + orderItem.sku + ".");
    }

    const inventory = findInventoryRecord_(orderItem.itemId, order.locationId, orderItem.shelfCode);
    if (!inventory) {
      throw new Error("Shelf " + orderItem.shelfCode + " does not match the packed stock record.");
    }
    if (inventory.quantityPacked < row.quantity) {
      throw new Error("Quantity cannot exceed packed stock for " + orderItem.sku + ".");
    }

    const previousValue = cloneObject_(inventory);
    inventory.quantityPacked -= row.quantity;
    if (returnDisposition === "quarantine") {
      inventory.quantityQuarantined += row.quantity;
      inventory.status = "quarantined";
    } else {
      inventory.quantityAvailable += row.quantity;
      inventory.status = "unpacked";
    }
    inventory.lastUpdatedAt = new Date().toISOString();
    saveInventory_(inventory);

    orderItem.unpackedQuantity = parseNumber_(orderItem.unpackedQuantity, 0) + row.quantity;
    updateRecord_(
      CONFIG.SHEETS.PACKING_ORDER_ITEMS,
      "packingOrderItemId",
      orderItem.packingOrderItemId,
      orderItem
    );

    const unpack = {
      unpackId: createId_("unpack"),
      itemId: item.itemId,
      packingOrderId: order.packingOrderId,
      packingOrderItemId: orderItem.packingOrderItemId,
      orderNumber: order.orderNumber,
      locationId: order.locationId,
      shelfCode: orderItem.shelfCode,
      quantity: row.quantity,
      unpackReason: unpackReason,
      returnDisposition: returnDisposition,
      notes: data.notes ? String(data.notes) : "",
      unpackedBy: session.userId,
      unpackedByName: session.fullName,
      unpackedAt: new Date().toISOString()
    };
    appendRecord_(CONFIG.SHEETS.UNPACK_LOG, unpack);

    const transaction = appendTransaction_({
      item: item,
      session: session,
      quantity: row.quantity,
      transactionType: "unpack",
      locationId: order.locationId,
      shelfCode: orderItem.shelfCode,
      notes: data.notes || "",
      reasonCode: unpack.unpackReason,
      referenceNumber: order.orderNumber,
      previousValue: previousValue,
      newValue: inventory,
      status: inventory.status
    });

    appendAudit_({
      actionType: "unpack",
      session: session,
      locationId: order.locationId,
      quantity: row.quantity,
      item: item,
      shelfCode: orderItem.shelfCode,
      referenceNumber: order.orderNumber,
      notes: data.notes || "",
      previousValue: previousValue,
      newValue: unpack
    });

    unpacks.push(unpack);
    lastItem = item;
    lastInventory = inventory;
    lastTransaction = transaction;
  });

  syncPackingOrder_(order, orderItems);

  return {
    message: "Unpack saved.",
    item: lastItem,
    inventory: lastInventory,
    unpack: unpacks.length ? unpacks[0] : null,
    unpacks: unpacks,
    packingOrder: order,
    transaction: lastTransaction
  };
}

function nextOrderNumber_() {
  return (
    "ORD-" +
    new Date().getFullYear() +
    "-" +
    String(getPackingOrders_().length + 1).padStart(4, "0")
  );
}

function packOrder_(payload) {
  const data = unwrapPayload_(payload);
  const session = requireSession_(payload.session || data.session);
  const locationId = resolveLocationId_(session, data.locationId);
  const rows = data.rows || [];

  if (!rows.length) {
    throw new Error("Add at least one packing line.");
  }

  const orderNumber = nextOrderNumber_();
  const packingOrderId = createId_("packing_order");
  const lineItems = [];

  rows.forEach(function (row) {
    const item = findItemByCode_(row.code);
    if (!item) {
      throw new Error("Item not found for " + row.code + ".");
    }

    const shelf = findShelfByCode_(row.shelfCode, locationId);
    if (!shelf) {
      throw new Error("Shelf " + row.shelfCode + " is not recognised.");
    }

    const inventory = findInventoryRecord_(item.itemId, locationId, shelf.code);
    if (!inventory) {
      throw new Error("Stock for " + item.sku + " was not found on shelf " + shelf.code + ".");
    }

    if (isBlockedForPacking_(inventory)) {
      throw new Error(item.itemName + " cannot be packed from its current status.");
    }

    const quantity = parsePositiveNumber_(row.quantity, "Quantity");
    requireAvailable_(inventory, quantity, "Quantity for " + item.sku + " exceeds available stock.");

    const previousValue = cloneObject_(inventory);
    inventory.quantityAvailable -= quantity;
    inventory.quantityPacked += quantity;
    inventory.lastUpdatedAt = new Date().toISOString();
    saveInventory_(inventory);

    const orderItem = {
      packingOrderItemId: createId_("packing_item"),
      packingOrderId: packingOrderId,
      itemId: item.itemId,
      sku: item.sku,
      upc: item.upc,
      productName: item.itemName,
      shelfCode: shelf.code,
      quantity: quantity,
      unpackedQuantity: 0
    };
    lineItems.push(orderItem);
    appendRecord_(CONFIG.SHEETS.PACKING_ORDER_ITEMS, orderItem);

    appendTransaction_({
      item: item,
      session: session,
      quantity: quantity,
      transactionType: "pack",
      locationId: locationId,
      shelfCode: shelf.code,
      notes: data.notes || "",
      referenceNumber: orderNumber,
      previousValue: previousValue,
      newValue: inventory,
      status: inventory.status
    });

    appendAudit_({
      actionType: "pack",
      session: session,
      locationId: locationId,
      quantity: quantity,
      item: item,
      shelfCode: shelf.code,
      referenceNumber: orderNumber,
      notes: data.notes || "",
      previousValue: previousValue,
      newValue: inventory
    });
  });

  const order = {
    packingOrderId: packingOrderId,
    orderNumber: orderNumber,
    locationId: locationId,
    packedBy: session.userId,
    packedByName: session.fullName,
    packedAt: new Date().toISOString(),
    status: "packed",
    notes: data.notes ? String(data.notes) : "",
    totalLines: lineItems.length,
    totalQuantity: lineItems.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0),
    unpackedQuantity: 0,
    pdfFileId: "",
    updatedAt: new Date().toISOString()
  };
  appendRecord_(CONFIG.SHEETS.PACKING_ORDERS, order);

  return {
    order: order,
    items: lineItems
  };
}

function uploadFile_(payload) {
  const session = requireSession_(payload.session);
  const fileName = parseText_(payload.fileName, "File name");
  const fileType = payload.fileType ? String(payload.fileType) : "application/octet-stream";
  const bytes = Utilities.base64Decode(parseText_(payload.base64, "File data"));
  const blob = Utilities.newBlob(bytes, fileType, fileName);
  const fileId = createId_("file");
  let driveFileId = "";
  let storageMode = "metadata-only";

  if (CONFIG.UPLOADS_FOLDER_ID) {
    try {
      const folder = DriveApp.getFolderById(CONFIG.UPLOADS_FOLDER_ID);
      const driveFile = folder.createFile(blob);
      driveFileId = driveFile.getId();
      storageMode = "google-drive";
    } catch (error) {
      throw new Error(
        "Drive upload is not authorised yet. Open the Apps Script project, add Drive access scopes, reauthorise, and redeploy the web app."
      );
    }
  }

  const record = {
    fileId: fileId,
    fileName: fileName,
    fileType: fileType,
    storageMode: storageMode,
    localPath: "",
    driveFileId: driveFileId,
    referenceType: payload.referenceType ? String(payload.referenceType) : "",
    referenceId: payload.referenceId ? String(payload.referenceId) : "",
    uploadedBy: session.userId,
    uploadedAt: new Date().toISOString()
  };
  appendRecord_(CONFIG.SHEETS.UPLOADED_FILES, record);
  return record;
}

function importInventory_(payload) {
  const session = requireSession_(payload.session);
  const fileName = parseText_(payload.fileName, "File name");
  if (!/\.csv$/i.test(fileName)) {
    throw new Error(
      "Apps Script import currently supports CSV input. Use the Next.js admin import utility for XLSX files, or save the workbook as CSV first."
    );
  }

  const csvText = Utilities.newBlob(
    Utilities.base64Decode(parseText_(payload.base64, "File data"))
  ).getDataAsString();
  const rows = Utilities.parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error("The inventory file did not contain any data rows.");
  }

  const headerIndex = buildHeaderIndex_(rows[0]);
  const grouped = {};
  let rowsAccepted = 0;

  rows.slice(1).forEach(function (row) {
    const shelfCode = String(row[headerIndex.shelf] || "").trim();
    const sku = String(row[headerIndex.sku] || "").trim();
    const productName = String(row[headerIndex.productName] || "").trim();
    const locationName = String(row[headerIndex.location] || "").trim();
    const units = Number(row[headerIndex.units] || 0);

    if (!shelfCode || !sku || !productName || !isFinite(units) || units <= 0) {
      return;
    }

    rowsAccepted += 1;
    const key = [locationName || "Bengaluru Main Hub", shelfCode, sku].join("::");
    if (!grouped[key]) {
      grouped[key] = {
        shelfCode: shelfCode,
        sku: sku,
        productName: productName,
        locationName: locationName || "Bengaluru Main Hub",
        units: 0
      };
    }
    grouped[key].units += units;
  });

  const locations = getLocations_();
  const shelves = getShelves_();
  const items = getItems_();
  let createdLines = 0;
  let updatedLines = 0;

  Object.keys(grouped).forEach(function (key) {
    const entry = grouped[key];
    let location = locations.find(function (candidate) {
      return normalise_(candidate.name) === normalise_(entry.locationName);
    });
    if (!location) {
      location = {
        locationId: createId_("loc"),
        code: String(entry.locationName).replace(/[^A-Z0-9]+/gi, "-").toUpperCase(),
        name: entry.locationName,
        address: "",
        timezone: "Asia/Kolkata",
        status: "active"
      };
      appendRecord_(CONFIG.SHEETS.LOCATIONS, location);
      locations.push(location);
    }

    let shelf = shelves.find(function (candidate) {
      return (
        candidate.locationId === location.locationId &&
        normalise_(candidate.code) === normalise_(entry.shelfCode)
      );
    });
    if (!shelf) {
      shelf = {
        shelfId: createId_("shelf"),
        locationId: location.locationId,
        warehouse: location.name,
        zone: entry.shelfCode.charAt(0) || "A",
        aisle: entry.shelfCode.replace(/[^0-9]/g, "") || "1",
        rack: entry.shelfCode.charAt(0) || "A",
        shelf: entry.shelfCode,
        code: entry.shelfCode,
        capacityUnits: 500,
        status: "active"
      };
      appendRecord_(CONFIG.SHEETS.SHELVES, shelf);
      shelves.push(shelf);
    }

    let item = items.find(function (candidate) {
      return normalise_(candidate.sku) === normalise_(entry.sku);
    });
    if (!item) {
      item = {
        itemId: createId_("item"),
        sku: entry.sku,
        upc: "",
        qrCode: "",
        itemName: entry.productName,
        description: "",
        category: "Medical textile",
        unitOfMeasure: "Units",
        packSize: "Single",
        imageUrl: "",
        reorderThreshold: 20,
        status: "active",
        supplier: "RZ-Circular",
        batchLot: "",
        expiryDate: "",
        requiresQualityCheck: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      appendRecord_(CONFIG.SHEETS.PRODUCT_MASTER, item);
      items.push(item);
    }

    const inventory = findInventoryRecord_(item.itemId, location.locationId, shelf.code);
    if (inventory) {
      inventory.quantityOnHand = entry.units;
      inventory.quantityAvailable = entry.units;
      inventory.shelfId = shelf.shelfId;
      inventory.shelfCode = shelf.code;
      inventory.status = "stored";
      inventory.lastUpdatedAt = new Date().toISOString();
      saveInventory_(inventory);
      updatedLines += 1;
    } else {
      appendRecord_(CONFIG.SHEETS.INVENTORY, {
        inventoryId: createId_("inv"),
        itemId: item.itemId,
        locationId: location.locationId,
        shelfId: shelf.shelfId,
        shelfCode: shelf.code,
        quantityOnHand: entry.units,
        quantityAvailable: entry.units,
        quantityDamaged: 0,
        quantityDamagedToRepair: 0,
        quantityDamagedBeyondRepair: 0,
        quantityUnderRepair: 0,
        quantityPacked: 0,
        quantityPendingInbound: 0,
        quantityQuarantined: 0,
        reorderThreshold: item.reorderThreshold,
        supplier: item.supplier,
        batchLot: "",
        expiryDate: "",
        status: "stored",
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      });
      createdLines += 1;
    }
  });

  appendAudit_({
    actionType: "stock import",
    session: session,
    locationId: session.assignedLocationId,
    notes: "Imported " + rowsAccepted + " rows from " + fileName + ".",
    newValue: {
      rowsAccepted: rowsAccepted,
      linesCreated: createdLines,
      linesUpdated: updatedLines
    }
  });

  return {
    rowsAccepted: rowsAccepted,
    linesCreated: createdLines,
    linesUpdated: updatedLines
  };
}

function buildHeaderIndex_(headers) {
  const map = {};
  headers.forEach(function (header, index) {
    map[normaliseHeader_(header)] = index;
  });

  const shelf = map.shelf !== undefined ? map.shelf : map.shelves;
  const sku = map.sku;
  const productName =
    map.productname !== undefined
      ? map.productname
      : map.product;
  const units = map.units !== undefined ? map.units : map.quantity;
  const location =
    map.location !== undefined
      ? map.location
      : map.sitename;

  if (
    shelf === undefined ||
    sku === undefined ||
    productName === undefined ||
    units === undefined
  ) {
    throw new Error(
      "CSV headers must include Shelf, SKU, Product Name, and Units."
    );
  }

  return {
    shelf: shelf,
    sku: sku,
    productName: productName,
    units: units,
    location: location !== undefined ? location : -1
  };
}

function normaliseHeader_(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getPackingSlipPdf_(payload) {
  const session = payload.session ? requireSession_(payload.session) : null;
  const detail = session
    ? getPackedOrder_(payload.packingOrderId, session)
    : getPackedOrderById_(payload.packingOrderId);

  if (!detail) {
    throw new Error("Pack order not found.");
  }

  const existingOrder = detail.order;
  const doc = DocumentApp.create(existingOrder.orderNumber + " Packing Slip");

  try {
    const body = doc.getBody();
    body.appendParagraph("IQMS").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("by CIRCAI LTD");
    body.appendParagraph("for RZ-Circular");
    body.appendParagraph("");
    body.appendParagraph("Packing Slip").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph("Order Number: " + existingOrder.orderNumber);
    body.appendParagraph("Packed by: " + existingOrder.packedByName);
    body.appendParagraph(
      "Location: " + (detail.location ? detail.location.name : existingOrder.locationId)
    );
    body.appendParagraph("Date/Time: " + existingOrder.packedAt);
    body.appendParagraph("");

    const tableRows = [["Shelf", "Product Name", "SKU", "UPC", "Quantity"]];
    detail.items.forEach(function (item) {
      tableRows.push([
        item.shelfCode,
        item.productName,
        item.sku,
        item.upc,
        String(item.quantity)
      ]);
    });
    body.appendTable(tableRows);
    body.appendParagraph("");
    body.appendParagraph("Total lines: " + existingOrder.totalLines);
    body.appendParagraph("Total quantity: " + existingOrder.totalQuantity);
    doc.saveAndClose();

    const exportUrl =
      "https://docs.google.com/document/d/" +
      doc.getId() +
      "/export?format=pdf";
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken()
      }
    });
    const pdfBlob = response
      .getBlob()
      .setName(existingOrder.orderNumber + "-packing-slip.pdf");

    return {
      base64: Utilities.base64Encode(pdfBlob.getBytes()),
      fileName: pdfBlob.getName()
    };
  } finally {
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (_error) {}
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

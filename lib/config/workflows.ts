import type { WorkflowType } from "@/lib/data/types";

export interface WorkflowField {
  name: string;
  label: string;
  type:
    | "scan"
    | "number"
    | "text"
    | "textarea"
    | "date"
    | "select"
    | "toggle";
  placeholder?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
  optionsSource?: "locations" | "reasonCodes" | "qualityTemplates" | "users";
}

export interface WorkflowDefinition {
  key: WorkflowType;
  title: string;
  description: string;
  badge: string;
  rules: string[];
  fields: WorkflowField[];
}

export const workflowDefinitions: Record<WorkflowType, WorkflowDefinition> = {
  receive: {
    key: "receive",
    title: "Receive",
    description: "Use the dedicated PO-first receipt flow for grouped receiving.",
    badge: "Dock intake",
    rules: [
      "Open the dedicated receipt screen to capture Supplier Name, PO Number, and multiple receipt lines.",
      "PO photos can be uploaded and linked to the grouped receipt.",
      "Received stock is grouped by PO and queued for quality or putaway."
    ],
    fields: []
  },
  inbound: {
    key: "inbound",
    title: "Inbound Putaway",
    description: "Move received goods from pending inbound into their assigned shelf.",
    badge: "Shelf move",
    rules: [
      "Stock cannot be put away when pending inbound quantity is zero.",
      "Only valid shelves in the selected location can be used.",
      "Fast mobile flow: scan item, scan shelf, enter quantity, confirm."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan item", type: "scan", placeholder: "Scan item to put away" },
      { name: "shelfCode", label: "Shelf", type: "text", placeholder: "Scan or enter shelf" },
      { name: "quantity", label: "Quantity moved", type: "number", placeholder: "0" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Putaway notes" }
    ]
  },
  "quality-check": {
    key: "quality-check",
    title: "Quality Check",
    description: "Run configurable inspection templates with pass, fail, or hold outcomes.",
    badge: "QC gate",
    rules: [
      "Failed or held items move into quarantine so operators cannot pack them by mistake.",
      "Defect notes and category capture support traceability for supervisors.",
      "Templates can be tuned by item category in Settings."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan item", type: "scan", placeholder: "Scan item to inspect" },
      { name: "shelfCode", label: "Shelf", type: "text", placeholder: "Optional shelf" },
      { name: "checklistTemplateId", label: "Checklist template", type: "select", optionsSource: "qualityTemplates" },
      {
        name: "result",
        label: "Inspection result",
        type: "select",
        options: [
          { label: "Pass", value: "pass" },
          { label: "Fail", value: "fail" },
          { label: "Hold", value: "hold" }
        ]
      },
      {
        name: "defectCategory",
        label: "Defect category",
        type: "select",
        options: [
          { label: "Packaging condition", value: "packaging condition" },
          { label: "Labelling present", value: "labelling present" },
          { label: "Stitching quality", value: "stitching quality" },
          { label: "Contamination visible", value: "contamination visible" },
          { label: "RFID/tag present", value: "rfid/tag present" },
          { label: "Correct item / SKU", value: "correct item / sku" },
          { label: "Quantity match", value: "quantity match" },
          { label: "Clean / acceptable condition", value: "clean / acceptable condition" }
        ]
      },
      {
        name: "disposition",
        label: "If failed / held",
        type: "select",
        options: [
          { label: "Quarantine", value: "quarantine" },
          { label: "Damaged", value: "damaged" },
          { label: "Repair", value: "repair" }
        ]
      },
      { name: "reasonCode", label: "Reason code", type: "select", optionsSource: "reasonCodes" },
      { name: "notes", label: "Inspector notes", type: "textarea", placeholder: "Capture defect notes or release detail" }
    ]
  },
  "cycle-count": {
    key: "cycle-count",
    title: "Cycle Count",
    description: "Run blind or guided counts and push large variances to supervisor approval.",
    badge: "Stock verify",
    rules: [
      "Variance beyond the configured threshold requires supervisor approval.",
      "Blind count mode hides the expected quantity from the operator.",
      "Every count creates an auditable discrepancy record."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan item or shelf", type: "scan", placeholder: "Scan item or shelf" },
      { name: "countedQuantity", label: "Counted quantity", type: "number", placeholder: "0" },
      { name: "reasonCode", label: "Discrepancy reason", type: "select", optionsSource: "reasonCodes" },
      { name: "notes", label: "Count notes", type: "textarea", placeholder: "Shelf mismatch or recount reason" }
    ]
  },
  "damage-item": {
    key: "damage-item",
    title: "Damage Item",
    description: "Capture damage reasons and stock reduction without losing traceability.",
    badge: "Exception flow",
    rules: [
      "Damaged stock moves out of available inventory immediately.",
      "Critical issues can be flagged for supervisor review.",
      "Reason capture is required for sensitive stock changes."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan item", type: "scan", placeholder: "Scan item to mark damaged" },
      { name: "quantity", label: "Damaged quantity", type: "number", placeholder: "0" },
      {
        name: "damageType",
        label: "Damage type",
        type: "select",
        options: [
          { label: "Torn packaging", value: "torn packaging" },
          { label: "Contamination", value: "contamination" },
          { label: "Stitching issue", value: "stitching issue" },
          { label: "Fabric damage", value: "fabric damage" },
          { label: "Label issue", value: "label issue" },
          { label: "Transport damage", value: "transport damage" },
          { label: "Shelf damage", value: "shelf damage" },
          { label: "Unknown", value: "unknown" }
        ]
      },
      { name: "shelfCode", label: "Shelf", type: "text", placeholder: "Scan or enter shelf" },
      { name: "reasonCode", label: "Reason code", type: "select", optionsSource: "reasonCodes" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Add context for review and audit" }
    ]
  },
  "repair-item": {
    key: "repair-item",
    title: "Repair Item",
    description: "Send stock to repair, monitor status, and return units safely to available stock.",
    badge: "Repair loop",
    rules: [
      "Items under repair are blocked from packing and shelf moves.",
      "Returned units are only re-enabled when repair completes.",
      "Technician ownership improves follow-up for SME teams."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan item", type: "scan", placeholder: "Scan item for repair flow" },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { name: "shelfCode", label: "Shelf", type: "text", placeholder: "Shelf if relevant" },
      { name: "repairReason", label: "Repair reason", type: "text", placeholder: "Stitching issue / relabelling / rework" },
      {
        name: "repairStatus",
        label: "Repair status",
        type: "select",
        options: [
          { label: "Pending repair", value: "pending repair" },
          { label: "In repair", value: "in repair" },
          { label: "Repaired", value: "repaired" },
          { label: "Beyond repair", value: "beyond repair" },
          { label: "Returned to stock", value: "returned to stock" },
        ]
      },
      { name: "assignedTo", label: "Assigned to", type: "text", placeholder: "Assigned person" },
      { name: "reasonCode", label: "Reason code", type: "select", optionsSource: "reasonCodes" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Repair notes or observations" }
    ]
  },
  packing: {
    key: "packing",
    title: "Pack Order",
    description: "Use the dedicated pack-order flow for simple mobile line entry and PDF slip creation.",
    badge: "Dispatch prep",
    rules: [
      "Open the dedicated Packing screen to add lines with Scan Item, Scan Shelf, Quantity, and Pack Order.",
      "Confirmed packing reduces stock immediately and assigns an order number.",
      "A printable packing slip PDF is generated after confirmation."
    ],
    fields: []
  },
  unpack: {
    key: "unpack",
    title: "Unpack",
    description: "Reverse a packed item safely back to stock or quarantine with a reason trail.",
    badge: "Reverse flow",
    rules: [
      "Packed quantity must exist before stock can be unpacked.",
      "Quality or return issues can route items directly to quarantine.",
      "Every reverse movement is written to the audit trail."
    ],
    fields: [
      { name: "locationId", label: "Location", type: "select", optionsSource: "locations" },
      { name: "code", label: "Scan packed item / order", type: "scan", placeholder: "Scan packed item" },
      { name: "shelfCode", label: "Shelf", type: "text", placeholder: "Scan or enter shelf" },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      {
        name: "unpackReason",
        label: "Unpack reason",
        type: "select",
        options: [
          { label: "Packing error", value: "packing error" },
          { label: "Customer return", value: "customer return" },
          { label: "Damaged after pack", value: "damaged after pack" },
          { label: "Relabelling required", value: "relabelling required" },
          { label: "Quality issue", value: "quality issue" }
        ]
      },
      {
        name: "returnDisposition",
        label: "Return disposition",
        type: "select",
        options: [
          { label: "Return to stock", value: "return-to-stock" },
          { label: "Quarantine", value: "quarantine" }
        ]
      },
      { name: "reasonCode", label: "Reason code", type: "select", optionsSource: "reasonCodes" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Reason for reverse movement" }
    ]
  }
};

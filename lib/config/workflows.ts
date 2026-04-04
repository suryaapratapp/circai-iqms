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

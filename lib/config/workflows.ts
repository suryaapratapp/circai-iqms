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
    description: "Use the dedicated PO-first receipt flow for grouped receiving with quick quality decisions.",
    badge: "Dock intake",
    rules: [
      "Open the dedicated receipt screen to capture Supplier Name, PO Number, and multiple receipt lines.",
      "PO photos can be uploaded and linked to the grouped receipt.",
      "Received stock is placed directly onto the selected shelf with a pass, fail, or hold result."
    ],
    fields: []
  },
  move: {
    key: "move",
    title: "Move",
    description: "Move available stock from one shelf to another without losing shelf-level traceability.",
    badge: "Shelf move",
    rules: [
      "Only available stock can be moved.",
      "Source and destination shelves must be different.",
      "The movement updates both shelf records and keeps the audit trail."
    ],
    fields: []
  },
  "damage-item": {
    key: "damage-item",
    title: "Damage Item",
    description: "Use the dedicated damage flow to move stock into repair-eligible or beyond-repair damage.",
    badge: "Damage control",
    rules: [
      "Open the dedicated damage screen to choose a damage outcome and reduce available shelf stock.",
      "To Repair keeps the stock eligible for the repair workflow.",
      "Beyond Repair keeps the stock out of normal availability."
    ],
    fields: []
  },
  "repair-item": {
    key: "repair-item",
    title: "Repair Item",
    description: "Use the dedicated repair flow for damaged stock only.",
    badge: "Repair loop",
    rules: [
      "Only damaged stock marked To Repair can be processed here.",
      "Returned to Stock restores the quantity to available stock on the same shelf.",
      "Beyond Repair moves the quantity into beyond-repair damage on that shelf."
    ],
    fields: []
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

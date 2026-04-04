export const SHOW_DEVELOPER_BRANDING = false;

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "IQMS",
  fullName: "Inventory and Quality Management System",
  brandLine: "by CIRCAI LTD",
  customerContext: "for RZ-Circular",
  dataSource: process.env.DATA_SOURCE || "local",
  lowStockDefault: 20,
  cycleCountVarianceThreshold: 5,
  supportedRoles: ["admin", "supervisor", "operator"] as const,
  transactionTypes: [
    "receive",
    "shelf move",
    "damage",
    "repair intake",
    "repair complete",
    "pack",
    "unpack",
    "quality pass",
    "quality fail",
    "manual adjustment"
  ] as const
};

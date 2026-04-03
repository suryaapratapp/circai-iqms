export interface StockImportRow {
  location: string;
  shelf: string;
  sku: string;
  productName: string;
  quantity: number;
  supplier: string;
  category: string;
}

export const rzCircularSampleStock: StockImportRow[] = [
  { location: "Bengaluru Main Hub", shelf: "A1", sku: "RZ-MASK-001", productName: "Reusable Theatre Mask", quantity: 140, supplier: "RZ-Circular Textiles", category: "Masks" },
  { location: "Bengaluru Main Hub", shelf: "A1", sku: "RZ-MASK-001", productName: "Reusable Theatre Mask", quantity: 60, supplier: "RZ-Circular Textiles", category: "Masks" },
  { location: "Bengaluru Main Hub", shelf: "A3", sku: "RZ-GOWN-010", productName: "Isolation Gown", quantity: 96, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Bengaluru Main Hub", shelf: "A5", sku: "RZ-GOWN-011", productName: "Reinforced Surgical Gown", quantity: 72, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Bengaluru Main Hub", shelf: "B1", sku: "RZ-GOWN-020", productName: "Warm-up Jacket", quantity: 48, supplier: "North Medical Uniforms", category: "Outerwear" },
  { location: "Bengaluru Main Hub", shelf: "B2", sku: "RZ-PACK-100", productName: "Sterile Packaging Tie", quantity: 520, supplier: "BlueShield Packaging", category: "Packaging" },
  { location: "Bengaluru Main Hub", shelf: "B3", sku: "RZ-PACK-101", productName: "Gown Packaging Sleeve", quantity: 380, supplier: "BlueShield Packaging", category: "Packaging" },
  { location: "Bengaluru Main Hub", shelf: "B4", sku: "RZ-DRAPE-030", productName: "Procedure Drape", quantity: 110, supplier: "CareFabric Supplies", category: "Drapes" },
  { location: "Bengaluru Main Hub", shelf: "C1", sku: "RZ-WRAP-040", productName: "Textile Sterile Wrap", quantity: 84, supplier: "CareFabric Supplies", category: "Wraps" },
  { location: "Bengaluru Main Hub", shelf: "C2", sku: "RZ-RFID-050", productName: "RFID Theatre Gown", quantity: 64, supplier: "TraceWear Medical", category: "RFID Garments" },
  { location: "Bengaluru Main Hub", shelf: "C3", sku: "RZ-ACC-060", productName: "Medical Textile Accessory Kit", quantity: 150, supplier: "TraceWear Medical", category: "Accessories" },
  { location: "Bengaluru Main Hub", shelf: "C4", sku: "RZ-GOWN-012", productName: "Standard Surgical Gown", quantity: 128, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Bengaluru Main Hub", shelf: "D1", sku: "RZ-GOWN-013", productName: "Fluid-resistant Gown", quantity: 92, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Bengaluru Main Hub", shelf: "D2", sku: "RZ-MASK-002", productName: "Reusable Barrier Mask", quantity: 180, supplier: "RZ-Circular Textiles", category: "Masks" },
  { location: "Bengaluru Main Hub", shelf: "D3", sku: "RZ-LABEL-070", productName: "RFID Label Pack", quantity: 260, supplier: "TraceWear Medical", category: "Accessories" },
  { location: "Bengaluru Main Hub", shelf: "D4", sku: "RZ-PACK-102", productName: "Sealed Dispatch Pouch", quantity: 210, supplier: "BlueShield Packaging", category: "Packaging" },
  { location: "Pune Repair & QA Hub", shelf: "R1", sku: "RZ-GOWN-011", productName: "Reinforced Surgical Gown", quantity: 14, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Pune Repair & QA Hub", shelf: "R2", sku: "RZ-RFID-050", productName: "RFID Theatre Gown", quantity: 10, supplier: "TraceWear Medical", category: "RFID Garments" },
  { location: "Hyderabad Dispatch Center", shelf: "P1", sku: "RZ-GOWN-012", productName: "Standard Surgical Gown", quantity: 34, supplier: "RZ-Circular Textiles", category: "Gowns" },
  { location: "Hyderabad Dispatch Center", shelf: "P2", sku: "RZ-DRAPE-030", productName: "Procedure Drape", quantity: 28, supplier: "CareFabric Supplies", category: "Drapes" },
  { location: "Hyderabad Dispatch Center", shelf: "P3", sku: "RZ-WRAP-040", productName: "Textile Sterile Wrap", quantity: 22, supplier: "CareFabric Supplies", category: "Wraps" },
  { location: "Hyderabad Dispatch Center", shelf: "P4", sku: "RZ-PACK-100", productName: "Sterile Packaging Tie", quantity: 70, supplier: "BlueShield Packaging", category: "Packaging" }
];

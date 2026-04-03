# IQMS

IQMS for RZ-Circular.

This is a mobile-first warehouse and quality web app for medical textiles and related equipment operations. It is designed for practical floor use with large tap targets, scan-first workflows, grouped receiving, simple packing, and traceable stock control.

## What is included

- Professional blue-toned mobile-first UI
- British English terminology throughout the visible product
- Standard sign-in plus Google Sign-In / account linking hooks
- Simplified dashboard with welcome, current location, quick actions, recent activity, and last action
- Receive flow redesigned around Supplier Name, PO Number, optional PO photo, and grouped receipt lines
- Inbound, Search by Shelf, Search by SKU / UPC, Quality Check, Cycle Count, Damage Item, Repair Item, Pack Order, Unpack, Inventory, Transaction History, Reports, Settings / Admin, and Profile screens
- Mobile scan modal with rear-camera preference and manual entry fallback
- Pack Order flow with confirmation and generated PDF packing slip
- Damage flow that reduces available stock immediately
- Local file upload support for PO photos in the demo build
- RZ-Circular-flavoured medical textile seed data and stock import utility
- Google Sheets / Apps Script schema and backend scaffold for later migration

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Mobile barcode scanning with `@zxing/browser`
- Sonner toasts
- PDF generation with `pdf-lib`
- Workbook import with `xlsx`
- Google ID token verification with `jose`

## Demo credentials

- Admin: `admin@rz-circular.com` / `Admin@123`
- Supervisor: `supervisor@rz-circular.com` / `Supervisor@123`
- Operator: `operator@rz-circular.com` / `Operator@123`

Passwords are hashed with the app's scrypt-based password helper before they are stored in seed data or Google Sheets initialisation.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mobile scanning notes

- Camera scanning uses `@zxing/browser` rather than the browser's native `BarcodeDetector`, because iPhone browsers do not expose that API reliably.
- Use the app over HTTPS or `localhost`, otherwise mobile browsers will block camera access.
- The scanner asks for a user gesture before opening the camera and always keeps manual entry available as a fallback.
- If the camera is already in use by another tab or app, close it there first and reopen the scanner.

## Environment

The local demo works with only `AUTH_SECRET` set, but these variables are included for Google-enabled deployments:

- `AUTH_SECRET`
- `DATA_SOURCE`
- `GOOGLE_APPS_SCRIPT_URL`
- `GOOGLE_APPS_SCRIPT_TOKEN`
- `GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Current data architecture

The frontend does not talk directly to Google Sheets columns. Data access is abstracted behind typed entities and repository/services:

- [lib/data/types.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/lib/data/types.ts): shared entities
- [lib/data/adapters/local.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/lib/data/adapters/local.ts): demo repository with core workflow logic
- [lib/data/operations.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/lib/data/operations.ts): receipt, import, upload, packing, and PDF operations
- [lib/data/adapters/apps-script.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/lib/data/adapters/apps-script.ts): Apps Script adapter boundary
- [backend/google-apps-script](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/README.md): Google Sheets backend deliverables

This keeps the app ready to move from local JSON or Google Sheets to a proper database later.

## RZ-Circular stock data

I could not find an uploaded stock spreadsheet in the workspace, so the app currently seeds itself with realistic RZ-Circular-style medical textile stock:

- reusable masks
- isolation gowns
- reinforced surgical gowns
- warm-up jackets
- sterile packaging ties
- gown packaging sleeves
- procedure drapes
- sterile wraps
- RFID theatre gowns
- medical textile accessory kits

An admin stock import utility is included. It supports CSV/XLSX uploads, normalises common headers, maps Shelf / SKU / Product Name / Units, and aggregates duplicate SKU rows on the same shelf consistently.

## Key business rules implemented

- Packing reduces available stock immediately after confirmation
- Damage reduces available stock and moves quantity into damaged stock
- Repair intake moves stock out of available quantity, and returned stock moves back correctly
- Failed or held quality checks can route stock to quarantine, damage, or repair
- Invalid shelves are rejected
- Quantity cannot exceed available stock
- Receive supports grouped PO workflow with multiple lines
- Important actions create transaction and audit entries

## Notable routes and screens

- [app/(workspace)/receive/page.tsx](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/%28workspace%29/receive/page.tsx)
- [app/(workspace)/packing/page.tsx](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/%28workspace%29/packing/page.tsx)
- [app/(workspace)/transaction-history/page.tsx](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/%28workspace%29/transaction-history/page.tsx)
- [app/api/receipts/route.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/api/receipts/route.ts)
- [app/api/packing-orders/route.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/api/packing-orders/route.ts)
- [app/api/packing-orders/[orderId]/pdf/route.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/api/packing-orders/%5BorderId%5D/pdf/route.ts)
- [app/api/auth/google/route.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/api/auth/google/route.ts)
- [app/api/admin/import-stock/route.ts](/Users/surya/CIRCAI%20IQMS/circai-iqms/app/api/admin/import-stock/route.ts)

## Google Sheets setup

The app is structured so Google Sheets becomes the operational source of truth while the Next.js layer keeps the UI, sessions, and workflow orchestration clean.

The `Users` sheet should include at least:

- `userId`
- `fullName`
- `email`
- `passwordHash`
- `role`
- `assignedLocationId`
- `status`
- `createdAt`
- `lastLogin`

The included schema also keeps `locationIds`, approval status, and Google linking fields so role/location mapping remains flexible.

Required setup steps:

1. Create one Google Sheet and add every tab from [backend/google-apps-script/SheetSchema.md](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/SheetSchema.md), including `Users`, `Roles`, `Locations`, `Shelves`, `ProductMaster`, `Inventory`, `Transactions`, `Receipts`, `ReceiptItems`, `PackingOrders`, and `PackingOrderItems`.
2. Paste the RZ-Circular inventory source into a CSV or import it through the admin upload utility so Shelf, SKU, Product Name, and Units map into `Inventory` and `ProductMaster`.
3. Open Extensions > Apps Script from the sheet, replace the default file with [backend/google-apps-script/Code.gs](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/Code.gs), and save.
4. Add Apps Script project properties:
   - `SPREADSHEET_ID`
   - `API_TOKEN`
   - `UPLOADS_FOLDER_ID` if PO photos should go to Google Drive
   - `PDF_FOLDER_ID` if packing slip PDFs should go to Google Drive
5. Deploy the Apps Script project as a Web App.
6. Copy the deployment URL into `.env` as `GOOGLE_APPS_SCRIPT_URL`.
7. Set `GOOGLE_APPS_SCRIPT_TOKEN` to match the Apps Script `API_TOKEN`.
8. Set `DATA_SOURCE=apps-script`.
9. Configure `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` so Google Sign-In can be used for authorised users.
10. Populate `Users`, `Roles`, `Locations`, and `Shelves` in the sheet, then map each approved user to their role and assigned location.
   If the `Users` sheet is empty, the Apps Script bootstrap seeds the three demo RZ-Circular accounts automatically.
11. Test the live flows in this order:
   - sign in
   - receive stock
   - pack an order
   - damage an item
   - review packed orders and open the packing slip PDF

Implementation note:

- Standard email/password sign-in is verified in the Next.js server layer against the `Users` sheet data fetched through Apps Script, which keeps the sheet as the source of truth while preserving scrypt password compatibility.
- Google Sign-In and Google account linking are supported through the app and map back to the `Users` sheet.

For the included demo build, keep `DATA_SOURCE=local`.

## Verification

```bash
npm run typecheck
npm run build
```

Both commands pass in the current workspace build.

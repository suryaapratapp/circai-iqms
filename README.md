# IQMS by CIRCAI LTD

IQMS is a mobile-first inventory and quality management system for RZ-Circular. The app is designed for shelf-level warehouse operations with Google Sheets as the operational source of truth behind a Next.js frontend and a Google Apps Script API layer.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Mobile barcode scanning with `@zxing/browser`
- Sonner toasts
- PDF generation with `pdf-lib`
- Workbook import with `xlsx`
- Google ID token verification with `jose`

## Current operational flow

- `Receive` is PO-first and includes the quick quality decision in the same flow.
- `Move` moves available stock from one shelf to another.
- `Search` combines shelf lookup and item lookup in one screen.
- `Damage Item` only asks for item, shelf, quantity, damage outcome, and optional notes.
- `Repair Item` only works for damaged stock marked `Damaged (To repair)`.
- `Pack Order` reduces available stock and creates a packing slip.
- `Unpack` restores stock to the original packed shelf.
- `Reports` focuses on inventory, damage, repair, order, and movement summaries.

## Functional changes in this refactor

- `Inbound` is not part of the current operational flow.
- `Cycle Count` is not part of the current operational flow.
- `Move` has been added as a first-class workflow.
- `Receive` now places stock directly onto the selected shelf.
- Failed receipt quality dispositions are now only:
  - `Damaged (To repair)`
  - `Damaged (Beyond repair)`
- Damage outcomes are now only:
  - `To Repair`
  - `Beyond Repair`
- Repair statuses are now only:
  - `Returned to Stock`
  - `Beyond Repair`
- `Repair Item` only accepts damaged stock that is repair-eligible.
- The old `Daily transactions` reports card has been removed.

## Inventory model

Inventory rows are unique by:

- `itemId + locationId + shelfCode`

That means the same item can exist on multiple shelves at the same time. Receiving, moving, damaging, repairing, packing, and unpacking all operate on the specific shelf record only.

Important inventory buckets:

- `quantityAvailable`
- `quantityPacked`
- `quantityQuarantined`
- `quantityDamagedToRepair`
- `quantityDamagedBeyondRepair`

## Mobile scanning notes

- Camera scanning uses `@zxing/browser` rather than the browser's native `BarcodeDetector`, because iPhone browsers do not expose that API reliably.
- Use the app over HTTPS or `localhost`, otherwise mobile browsers will block camera access.
- The scanner asks for a user gesture before opening the camera and always keeps manual entry available as a fallback.
- If the camera is already in use by another tab or app, close it there first and reopen the scanner.

## Google Sheets setup

1. Create one Google Sheet for IQMS.
2. Add the tabs documented in [SheetSchema.md](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/SheetSchema.md).
3. Use the exact header names from that file.
4. Paste or import the RZ-Circular stock workbook so inventory is seeded with:
   - Shelf
   - SKU
   - Product Name
   - Quantity from `Units`
5. Make sure the `Users` tab contains your authorised users, roles, assigned locations, and password hashes.

## Apps Script setup

1. Open the spreadsheet.
2. Open `Extensions -> Apps Script`.
3. Replace the Apps Script project with:
   - [Code.gs](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/Code.gs)
   - [appsscript.json](/Users/surya/CIRCAI%20IQMS/circai-iqms/backend/google-apps-script/appsscript.json)
4. Redeploy the Apps Script as a web app after every backend change.
5. Set the web app URL in `.env` as `GOOGLE_APPS_SCRIPT_URL`.
6. Set `GOOGLE_APPS_SCRIPT_TOKEN` if you are using token protection.

## Apps Script contract changes to apply

Active routes now include:

- `/getDashboard`
- `/getWorkflowLookups`
- `/getInventory`
- `/getReports`
- `/searchByShelf`
- `/searchBySku`
- `/receiveStock`
- `/moveItem`
- `/damageItem`
- `/repairItem`
- `/packOrder`
- `/unpackOrder`

Important payload changes:

- `receiveStock`
  - each line now uses `disposition` only when the quality result is `fail`
  - supported fail dispositions:
    - `damaged-to-repair`
    - `damaged-beyond-repair`
- `moveItem`
  - required fields:
    - `code`
    - `shelfCode`
    - `destinationShelfCode`
    - `quantity`
- `damageItem`
  - now expects `damageOutcome`
  - supported values:
    - `to repair`
    - `beyond repair`
- `repairItem`
  - now expects `repairStatus`
  - supported values:
    - `returned to stock`
    - `beyond repair`
  - repair must only run against damaged repair-eligible stock

## Google Drive behaviour

- PO photos can be uploaded to the configured Drive folder.
- Packing slips open directly in the UI and do not need to be saved into Google Drive.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

## Recommended test order

1. Log in with a user that has access to the selected location.
2. Receive an item with:
   - pass
   - hold
   - fail to `Damaged (To repair)`
   - fail to `Damaged (Beyond repair)`
3. Search by shelf and confirm the received stock appears on the correct shelf only.
4. Search by item and confirm totals aggregate across shelves correctly.
5. Move stock from one shelf to another and confirm source and destination update separately.
6. Damage stock with:
   - `To Repair`
   - `Beyond Repair`
7. Open `Repair Item` and confirm only repair-eligible damaged stock is selectable.
8. Return repaired stock to available stock and confirm it goes back onto the same shelf.
9. Pack an order, open the packing slip, then unpack part or all of it.
10. Review `Packed Orders`, `Inventory`, `Transaction History`, and `Reports`.

## Verification

After changing the repo:

```bash
npm run build
npm run typecheck
```

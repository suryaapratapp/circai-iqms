# IQMS Implementation Plan

This repo now targets a practical rollout path for IQMS for RZ-Circular.

## Phase 1: Product polish

- Rename the product to `IQMS` with the supporting label `for RZ-Circular`
- Apply the blue operational theme and mobile-first layout refinements
- Strip back the pre-login screen to a minimal sign-in entry point
- Simplify the dashboard into a quick-action launcher with recent activity

## Phase 2: Operational workflows

- Finalise the PO-first Receive flow with grouped receipt lines
- Keep Inbound, Quality Check, Cycle Count, Damage Item, Repair Item, Pack Order, and Unpack flows short and scan-first
- Add Packed Orders with order search, user/date filters, and packing slip access
- Keep every stock movement confirmation-led and audit-backed

## Phase 3: Google Sheets source of truth

- Maintain a clean repository and service boundary between the UI and the backend
- Use Google Apps Script as the operational API layer for reads, writes, validation, and audit logging
- Use sheet headers, not hard-coded column indexes
- Keep `Users`, `Roles`, `Locations`, `Shelves`, `ProductMaster`, `Inventory`, `Transactions`, `Receipts`, `ReceiptItems`, `PackingOrders`, `PackingOrderItems`, `DamageLog`, `RepairLog`, `CycleCounts`, `QualityChecks`, `Settings`, `ReasonCodes`, `AuditTrail`, and optional file logs aligned with the frontend models

## Phase 4: Identity and Google integration

- Support email/password sign-in backed by the `Users` sheet
- Support Google Sign-In and Google account linking for approved users
- Map Google-linked users back to role, location, and active/inactive status in Sheets
- Use Google Drive optionally for PO photos and packing slip PDFs

## Phase 5: Inventory import

- Use the RZ-Circular stock file as the base import
- Map `Shelf`, `SKU`, `Product Name`, and `Units` into the warehouse model
- Aggregate duplicate SKU rows on the same shelf consistently
- Keep medical textile naming intact and reject weak or incomplete rows

## Phase 6: Operational verification

- Validate sign-in, receive, pack, damage, repair, cycle count, and packed order retrieval against Google Sheets
- Confirm stock increases and decreases persist correctly
- Confirm PDF packing slips generate and remain traceable to the order
- Confirm audit and transaction history remain readable for supervisors and admins

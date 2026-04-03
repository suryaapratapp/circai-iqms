# Google Sheets Schema

Create one spreadsheet and add these tabs with the exact headers below.

## Users
`userId,fullName,email,passwordHash,role,assignedLocationId,locationIds,status,approvalStatus,googleLinked,googleEmail,googleSubject,createdAt,lastLogin`

## Roles
`roleId,name,description,permissions`

## Locations
`locationId,code,name,address,timezone,status`

## Shelves
`shelfId,locationId,warehouse,zone,aisle,rack,shelf,code,capacityUnits,status`

## ProductMaster
`itemId,sku,upc,qrCode,itemName,description,category,unitOfMeasure,packSize,imageUrl,reorderThreshold,status,supplier,batchLot,expiryDate,requiresQualityCheck,createdAt,updatedAt`

## Inventory
`inventoryId,itemId,locationId,shelfId,shelfCode,quantityOnHand,quantityAvailable,quantityDamaged,quantityUnderRepair,quantityPacked,quantityPendingInbound,quantityQuarantined,reorderThreshold,supplier,batchLot,expiryDate,status,createdAt,lastUpdatedAt`

## Transactions
`transactionId,itemId,itemName,sku,upc,transactionType,quantity,locationId,shelfCode,userId,userName,role,timestamp,notes,referenceNumber,reasonCode,previousValue,newValue,status`

## Receipts
`receiptId,poNumber,supplierName,poPhotoFileId,locationId,receivedBy,receivedByName,receivedAt,totalLines,totalQuantity,notes`

## ReceiptItems
`receiptItemId,receiptId,itemId,sku,productName,quantityReceived,shelfCode,conditionOnArrival,batchLot,expiryDate,notes`

## QualityTemplates
`templateId,category,name,checklist,samplingMode,active`

## QualityChecks
`qualityCheckId,itemId,inventoryId,locationId,shelfCode,checklistTemplateId,result,defectCategory,disposition,notes,checkedBy,checkedByName,checkedAt,photoFileId`

## DamageLog
`damageId,itemId,locationId,shelfCode,quantity,damageReason,notes,createdBy,createdByName,createdAt`

## RepairLog
`repairId,itemId,locationId,shelfCode,quantity,repairReason,repairStatus,assignedTo,notes,createdBy,createdByName,updatedAt`

## CycleCounts
`cycleCountId,itemId,shelfCode,locationId,expectedQuantity,countedQuantity,variance,reasonCode,status,approvalRequired,approvedBy,countedBy,countedByName,countedAt`

## PackingOrders
`packingOrderId,orderNumber,locationId,packedBy,packedByName,packedAt,notes,totalLines,totalQuantity,pdfFileId`

## PackingOrderItems
`packingOrderItemId,packingOrderId,itemId,sku,upc,productName,shelfCode,quantity`

## UnpackLog
`unpackId,itemId,locationId,shelfCode,quantity,unpackReason,returnDisposition,notes,unpackedBy,unpackedByName,unpackedAt`

## Settings
`settingId,key,value,description`

## AuditTrail
`actionId,actionType,userId,userName,role,locationId,sku,productName,shelfCode,quantity,previousValue,newValue,timestamp,referenceNumber,notes`

## UploadedFiles
`fileId,fileName,fileType,storageMode,localPath,driveFileId,referenceType,referenceId,uploadedBy,uploadedAt`

## PDFLogs
`pdfId,packingOrderId,fileId,createdAt,createdBy`

## Notes

- Keep header names stable. The frontend and backend helpers use header keys, not hard-coded column positions.
- `assignedLocationId` is the primary user location. If your existing sheet already uses a `location` column, the Apps Script bootstrap will also accept that as a fallback.
- Store `locationIds` as a comma-separated string when editing manually in Google Sheets.
- Store `permissions` as a JSON array or comma-separated string.
- Store checklist arrays as JSON strings in `QualityTemplates.checklist`.
- Use UUIDs for identifiers.
- Use `Units` as the normal quantity unit for imported RZ-Circular stock.
- If the `Users` sheet is empty on first Apps Script request, the demo bootstrap seeds the three RZ-Circular demo users plus matching roles and locations automatically.

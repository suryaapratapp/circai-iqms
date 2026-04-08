import { getDamagedToRepairQuantity } from "@/lib/data/inventory";
import { RepairModule } from "@/components/workflows/repair-module";
import { getRepository } from "@/lib/data";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function RepairItemPage() {
  const session = await getCachedSession();
  const [lookups, rows] = await Promise.all([
    getCachedWorkflowLookups("repair-item"),
    getRepository().listInventory(session)
  ]);
  const eligibleRows = rows.filter(
    (row) => getDamagedToRepairQuantity(row.inventory) > 0
  );
  return (
    <RepairModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      rows={eligibleRows}
    />
  );
}

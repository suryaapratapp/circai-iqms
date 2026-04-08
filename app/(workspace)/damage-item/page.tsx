import { DamageModule } from "@/components/workflows/damage-module";
import { getRepository } from "@/lib/data";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function DamageItemPage() {
  const session = await getCachedSession();
  const [lookups, rows] = await Promise.all([
    getCachedWorkflowLookups("damage-item"),
    getRepository().listInventory(session)
  ]);
  const availableRows = rows.filter((row) => row.inventory.quantityAvailable > 0);
  return (
    <DamageModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      rows={availableRows}
    />
  );
}

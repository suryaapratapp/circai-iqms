import { RepairModule } from "@/components/workflows/repair-module";
import { getRepository } from "@/lib/data";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function RepairItemPage() {
  const session = await getCachedSession();
  const [lookups, rows] = await Promise.all([
    getCachedWorkflowLookups("repair-item"),
    getRepository().listInventory(session)
  ]);
  return (
    <RepairModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      rows={rows}
    />
  );
}

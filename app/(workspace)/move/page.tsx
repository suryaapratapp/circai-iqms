import { MoveModule } from "@/components/workflows/move-module";
import { getRepository } from "@/lib/data";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function MovePage() {
  const session = await getCachedSession();
  const [lookups, rows] = await Promise.all([
    getCachedWorkflowLookups("move"),
    getRepository().listInventory(session)
  ]);

  return (
    <MoveModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      rows={rows}
    />
  );
}

import { PackingModule } from "@/components/workflows/packing-module";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function PackingPage() {
  const [session, lookups] = await Promise.all([
    getCachedSession(),
    getCachedWorkflowLookups("packing")
  ]);
  return (
    <PackingModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
    />
  );
}

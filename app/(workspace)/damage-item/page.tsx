import { WorkflowModule } from "@/components/workflows/workflow-module";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function DamageItemPage() {
  const [session, lookups] = await Promise.all([
    getCachedSession(),
    getCachedWorkflowLookups("damage-item")
  ]);
  return (
    <WorkflowModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      workflow="damage-item"
    />
  );
}

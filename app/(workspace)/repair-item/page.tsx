import { WorkflowModule } from "@/components/workflows/workflow-module";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function RepairItemPage() {
  const [session, lookups] = await Promise.all([
    getCachedSession(),
    getCachedWorkflowLookups("repair-item")
  ]);
  return (
    <WorkflowModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      workflow="repair-item"
    />
  );
}

import { WorkflowModule } from "@/components/workflows/workflow-module";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function UnpackPage() {
  const [session, lookups] = await Promise.all([
    getCachedSession(),
    getCachedWorkflowLookups("unpack")
  ]);
  return (
    <WorkflowModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      workflow="unpack"
    />
  );
}

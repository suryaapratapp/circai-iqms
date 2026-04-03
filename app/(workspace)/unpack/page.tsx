import { WorkflowModule } from "@/components/workflows/workflow-module";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function UnpackPage() {
  const session = await requireSession();
  const lookups = await getRepository().getLookups(session);
  return (
    <WorkflowModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
      workflow="unpack"
    />
  );
}

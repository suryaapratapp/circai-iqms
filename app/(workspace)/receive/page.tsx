import { ReceiveModule } from "@/components/workflows/receive-module";
import { getCachedSession, getCachedWorkflowLookups } from "@/lib/data/server";

export default async function ReceivePage() {
  const [session, lookups] = await Promise.all([
    getCachedSession(),
    getCachedWorkflowLookups("receive")
  ]);
  return (
    <ReceiveModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
    />
  );
}

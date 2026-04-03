import { ReceiveModule } from "@/components/workflows/receive-module";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function ReceivePage() {
  const session = await requireSession();
  const lookups = await getRepository().getLookups(session);
  return (
    <ReceiveModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
    />
  );
}

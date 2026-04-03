import { PackingModule } from "@/components/workflows/packing-module";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function PackingPage() {
  const session = await requireSession();
  const lookups = await getRepository().getLookups(session);
  return (
    <PackingModule
      initialLocationId={session.assignedLocationId}
      lookups={lookups}
    />
  );
}

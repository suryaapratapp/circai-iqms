import { AppShell } from "@/components/layout/app-shell";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const repository = getRepository();
  const lookups = await repository.getLookups(session);
  const currentLocation = lookups.locations.find(
    (location) => location.locationId === session.assignedLocationId
  );

  return (
    <AppShell location={currentLocation} session={session}>
      {children}
    </AppShell>
  );
}

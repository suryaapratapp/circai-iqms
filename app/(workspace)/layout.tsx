import { AppShell } from "@/components/layout/app-shell";
import {
  getCachedAccessibleLocations,
  getCachedSession
} from "@/lib/data/server";

export default async function WorkspaceLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, locations] = await Promise.all([
    getCachedSession(),
    getCachedAccessibleLocations()
  ]);
  const currentLocation = locations.find(
    (location) => location.locationId === session.assignedLocationId
  );

  return (
    <AppShell location={currentLocation} session={session}>
      {children}
    </AppShell>
  );
}

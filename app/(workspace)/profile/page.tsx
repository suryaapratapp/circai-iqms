import { ProfilePanel } from "@/components/profile/profile-panel";
import { getCachedAccessibleLocations, getCachedSession } from "@/lib/data/server";

export default async function ProfilePage() {
  const [session, locations] = await Promise.all([
    getCachedSession(),
    getCachedAccessibleLocations()
  ]);
  const location = locations.find(
    (entry) => entry.locationId === session.assignedLocationId
  );

  return <ProfilePanel location={location} session={session} />;
}

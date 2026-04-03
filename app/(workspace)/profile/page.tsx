import { ProfilePanel } from "@/components/profile/profile-panel";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await requireSession();
  const lookups = await getRepository().getLookups(session);
  const location = lookups.locations.find(
    (entry) => entry.locationId === session.assignedLocationId
  );

  return <ProfilePanel location={location} session={session} />;
}

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function DashboardPage() {
  const session = await getCachedSession();
  const repository = getRepository();
  const dashboard = await repository.getDashboard(session);

  return <DashboardOverview dashboard={dashboard} />;
}

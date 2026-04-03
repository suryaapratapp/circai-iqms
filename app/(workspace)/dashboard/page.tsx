import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const repository = getRepository();
  const dashboard = await repository.getDashboard(session);

  return <DashboardOverview dashboard={dashboard} />;
}

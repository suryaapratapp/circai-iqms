import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function ReportsPage() {
  const session = await getCachedSession();
  const reports = await getRepository().getReports(session);
  return <ReportsDashboard reports={reports} />;
}

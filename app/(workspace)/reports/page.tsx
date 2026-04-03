import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function ReportsPage() {
  const session = await requireSession();
  const reports = await getRepository().getReports(session);
  return <ReportsDashboard reports={reports} />;
}

import { AdminConsole } from "@/components/admin/admin-console";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";
import { SurfaceCard } from "@/components/ui/surface-card";

export default async function AdminPage() {
  const session = await requireSession();

  try {
    const data = await getRepository().getAdminData(session);
    return <AdminConsole data={data} />;
  } catch (error) {
    return (
      <SurfaceCard className="rounded-[32px] p-8">
        <p className="font-heading text-3xl font-bold text-ink">Admin access required</p>
        <p className="mt-2 text-sm text-slate-600">
          {error instanceof Error
            ? error.message
            : "You do not have permission to access admin settings."}
        </p>
      </SurfaceCard>
    );
  }
}

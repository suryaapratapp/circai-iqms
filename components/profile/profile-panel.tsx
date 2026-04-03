"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/data/types";
import type { LocationRecord } from "@/lib/data/types";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";

export function ProfilePanel({
  session,
  location
}: {
  session: SessionUser;
  location?: LocationRecord;
}) {
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Unable to log out.");
      return;
    }
    toast.success("Logged out.");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <SurfaceCard className="rounded-[32px] p-6">
        <p className="font-heading text-3xl font-bold text-ink">{session.fullName}</p>
        <p className="mt-2 text-sm text-slate-600">{session.email}</p>
        <div className="mt-4 flex gap-2">
          <StatusBadge value={session.role} />
          <StatusBadge value="active" />
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <p>Assigned location: {location?.name || session.assignedLocationId}</p>
          <p>Accessible sites: {session.locationIds.join(", ")}</p>
          <p>
            Google account: {session.googleLinked ? session.googleEmail || "Linked" : "Not linked"}
          </p>
        </div>
        <div className="mt-6">
          <GoogleSignInButton mode="link" />
        </div>
        <Button className="mt-6 w-full" onClick={logout} variant="danger">
          Log out
        </Button>
      </SurfaceCard>
      <SurfaceCard className="rounded-[32px] p-6">
        <p className="font-heading text-2xl font-bold text-ink">Warehouse session notes</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            "Mobile-first actions prioritise scan and confirm over typing.",
            "Use Search by SKU / UPC when a barcode does not map cleanly from a workflow.",
            "Cycle count variance beyond threshold routes to supervisor approval.",
            "Failed quality or damaged items remain blocked from packing."
          ].map((note) => (
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700" key={note}>
              {note}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

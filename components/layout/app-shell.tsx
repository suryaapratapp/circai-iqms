import type { SessionUser } from "@/lib/data/types";
import type { LocationRecord } from "@/lib/data/types";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  session,
  location,
  children
}: {
  session: SessionUser;
  location?: LocationRecord;
  children: React.ReactNode;
}) {
  return (
    <div className="floor-grid min-h-screen px-3 py-3 md:px-5 md:py-5 lg:px-7">
      <div className="mx-auto flex max-w-[1520px] gap-5 lg:gap-6">
        <Sidebar role={session.role} />
        <main className="min-w-0 flex-1 pb-28 lg:pb-8">
          <div className="space-y-5">
            <Header location={location} session={session} />
            {children}
          </div>
        </main>
      </div>
      <MobileNav role={session.role} />
    </div>
  );
}

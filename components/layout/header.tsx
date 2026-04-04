import { Clock3, MapPin, ScanLine, User2 } from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/lib/data/types";
import type { LocationRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/layout/brand-lockup";

function formatHeaderTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function Header({
  session,
  location
}: {
  session: SessionUser;
  location?: LocationRecord;
}) {
  const metaItems = [
    {
      icon: User2,
      label: session.fullName
    },
    {
      icon: MapPin,
      label: location?.name || session.assignedLocationId
    },
    {
      icon: Clock3,
      label: formatHeaderTime(new Date())
    }
  ];

  return (
    <header className="glass-panel rounded-[32px] px-5 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between xl:flex-1">
          <Link className="inline-flex" href="/dashboard" prefetch={false}>
            <BrandLockup size="md" />
          </Link>
          <div className="flex flex-wrap gap-2">
            {metaItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600"
                  key={item.label}
                >
                  <Icon className="h-3.5 w-3.5 text-teal" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/search" prefetch={false}>
            <Button className="min-w-[152px] gap-2">
              <ScanLine className="h-4 w-4" />
              Open Search
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

import { CalendarDays, MapPin, ScanLine } from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config/app";
import { formatDateTime } from "@/lib/utils/format";
import type { SessionUser } from "@/lib/data/types";
import type { LocationRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";

export function Header({
  session,
  location
}: {
  session: SessionUser;
  location?: LocationRecord;
}) {
  return (
    <header className="glass-panel rounded-[30px] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
            {appConfig.name}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink">
            Welcome back, {session.fullName.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {appConfig.subtitle}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal" />
              {location?.name || session.assignedLocationId}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-teal" />
              {formatDateTime(new Date())}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/search-by-upc">
            <Button className="min-w-[160px] gap-2">
              <ScanLine className="h-4 w-4" />
              Scan Now
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

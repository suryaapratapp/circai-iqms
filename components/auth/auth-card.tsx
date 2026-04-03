import Link from "next/link";
import { appConfig, SHOW_DEVELOPER_BRANDING } from "@/lib/config/app";
import { SurfaceCard } from "@/components/ui/surface-card";

export function AuthCard({
  title,
  description,
  footer,
  children,
  showDeveloperBranding = SHOW_DEVELOPER_BRANDING
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  showDeveloperBranding?: boolean;
}) {
  return (
    <SurfaceCard className="w-full max-w-xl rounded-[36px] px-6 py-7 md:px-8">
      <div className="mb-6">
        <Link className="text-sm font-semibold uppercase tracking-[0.16em] text-teal" href="/">
          {appConfig.name}
        </Link>
        <p className="mt-1 text-sm font-medium text-slate-700">{appConfig.subtitle}</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-ink">{title}</h1>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        {showDeveloperBranding ? (
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {appConfig.developerLine}
          </p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div> : null}
    </SurfaceCard>
  );
}

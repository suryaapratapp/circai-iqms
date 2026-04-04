"use client";

import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";

export function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  children
}: {
  open: boolean;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  children?: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-3 md:items-center md:justify-center md:p-4">
      <SurfaceCard className="w-full max-w-lg rounded-[30px] p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Confirmation
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-ink">{title}</p>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Button className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button className="flex-1" onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

interface FieldProps {
  label: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Field({ label, helperText, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
      {helperText ? <span className="text-xs text-slate-500">{helperText}</span> : null}
    </label>
  );
}

export function inputClassName(extra?: string) {
  return cn(
    "w-full rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100",
    extra
  );
}

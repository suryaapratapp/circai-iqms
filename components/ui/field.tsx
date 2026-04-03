import { cn } from "@/lib/utils/cn";

interface FieldProps {
  label: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Field({ label, helperText, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {helperText ? <span className="text-xs text-slate-500">{helperText}</span> : null}
    </label>
  );
}

export function inputClassName(extra?: string) {
  return cn(
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20",
    extra
  );
}

import { cn } from "@/lib/utils/cn";

const toneMap: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  stored: "bg-teal/10 text-teal",
  "pending putaway": "bg-amber-100 text-amber-800",
  received: "bg-blue-100 text-blue-800",
  "pending quality check": "bg-orange-100 text-orange-800",
  "quality passed": "bg-emerald-100 text-emerald-800",
  "quality failed": "bg-rose-100 text-rose-800",
  damaged: "bg-rose-100 text-rose-800",
  "under repair": "bg-slate-200 text-slate-700",
  packed: "bg-indigo-100 text-indigo-800",
  unpacked: "bg-cyan-100 text-cyan-800",
  quarantined: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  "pending approval": "bg-amber-100 text-amber-800",
  submitted: "bg-amber-100 text-amber-800",
  pending: "bg-slate-100 text-slate-700",
  low: "bg-lime-100 text-lime-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
  shortfall: "bg-amber-100 text-amber-800",
  "returned to stock": "bg-emerald-100 text-emerald-800",
  pass: "bg-emerald-100 text-emerald-800",
  fail: "bg-rose-100 text-rose-800",
  hold: "bg-amber-100 text-amber-800",
  admin: "bg-blue-100 text-blue-800",
  supervisor: "bg-slate-200 text-slate-800",
  operator: "bg-cyan-100 text-cyan-800"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold capitalize tracking-[0.02em]",
        toneMap[value] || "bg-slate-100 text-slate-700"
      )}
    >
      {value}
    </span>
  );
}

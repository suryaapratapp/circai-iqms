import { getDemoCredentials } from "@/lib/data/seed";

export function DemoCredentials() {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4 text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
        Demo credentials
      </p>
      <div className="mt-3 space-y-2 text-sm">
        {getDemoCredentials().map((credential) => (
          <div
            className="rounded-2xl border border-white bg-white px-3 py-3"
            key={credential.email}
          >
            <p className="font-semibold text-ink">{credential.role}</p>
            <p>{credential.email}</p>
            <p>{credential.password}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

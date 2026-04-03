import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      description=""
      footer={
        <p className="text-sm text-slate-600">
          Need access now? Return to{" "}
          <Link className="font-semibold text-teal" href="/login">
            sign in
          </Link>
        </p>
      }
      title="Forgot Password"
    >
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          This screen is a placeholder for an admin-approved reset or email recovery flow.
        </p>
        <Link
          className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-warehouse transition hover:bg-slate-800"
          href="/login"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { DemoCredentials } from "@/components/auth/demo-credentials";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const showDemoCredentials =
    process.env.NODE_ENV !== "production" || process.env.DATA_SOURCE === "local";

  return (
    <AuthCard
      description=""
      footer={
        <div className="space-y-4">
          <GoogleSignInButton />
          {showDemoCredentials ? <DemoCredentials /> : null}
          <p className="text-sm text-slate-600">
            Need access?{" "}
            <Link className="font-semibold text-teal" href="/register">
              Register
            </Link>
          </p>
        </div>
      }
      title="Sign In"
    >
      <LoginForm />
    </AuthCard>
  );
}

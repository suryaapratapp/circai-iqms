"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to sign in.");
      return;
    }

    toast.success("Signed in successfully.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4"
    >
      <Field label="Email">
        <input className={inputClassName()} name="email" placeholder="you@company.com" required type="email" />
      </Field>
      <Field label="Password">
        <input className={inputClassName()} name="password" placeholder="Enter your password" required type="password" />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-teal" href="/forgot-password">
          Forgot password
        </Link>
        <Button disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

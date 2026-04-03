"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import type { LocationRecord } from "@/lib/data/types";

export function RegisterForm({ locations }: { locations: LocationRecord[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
        assignedLocationId: formData.get("assignedLocationId")
      })
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);

    if (!response.ok) {
      toast.error(data.error || "Unable to register.");
      return;
    }

    toast.success(data.message || "Registration submitted.");
    router.push("/login");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="Full name">
        <input className={inputClassName()} name="fullName" placeholder="Warehouse team member" required type="text" />
      </Field>
      <Field label="Work email">
        <input className={inputClassName()} name="email" placeholder="operator@company.com" required type="email" />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Password">
          <input className={inputClassName()} minLength={8} name="password" placeholder="Minimum 8 characters" required type="password" />
        </Field>
        <Field label="Role">
          <select className={inputClassName()} defaultValue="operator" name="role">
            <option value="operator">Operator</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </div>
      <Field label="Assigned location">
        <select className={inputClassName()} name="assignedLocationId" required>
          {locations.map((location) => (
            <option key={location.locationId} value={location.locationId}>
              {location.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-teal" href="/login">
          Already have an account?
        </Link>
        <Button disabled={pending} type="submit">
          {pending ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

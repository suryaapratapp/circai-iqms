import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { getRepository } from "@/lib/data";

export default async function RegisterPage() {
  const repository = getRepository();
  const lookups = await repository.getLookups({
    userId: "setup",
    fullName: "Setup",
    email: "setup@circai.demo",
    role: "admin",
    assignedLocationId: "loc_bengaluru-main-hub",
    locationIds: [
      "loc_bengaluru-main-hub",
      "loc_pune-repair-qa-hub",
      "loc_hyderabad-dispatch-center"
    ]
  });

  return (
    <AuthCard
      description=""
      footer={
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            New registrations are created with pending approval so an admin can authorise site access.
          </p>
          <p className="text-sm text-slate-600">
            Already have access?{" "}
            <Link className="font-semibold text-teal" href="/login">
              Return to sign in
            </Link>
          </p>
        </div>
      }
      title="Register"
    >
      <RegisterForm locations={lookups.locations} />
    </AuthCard>
  );
}

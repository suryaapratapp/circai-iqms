import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const repository = getRepository();
    const admin = await repository.getAdminData(session);
    return NextResponse.json(admin);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load admin data.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

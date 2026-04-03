import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const repository = getRepository();
  const lookups = await repository.getLookups(session);
  return NextResponse.json(lookups);
}

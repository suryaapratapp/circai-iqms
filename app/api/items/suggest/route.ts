import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const limit = Number(searchParams.get("limit") || 12);

  try {
    const items = await getRepository().suggestItems(query, session, {
      limit
    });
    return NextResponse.json(items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load item suggestions.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

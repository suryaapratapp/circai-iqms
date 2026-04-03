import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("query") || "";

  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  const repository = getRepository();
  const result =
    type === "shelf"
      ? await repository.searchShelf(query, session)
      : await repository.searchItem(query, session);

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { clearRepositoryCache } from "@/lib/data";
import { importStockWorkbook } from "@/lib/data/operations";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a stock file first." }, { status: 400 });
  }
  const summary = await importStockWorkbook(
    file.name,
    Buffer.from(await file.arrayBuffer()),
    session
  );
  clearRepositoryCache();
  return NextResponse.json(summary);
}

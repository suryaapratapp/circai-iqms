import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";
import type { WorkflowType } from "@/lib/data/types";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const repository = getRepository();
  const workflow = new URL(request.url).searchParams.get("workflow") as
    | WorkflowType
    | null;
  const lookups = workflow
    ? await repository.getWorkflowLookups(session, workflow)
    : await repository.getLookups(session);
  return NextResponse.json(lookups);
}

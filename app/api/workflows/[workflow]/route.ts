import { NextResponse } from "next/server";
import { clearRepositoryCache, getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";
import type { WorkflowType } from "@/lib/data/types";

const supportedWorkflows: WorkflowType[] = [
  "move",
  "damage-item",
  "repair-item",
  "packing",
  "unpack"
];

export async function POST(
  request: Request,
  context: { params: Promise<{ workflow: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { workflow } = await context.params;
  if (!supportedWorkflows.includes(workflow as WorkflowType)) {
    return NextResponse.json({ error: "Unsupported workflow." }, { status: 404 });
  }

  try {
    const payload = (await request.json()) as Record<
      string,
      string | number | boolean | undefined
    >;
    const repository = getRepository();
    const result = await repository.processWorkflow(
      workflow as WorkflowType,
      payload,
      session
    );
    clearRepositoryCache();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process workflow.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

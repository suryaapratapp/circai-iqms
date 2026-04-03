import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await context.params;
  const packedOrder = await getRepository().getPackedOrder(orderId, session);
  if (!packedOrder) {
    return NextResponse.json({ error: "Packed order not found." }, { status: 404 });
  }
  return NextResponse.json(packedOrder);
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { generatePackingSlipPdf } from "@/lib/data/operations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await context.params;
  const pdf = await generatePackingSlipPdf(orderId, session);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${orderId}.pdf"`
    }
  });
}

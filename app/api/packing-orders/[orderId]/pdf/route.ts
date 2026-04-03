import { NextResponse } from "next/server";
import { generatePackingSlipPdf } from "@/lib/data/operations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const pdf = await generatePackingSlipPdf(orderId);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${orderId}.pdf"`
    }
  });
}

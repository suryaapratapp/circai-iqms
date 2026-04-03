import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { createReceipt } from "@/lib/data/operations";

const lineSchema = z.object({
  code: z.string().min(1),
  quantityReceived: z.number().positive(),
  shelfCode: z.string().min(1),
  conditionOnArrival: z.string().min(1),
  batchLot: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional()
});

const schema = z.object({
  supplierName: z.string().min(1),
  poNumber: z.string().min(1),
  locationId: z.string().min(1),
  poPhotoFileId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1)
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const body = schema.parse(await request.json());
    const receipt = await createReceipt(body, session);
    return NextResponse.json(receipt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save receipt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

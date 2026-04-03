import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { createPackingOrder } from "@/lib/data/operations";

const schema = z.object({
  locationId: z.string().min(2),
  notes: z.string().optional(),
  rows: z
    .array(
      z.object({
        code: z.string().min(1),
        shelfCode: z.string().min(1),
        quantity: z.number().positive()
      })
    )
    .min(1)
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const body = schema.parse(await request.json());
    const result = await createPackingOrder(body, session);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create packing order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

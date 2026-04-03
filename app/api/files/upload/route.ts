import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/data/operations";

const schema = z.object({
  referenceType: z.enum(["po-photo", "quality-photo", "packing-slip"]),
  referenceId: z.string().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  const meta = schema.parse({
    referenceType: formData.get("referenceType"),
    referenceId: formData.get("referenceId") || undefined
  });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const saved = await saveUploadedFile(file, session, meta.referenceType, meta.referenceId);
  return NextResponse.json(saved);
}

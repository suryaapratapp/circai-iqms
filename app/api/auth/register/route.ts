import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { getRepository } from "@/lib/data";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "supervisor", "operator"]),
  assignedLocationId: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const repository = getRepository();
    const result = await repository.register({
      ...body,
      passwordHash: hashPassword(body.password)
    });

    return NextResponse.json({
      ok: Boolean(result.user),
      message: result.message || "Registration submitted."
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

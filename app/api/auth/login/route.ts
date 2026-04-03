import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { toSessionUser } from "@/lib/data/seed";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const repository = getRepository();
    const result = await repository.authenticate(body.email, body.password);

    if (!result.user) {
      return NextResponse.json(
        { error: result.message || "Invalid credentials." },
        { status: 401 }
      );
    }

    await createSession(toSessionUser(result.user));
    await repository.updateLastLogin(result.user.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

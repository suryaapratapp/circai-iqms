import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyGoogleCredential } from "@/lib/auth/google";
import { createSession, getServerSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { toSessionUser } from "@/lib/data/seed";

const schema = z.object({
  credential: z.string().min(10),
  mode: z.enum(["signin", "link"]).default("signin")
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const googleProfile = await verifyGoogleCredential(body.credential);
    const repository = getRepository();

    if (body.mode === "link") {
      const session = await getServerSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      }
      const user = await repository.linkGoogleAccount(
        session.userId,
        googleProfile.email,
        googleProfile.sub
      );
      await createSession(toSessionUser(user));
      return NextResponse.json({ ok: true, linked: true });
    }

    const user = await repository.findUserByGoogleIdentity(
      googleProfile.email,
      googleProfile.sub
    );
    if (!user) {
      return NextResponse.json(
        {
          error:
            "No authorised user was found for this Google account. Ask an admin to approve and link access."
        },
        { status: 401 }
      );
    }

    await createSession(toSessionUser(user));
    await repository.updateLastLogin(user.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to continue with Google sign-in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

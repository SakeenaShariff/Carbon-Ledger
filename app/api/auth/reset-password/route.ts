import { NextResponse } from "next/server";
import { consumePasswordReset } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; token?: string; password?: string };
    const email = (body.email ?? "").trim();
    const token = body.token ?? "";
    const password = body.password ?? "";
    if (!email || !token) {
      return NextResponse.json({ error: "Reset token is missing." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    await consumePasswordReset(email, token, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset password";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

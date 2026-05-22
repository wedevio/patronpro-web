import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPpSession } from "@/lib/auth/session";

/**
 * Reusable auth guard for API routes under /api/panel/* and /api/support/*.
 *
 * Usage:
 *   const auth = await requirePpSession();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.session.email / auth.session.sub are available
 */
export async function requirePpSession(): Promise<
  { session: { email: string; sub: string } } | NextResponse
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pp-session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const session = await verifyPpSession(token);
    return { session };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

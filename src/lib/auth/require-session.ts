import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPpSession } from "@/lib/auth/session";

export type PpSession = { email: string; sub: string; role: "admin" | "member" };

/**
 * Reusable auth guard for API routes under /api/panel/* and /api/support/*.
 *
 * Usage:
 *   const auth = await requirePpSession();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.session.email / auth.session.sub / auth.session.role
 */
export async function requirePpSession(): Promise<
  { session: PpSession } | NextResponse
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

/**
 * Admin-only guard. Returns 403 if the session exists but role is not admin.
 */
export async function requireAdmin(): Promise<
  { session: PpSession } | NextResponse
> {
  const result = await requirePpSession();
  if (result instanceof NextResponse) return result;
  if (result.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

/**
 * Read the pp-session from cookies without throwing. Returns null if invalid/absent.
 * Useful in Server Components.
 */
export async function getPpSession(): Promise<PpSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pp-session")?.value;
  if (!token) return null;
  try {
    return await verifyPpSession(token);
  } catch {
    return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Supabase SSR stores auth in sb-{projectRef}-auth-token (or .0, .1 chunks)
const PROJECT_REF = "mtkbqnngqcqywsdewaxs";
const COOKIE_BASE = `sb-${PROJECT_REF}-auth-token`;

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /panel
  if (!pathname.startsWith("/panel")) return NextResponse.next();

  // Optimistic check: just verify the session cookie exists (no network call)
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has(COOKIE_BASE) ||
    cookieStore.has(`${COOKIE_BASE}.0`);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};

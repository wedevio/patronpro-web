import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/panel")) return NextResponse.next();

  const cookieStore = await cookies();
  const token = cookieStore.get("pp-session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await verifyPpSession(token);
    return NextResponse.next();
  } catch {
    // Token exists but signature is invalid or expired — clear it and redirect
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("pp-session");
    return res;
  }
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};

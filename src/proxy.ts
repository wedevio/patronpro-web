import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/panel")) return NextResponse.next();

  const cookieStore = await cookies();
  const hasSession  = cookieStore.has("pp-session");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};

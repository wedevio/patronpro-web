import { NextRequest, NextResponse } from "next/server";
import { verifyPpSession } from "@/lib/auth/session";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/panel") || pathname.startsWith("/collaborators");
  const isProtectedApi = pathname.startsWith("/api/collaborators");

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const token = req.cookies.get("pp-session")?.value;

  if (!token) {
    return unauthorizedResponse(req, isProtectedApi);
  }

  try {
    await verifyPpSession(token);
    return NextResponse.next();
  } catch {
    // Token exists but signature is invalid or expired — clear it and redirect
    const res = unauthorizedResponse(req, isProtectedApi);
    res.cookies.delete("pp-session");
    return res;
  }
}

function unauthorizedResponse(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  const nextPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  if (isSafeNextPath(nextPath)) {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

function isSafeNextPath(value: string) {
  return (
    value.startsWith("/panel") ||
    value.startsWith("/collaborators")
  ) && !value.startsWith("//");
}

export const config = {
  matcher: [
    "/panel",
    "/panel/:path*",
    "/collaborators",
    "/collaborators/:path*",
    "/api/collaborators/:path*",
  ],
};

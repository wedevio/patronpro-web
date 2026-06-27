import { NextRequest, NextResponse } from "next/server";
import { verifyPpSession } from "@/lib/auth/session";
import {
  DEFAULT_PANEL_LAB_LOGIN_URL,
  buildPanelLabLoginRedirect,
  isCollaboratorNextPath,
  isPanelPath,
} from "@/lib/auth/login-redirects";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPanelPath(pathname)) {
    return NextResponse.redirect(
      buildPanelLabLoginRedirect(
        req.url,
        process.env.PATRONPRO_PANEL_LAB_LOGIN_URL ?? DEFAULT_PANEL_LAB_LOGIN_URL
      )
    );
  }

  const isProtectedPage = isCollaboratorNextPath(pathname);
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
  if (isCollaboratorNextPath(nextPath)) {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
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

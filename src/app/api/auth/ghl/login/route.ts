import { NextResponse } from "next/server";

/**
 * GET /api/auth/ghl/login
 * Redirects to GHL OAuth authorization page.
 * Visit this URL from a browser when the refresh token needs to be re-issued.
 */
export async function GET(): Promise<Response> {
  const clientId = process.env.GHL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GHL_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getpatronpro.com"}/api/auth/ghl/callback`;

  const url = new URL("https://marketplace.gohighlevel.com/oauth/chooselocation");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", [
    "businesses.readonly",
    "businesses.write",
    "locations.readonly",
    "locations/customValues.readonly",
    "locations/customValues.write",
    "locations/media.readonly",
    "locations/media.write",
    "locations/brandboards.readonly",
    "locations/brandboards.write",
  ].join(" "));

  return NextResponse.redirect(url.toString());
}

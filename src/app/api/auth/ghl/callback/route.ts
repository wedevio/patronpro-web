import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const REDIS_KEY = "ghl:refresh_token";

/**
 * GET /api/auth/ghl/callback
 * GHL redirects here after the user authorizes the app.
 * Exchanges the code for tokens and persists the refresh token to Redis.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing GHL OAuth credentials" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getpatronpro.com"}/api/auth/ghl/callback`;

  const res = await fetch(GHL_TOKEN_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      user_type: "Company",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `GHL token exchange failed: ${res.status}`, detail: body },
      { status: 502 }
    );
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Persist refresh token to Redis
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    await redis.set(REDIS_KEY, data.refresh_token, { ex: 60 * 60 * 24 * 330 });
    console.info("[GHL OAuth] Refresh token saved to Redis successfully");
  }

  return NextResponse.json({ ok: true, message: "GHL OAuth authorized. Refresh token saved to Redis." });
}

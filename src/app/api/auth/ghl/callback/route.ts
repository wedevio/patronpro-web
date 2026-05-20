import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const REDIS_KEY = "ghl:refresh_token";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId     = process.env.GHL_CLIENT_ID!;
  const clientSecret = process.env.GHL_CLIENT_SECRET!;
  const redirectUri  = `${req.nextUrl.origin}/api/ghl/callback`;

  const res = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    "authorization_code",
      code,
      redirect_uri:  redirectUri,
      user_type:     "Company",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `Token exchange failed: ${res.status}`, body }, { status: 500 });
  }

  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };

  // Save refresh token to Redis
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    await redis.set(REDIS_KEY, data.refresh_token, { ex: 60 * 60 * 24 * 330 });
  }

  return NextResponse.json({
    ok: true,
    message: "GHL re-authorized successfully. Panel should work now.",
    refresh_token_prefix: data.refresh_token.slice(0, 30) + "...",
  });
}

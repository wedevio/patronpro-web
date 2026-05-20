/**
 * GHL OAuth 2.0 token management
 *
 * Flow:
 * 1. Use GHL_REFRESH_TOKEN (seed from env, then persisted in Redis) to get a
 *    fresh agency access token (valid 24h)
 * 2. Use that agency token to generate a location-scoped token for any sub-account
 *
 * The refresh token is valid for 1 year. GHL rotates it on every use —
 * we persist the new one to Redis (KV_REST_API_URL / KV_REST_API_TOKEN).
 */

import { Redis } from "@upstash/redis";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const GHL_LOCATION_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/locationToken";
const REDIS_KEY = "ghl:refresh_token";

// In-memory cache for the agency access token (reused within the same serverless instance)
let cachedAgencyToken: { token: string; expiresAt: number } | null = null;

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

async function getRefreshToken(): Promise<string> {
  const redis = getRedis();
  if (redis) {
    const stored = await redis.get<string>(REDIS_KEY);
    if (stored) return stored;
  }
  // Fallback to env var (seed value)
  const fromEnv = process.env.GHL_REFRESH_TOKEN;
  if (!fromEnv) throw new Error("Missing GHL_REFRESH_TOKEN env var and no token in Redis");
  return fromEnv;
}

async function saveRefreshToken(token: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    // Store with 11 months TTL (token is valid 1 year, rotate before expiry)
    await redis.set(REDIS_KEY, token, { ex: 60 * 60 * 24 * 330 });
  } else {
    console.warn("[GHL OAuth] Redis not configured — new refresh token NOT persisted. Update GHL_REFRESH_TOKEN manually:", token.slice(0, 20) + "...");
  }
}

export async function getAgencyAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAgencyToken && Date.now() < cachedAgencyToken.expiresAt - 5 * 60 * 1000) {
    return cachedAgencyToken.token;
  }

  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GHL OAuth credentials (GHL_CLIENT_ID, GHL_CLIENT_SECRET)");
  }

  const refreshToken = await getRefreshToken();

  const res = await fetch(GHL_TOKEN_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      user_type: "Company",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL token refresh failed: ${res.status} ${body}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Cache the access token in memory
  cachedAgencyToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  // Persist the new rotated refresh token
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await saveRefreshToken(data.refresh_token);
  }

  return data.access_token;
}

export async function getLocationAccessToken(locationId: string): Promise<string> {
  const agencyToken = await getAgencyAccessToken();
  const companyId = process.env.GHL_COMPANY_ID;

  if (!companyId) {
    throw new Error("Missing GHL_COMPANY_ID env var");
  }

  const res = await fetch(GHL_LOCATION_TOKEN_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Version": "2021-07-28",
      "Authorization": `Bearer ${agencyToken}`,
    },
    body: JSON.stringify({ companyId, locationId }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL location token failed for ${locationId}: ${res.status} ${body}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

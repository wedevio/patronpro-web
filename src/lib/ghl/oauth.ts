/**
 * GHL OAuth 2.0 token management
 *
 * Flow:
 * 1. Use GHL_REFRESH_TOKEN to get a fresh agency access token (valid 24h)
 * 2. Use that agency token to generate a location-scoped token for any sub-account
 *
 * The refresh token is valid for 1 year. When it's used, GHL returns a NEW
 * refresh token — we persist that back to avoid expiry.
 */

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const GHL_LOCATION_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/locationToken";

// In-memory cache for the agency access token (reused within the same process)
let cachedAgencyToken: { token: string; expiresAt: number } | null = null;

export async function getAgencyAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAgencyToken && Date.now() < cachedAgencyToken.expiresAt - 5 * 60 * 1000) {
    return cachedAgencyToken.token;
  }

  const refreshToken = process.env.GHL_REFRESH_TOKEN;
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing GHL OAuth credentials (GHL_REFRESH_TOKEN, GHL_CLIENT_ID, GHL_CLIENT_SECRET)");
  }

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

  // Cache the access token
  cachedAgencyToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  // GHL rotates the refresh token on every use — log the new one
  // In production you'd persist this to a DB; for now we log so you can update the env var if needed
  if (data.refresh_token !== refreshToken) {
    console.info("[GHL OAuth] Refresh token rotated. Update GHL_REFRESH_TOKEN in Vercel env vars with:", data.refresh_token.slice(0, 20) + "...");
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

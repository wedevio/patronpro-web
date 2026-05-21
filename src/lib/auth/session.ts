import { SignJWT, jwtVerify } from "jose";

const SUPPORT_TTL_SECONDS = 8 * 60 * 60; // 8 hours

function getSupportSecret(): Uint8Array {
  const secret = process.env.SUPPORT_SESSION_SECRET;
  if (!secret) throw new Error("SUPPORT_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function getNextAuthSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Signs a support-session JWT for the given iframe location/contact.
 * TTL: 8 hours.
 */
export async function signSupportSession(payload: {
  locationId: string;
  contactId?: string;
}): Promise<string> {
  return new SignJWT({ locationId: payload.locationId, contactId: payload.contactId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SUPPORT_TTL_SECONDS}s`)
    .sign(getSupportSecret());
}

/**
 * Verifies a support-session JWT and returns its payload.
 */
export async function verifySupportSession(
  token: string
): Promise<{ locationId: string; contactId?: string }> {
  const { payload } = await jwtVerify(token, getSupportSecret());

  const locationId = payload["locationId"];
  const contactId = payload["contactId"];

  if (typeof locationId !== "string" || !locationId) {
    throw new Error("Invalid support session: missing locationId");
  }

  return {
    locationId,
    contactId: typeof contactId === "string" ? contactId : undefined,
  };
}

/**
 * Verifies a pp-session (NextAuth) JWT using NEXTAUTH_SECRET.
 * Replaces the previous unverified jwtDecode usage.
 */
export async function verifyPpSession(
  token: string
): Promise<{ email: string; sub: string }> {
  const { payload } = await jwtVerify(token, getNextAuthSecret());

  const email = payload["email"] ?? payload["sub"];
  const sub = payload["sub"];

  if (typeof email !== "string" || !email) {
    throw new Error("Invalid pp-session: missing email");
  }
  if (typeof sub !== "string" || !sub) {
    throw new Error("Invalid pp-session: missing sub");
  }

  return { email, sub };
}

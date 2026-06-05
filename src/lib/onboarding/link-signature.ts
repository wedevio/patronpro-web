import { createHmac, timingSafeEqual } from "crypto";

interface OnboardingLinkPayload {
  locationId: string;
  contactId: string;
  patronProContactId: string;
  expiresAt: string;
}

function getOnboardingLinkSecret(): string {
  const secret = process.env.ONBOARDING_LINK_SECRET;
  if (!secret) {
    throw new Error("ONBOARDING_LINK_SECRET must be configured");
  }

  return secret;
}

function serializePayload(payload: OnboardingLinkPayload): string {
  return [payload.locationId, payload.contactId, payload.patronProContactId, payload.expiresAt].join(":");
}

function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() > timestamp;
}

export function signOnboardingLink(payload: OnboardingLinkPayload): string {
  return createHmac("sha256", getOnboardingLinkSecret())
    .update(serializePayload(payload))
    .digest("hex");
}

export function verifyOnboardingLinkSignature(
  payload: OnboardingLinkPayload,
  signature: string
): boolean {
  if (isExpired(payload.expiresAt)) return false;

  const expected = Buffer.from(signOnboardingLink(payload), "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}

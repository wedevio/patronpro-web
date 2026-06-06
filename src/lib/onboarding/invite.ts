import { ghlFetch } from "@/lib/ghl/client";
import { getPatronProLocationId } from "@/lib/ghl/contacts";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { signOnboardingLink } from "@/lib/onboarding/link-signature";

interface GHLContactsResponse {
  contacts?: Array<{ id: string; email?: string }>;
}

interface GHLUpsertResponse {
  contact?: { id: string };
}

interface ContactSeedData {
  email: string;
  phone: string;
  firstName: string;
  businessName: string;
}

export interface BuildOnboardingLinkInput {
  locationId: string;
  email: string;
  phone?: string;
  firstName?: string;
  businessName?: string;
}

export interface BuildOnboardingLinkResult {
  onboardingLink: string;
  clientContactId: string;
  patronProContactId: string;
  expiresAt: string;
}

async function findOrCreateContact(
  locationId: string,
  data: ContactSeedData,
  token: string
): Promise<string> {
  const res = await ghlFetch(
    `/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(data.email)}&limit=1`,
    { method: "GET", token }
  );

  if (res.ok) {
    const json = (await res.json()) as GHLContactsResponse;
    const found = json.contacts?.[0]?.id;
    if (found) return found;
  }

  const upsertRes = await ghlFetch("/contacts/upsert", {
    method: "POST",
    token,
    body: JSON.stringify({
      locationId,
      email: data.email,
      ...(data.phone && { phone: data.phone }),
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.businessName && { companyName: data.businessName }),
    }),
  });

  if (!upsertRes.ok) {
    throw new Error(`Failed to create contact in sub-account: ${upsertRes.status} ${await upsertRes.text()}`);
  }

  const upsertJson = (await upsertRes.json()) as GHLUpsertResponse;
  const id = upsertJson.contact?.id;
  if (!id) throw new Error("Upsert in sub-account returned no contact id");
  return id;
}

async function upsertInPatronPro(
  ppLocationId: string,
  data: ContactSeedData,
  token: string
): Promise<string> {
  const res = await ghlFetch("/contacts/upsert", {
    method: "POST",
    token,
    body: JSON.stringify({
      locationId: ppLocationId,
      email: data.email,
      ...(data.phone && { phone: data.phone }),
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.businessName && { companyName: data.businessName }),
    }),
  });

  if (!res.ok) {
    throw new Error(`Upsert contact failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as GHLUpsertResponse;
  const id = json.contact?.id;
  if (!id) throw new Error("Upsert returned no contact id");
  return id;
}

export async function buildOnboardingLink(
  input: BuildOnboardingLinkInput
): Promise<BuildOnboardingLinkResult> {
  const email = input.email.toLowerCase().trim();
  if (!email) throw new Error("email is required");

  const data: ContactSeedData = {
    email,
    phone: input.phone?.trim() ?? "",
    firstName: input.firstName?.trim() ?? "",
    businessName: input.businessName?.trim() ?? "",
  };

  const clientToken = await getLocationAccessToken(input.locationId);
  const clientContactId = await findOrCreateContact(input.locationId, data, clientToken);

  const patronProLocationId = getPatronProLocationId();
  const patronProToken = await getLocationAccessToken(patronProLocationId);
  const patronProContactId = await upsertInPatronPro(patronProLocationId, data, patronProToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const signature = signOnboardingLink({
    locationId: input.locationId,
    contactId: clientContactId,
    patronProContactId,
    expiresAt,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpatronpro.com";
  const onboardingUrl = new URL("/onboarding", appUrl);
  onboardingUrl.searchParams.set("locationId", input.locationId);
  onboardingUrl.searchParams.set("contactId", clientContactId);
  onboardingUrl.searchParams.set("ppContactId", patronProContactId);
  onboardingUrl.searchParams.set("expiresAt", expiresAt);
  onboardingUrl.searchParams.set("sig", signature);

  return {
    onboardingLink: onboardingUrl.toString(),
    clientContactId,
    patronProContactId,
    expiresAt,
  };
}

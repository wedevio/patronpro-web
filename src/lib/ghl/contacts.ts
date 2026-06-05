import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "./client";

export interface GhlContactIdentity {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  companyName?: string;
}

interface GhlContactResponse {
  contact?: Record<string, unknown>;
}

export function getPatronProLocationId(): string {
  const locationId = process.env.GHL_PATRONPRO_LOCATION_ID ?? process.env.PATRONPRO_LOCATION_ID;
  if (!locationId) {
    throw new Error("GHL_PATRONPRO_LOCATION_ID or PATRONPRO_LOCATION_ID must be configured");
  }

  return locationId;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readContactIdentity(contact: Record<string, unknown>): GhlContactIdentity {
  return {
    email: readString(contact.email),
    phone: readString(contact.phone),
    firstName: readString(contact.firstName) ?? readString(contact.first_name),
    lastName: readString(contact.lastName) ?? readString(contact.last_name),
    name: readString(contact.name) ?? readString(contact.contactName),
    companyName: readString(contact.companyName) ?? readString(contact.company_name),
  };
}

export function mergeContactIdentity(
  primary?: GhlContactIdentity,
  fallback?: GhlContactIdentity
): GhlContactIdentity {
  return {
    email: primary?.email ?? fallback?.email,
    phone: primary?.phone ?? fallback?.phone,
    firstName: primary?.firstName ?? fallback?.firstName,
    lastName: primary?.lastName ?? fallback?.lastName,
    name: primary?.name ?? fallback?.name,
    companyName: primary?.companyName ?? fallback?.companyName,
  };
}

export async function getContactIdentity(
  contactId: string,
  token: string
): Promise<GhlContactIdentity | null> {
  const res = await ghlFetch(`/contacts/${contactId}`, {
    method: "GET",
    token,
  });

  if (!res.ok) {
    throw new Error(`Contact fetch failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as GhlContactResponse & Record<string, unknown>;
  const rawContact = json.contact && typeof json.contact === "object"
    ? json.contact
    : json;

  return readContactIdentity(rawContact);
}

export async function addTagToPatronProContact(contactId: string, tag: string): Promise<void> {
  const patronProLocationId = getPatronProLocationId();
  const token = await getLocationAccessToken(patronProLocationId);
  const res = await ghlFetch(`/contacts/${contactId}/tags`, {
    method: "POST",
    token,
    body: JSON.stringify({ tags: [tag] }),
  });

  if (!res.ok) {
    throw new Error(`PatronPro contact tag add failed: ${res.status} ${await res.text()}`);
  }
}

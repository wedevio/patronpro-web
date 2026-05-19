import type { OnboardingFormData, GHLCustomValue } from "../onboarding/types";
import { ghlFetch } from "./client";

async function listCustomValues(
  locationId: string,
  token: string
): Promise<GHLCustomValue[]> {
  const res = await ghlFetch(`/locations/${locationId}/customValues`, {
    method: "GET",
    token,
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { customValues?: GHLCustomValue[] };
  return json.customValues ?? [];
}

async function upsertCustomValue(
  locationId: string,
  fieldKey: string,
  value: string,
  token: string,
  existingValues: GHLCustomValue[]
): Promise<void> {
  if (!value) return;
  const existing = existingValues.find((v) => v.fieldKey === fieldKey);

  if (existing) {
    await ghlFetch(`/locations/${locationId}/customValues/${existing.id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ value }),
    });
  } else {
    await ghlFetch(`/locations/${locationId}/customValues`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: fieldKey, fieldKey, value }),
    });
  }
}

export async function syncCustomValues(
  locationId: string,
  data: Partial<OnboardingFormData> & { logoUrl?: string },
  token: string
): Promise<void> {
  const existingValues = await listCustomValues(locationId, token);

  const fullAddress = [data.address, data.city, data.state, data.zip, data.country]
    .filter(Boolean)
    .join(", ");

  const domainInfo = JSON.stringify({
    hasDomain: data.hasDomain,
    existingDomain: data.existingDomain,
    wantNewDomain: data.wantNewDomain,
    desiredDomain: data.desiredDomain,
    domainRegistrar: data.domainRegistrar,
  });

  const mappings: Array<[string, string]> = [
    ["business_name", data.businessName ?? ""],
    ["legal_name", data.legalName ?? ""],
    ["business_address", fullAddress],
    ["business_website", data.website ?? ""],
    ["business_phone", data.phone ?? ""],
    ["business_email", data.email ?? ""],
    ["business_ein", data.ein ?? ""],
    ["brand_primary_color", data.primaryColor ?? ""],
    ["brand_secondary_color", data.secondaryColor ?? ""],
    ["domain_info", domainInfo],
    ["brand_logo_url", data.logoUrl ?? ""],
  ];

  await Promise.all(
    mappings.map(([fieldKey, value]) =>
      upsertCustomValue(locationId, fieldKey, value, token, existingValues)
    )
  );
}

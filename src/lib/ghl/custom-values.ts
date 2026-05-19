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

  const mappings: Array<[string, string]> = [
    ["company_name", data.businessName ?? ""],
    ["company_address", fullAddress],
    ["company_phone", data.phone ?? ""],
    ["dominio_web", data.website ?? ""],
    ["logo", data.logoUrl ?? ""],
    ["logo_cuadrado", data.logoUrl ?? ""],
  ].filter(([, value]) => value !== "") as Array<[string, string]>;

  await Promise.all(
    mappings.map(([fieldKey, value]) =>
      upsertCustomValue(locationId, fieldKey, value, token, existingValues)
    )
  );
}

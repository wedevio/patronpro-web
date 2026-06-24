import type { OnboardingFormData, GHLCustomValue, HoursOfOperation } from "../onboarding/types";
import { ghlFetch } from "./client";

export async function listCustomValues(
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

function normalizeFieldKey(fieldKey: string): string {
  return fieldKey.replace(/[{}\s]/g, "").replace(/^custom_values\./, "");
}

export function findCustomValue(
  existingValues: GHLCustomValue[],
  fieldKey: string
): GHLCustomValue | undefined {
  const target = normalizeFieldKey(fieldKey);
  return existingValues.find((value) =>
    normalizeFieldKey(value.fieldKey) === target || normalizeFieldKey(value.name) === target
  );
}

export async function upsertCustomValue(
  locationId: string,
  fieldKey: string,
  value: string,
  token: string,
  existingValues: GHLCustomValue[]
): Promise<boolean> {
  if (!value) return false;
  const existing = findCustomValue(existingValues, fieldKey);

  if (existing) {
    const res = await ghlFetch(`/locations/${locationId}/customValues/${existing.id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ name: existing.name, value }),
    });
    if (!res.ok) {
      console.error(`[customValues] PUT ${fieldKey} failed:`, res.status, await res.text());
      return false;
    } else {
      console.info(`[customValues] PUT ${fieldKey} ok`);
      return true;
    }
  } else {
    const res = await ghlFetch(`/locations/${locationId}/customValues`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: fieldKey, value }),
    });
    if (!res.ok) {
      console.error(`[customValues] POST ${fieldKey} failed:`, res.status, await res.text());
      return false;
    } else {
      console.info(`[customValues] POST ${fieldKey} ok (created)`);
      return true;
    }
  }
}

function formatHours(hours: HoursOfOperation): string {
  const DAY_LABELS: Record<keyof HoursOfOperation, string> = {
    monday: "Lun", tuesday: "Mar", wednesday: "Mié",
    thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
  };

  function fmt(t: string): string {
    const [hh, mm] = t.split(":").map(Number);
    const period = hh >= 12 ? "PM" : "AM";
    const h = hh % 12 || 12;
    return `${h}:${mm.toString().padStart(2, "0")} ${period}`;
  }

  return (Object.keys(DAY_LABELS) as Array<keyof HoursOfOperation>)
    .map((day) => {
      const d = hours[day];
      return d.open
        ? `${DAY_LABELS[day]}: ${fmt(d.from)} - ${fmt(d.to)}`
        : `${DAY_LABELS[day]}: Cerrado`;
    })
    .join(" | ");
}

function deriveDomain(data: Partial<OnboardingFormData>): string {
  if (data.hasDomain && data.existingDomain) return data.existingDomain;
  if (data.wantNewDomain && data.desiredDomain) return data.desiredDomain;
  return "";
}

async function fetchCalendarLinks(
  locationId: string,
  token: string
): Promise<{ onSiteVisit: string; freeConsultation: string }> {
  const result = { onSiteVisit: "", freeConsultation: "" };
  try {
    const res = await ghlFetch(`/calendars/?locationId=${locationId}`, {
      method: "GET",
      token,
    });
    if (!res.ok) return result;
    const json = (await res.json()) as { calendars?: Array<{ id: string; name: string }> };
    const calendars = json.calendars ?? [];

    const BASE = "https://api.getpatronpro.com/widget/booking";

    for (const cal of calendars) {
      const name = cal.name.toLowerCase();
      if (name.includes("on site") || name.includes("on-site")) {
        result.onSiteVisit = `${BASE}/${cal.id}`;
      } else if (name.includes("consultation") || name.includes("consulta")) {
        result.freeConsultation = `${BASE}/${cal.id}`;
      }
    }
  } catch (err) {
    console.error("[customValues] fetchCalendarLinks failed:", err);
  }
  return result;
}

export async function syncCustomValues(
  locationId: string,
  data: Partial<OnboardingFormData> & { logoUrl?: string; logoSquareUrl?: string },
  token: string
): Promise<void> {
  const [existingValues, calendarLinks] = await Promise.all([
    listCustomValues(locationId, token),
    fetchCalendarLinks(locationId, token),
  ]);

  const fullAddress = [data.address, data.city, data.state, data.zip, data.country]
    .filter(Boolean)
    .join(", ");

  const domain = deriveDomain(data);

  const hoursStr = data.hoursOfOperation
    ? formatHours(data.hoursOfOperation)
    : "";

  const mappings: Array<[string, string]> = [
    ["company_name", data.businessName ?? ""],
    ["company_phone", data.phone ?? ""],
    ["company_address", fullAddress],
    ["dominio_web", domain],
    ["logo", data.logoUrl ?? ""],
    ["logo_cuadrado", data.logoSquareUrl ?? data.logoUrl ?? ""],
    ["hours_of_operation", hoursStr],
    ["preferred_platform_language", data.preferredPlatformLanguage ?? ""],
    ["customer_communication_language", data.customerCommunicationLanguage ?? ""],
    ["domain_purchase_authorized", data.authorizeDomainPurchase ? "Sí" : ""],
    // Calendar booking links — auto-detected from location calendars
    ["on_site_visit_calendar", calendarLinks.onSiteVisit],
    ["free_consultation_calendar", calendarLinks.freeConsultation],
  ].filter(([, value]) => value !== "") as Array<[string, string]>;

  await Promise.all(
    mappings.map(([fieldKey, value]) =>
      upsertCustomValue(locationId, fieldKey, value, token, existingValues)
    )
  );
}

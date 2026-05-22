import type { OnboardingFormData, GHLCustomValue, HoursOfOperation } from "../onboarding/types";
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

export async function upsertCustomValue(
  locationId: string,
  fieldKey: string,
  value: string,
  token: string,
  existingValues: GHLCustomValue[]
): Promise<void> {
  if (!value) return;
  // GHL returns fieldKeys like "{{ custom_values.company_name }}" — use includes() to match
  const existing = existingValues.find((v) => v.fieldKey.includes(fieldKey));

  if (existing) {
    const res = await ghlFetch(`/locations/${locationId}/customValues/${existing.id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ name: existing.name, value }),
    });
    if (!res.ok) {
      console.error(`[customValues] PUT ${fieldKey} failed:`, res.status, await res.text());
    } else {
      console.info(`[customValues] PUT ${fieldKey} ok`);
    }
  } else {
    const res = await ghlFetch(`/locations/${locationId}/customValues`, {
      method: "POST",
      token,
      body: JSON.stringify({ name: fieldKey, fieldKey, value }),
    });
    if (!res.ok) {
      console.error(`[customValues] POST ${fieldKey} failed:`, res.status, await res.text());
    } else {
      console.info(`[customValues] POST ${fieldKey} ok (created)`);
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
  data: Partial<OnboardingFormData> & { logoUrl?: string },
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
    ["company_address", fullAddress],
    ["dominio_web", domain],
    ["logo", data.logoUrl ?? ""],
    ["logo_cuadrado", data.logoUrl ?? ""],
    ["hours_of_operation", hoursStr],
    ["domain_purchase_authorized", data.authorizeDomainPurchase ? "Sí" : ""],
    // Brand colors — stored as reference until brand-board API scope is confirmed
    ["brand_color_main", (!data.letUsChooseColors && data.primaryColor) ? data.primaryColor : ""],
    ["brand_color_accent", (!data.letUsChooseColors && data.secondaryColor) ? data.secondaryColor : ""],
    ["brand_color_complementary", (!data.letUsChooseColors && data.complementaryColor) ? data.complementaryColor : ""],
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

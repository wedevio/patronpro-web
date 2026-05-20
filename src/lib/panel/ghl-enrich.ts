import { getAgencyAccessToken, getLocationAccessToken } from "@/lib/ghl/oauth";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const COMPANY_ID = "xv9xdsIAXWMIyGArcnKb";
const PATRONPRO_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";
const ONBOARDING_CALENDAR_ID = "D7x8ts5xcdNOWnd6Pjlq";

export interface GHLLocationData {
  locationId:        string;
  name:              string;
  address:           string;
  phone:             string;
  email:             string;
  website:           string;
  createdAt:         string;
  // Subscription / SaaS
  planName:          string;  // e.g. "Mensual", "Anual", or "—"
  planStatus:        string;  // "active" | "inactive" | "trial" | "—"
  mrr:               number;  // monthly recurring revenue (0 if unknown)
  // Extra GHL data
  phoneNumbers:      string[];  // purchased phone numbers
  twilioActive:      boolean;   // phone system account status = active
  stripeConnected:   boolean;   // inferred from transactions
  customDomain:      string;
  workflowsCount:    number;
  // PatronPro signals
  smsSent:           boolean;   // outbound SMS sent from PatronPro's location
  appointmentDate:   string;    // ISO date of onboarding appointment, "" if none
}

// ─── PatronPro location token (in-memory cache) ──────────────────────────────

let cachedPatronProToken: { token: string; expiresAt: number } | null = null;

async function getPatronProToken(): Promise<string> {
  if (cachedPatronProToken && Date.now() < cachedPatronProToken.expiresAt - 5 * 60 * 1000) {
    return cachedPatronProToken.token;
  }
  const token = await getLocationAccessToken(PATRONPRO_LOCATION_ID);
  // Location tokens are valid for ~24h; cache for 23h
  cachedPatronProToken = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

// ─── PatronPro signals (SMS + appointment) ────────────────────────────────────

async function fetchPatronProSignals(
  email: string,
  patronProToken: string
): Promise<{ smsSent: boolean; appointmentDate: string }> {
  const result = { smsSent: false, appointmentDate: "" };
  if (!email) return result;

  try {
    // 1. Find contact in PatronPro by email → contactId
    // GHL v2 contacts endpoint: GET /contacts/?locationId=...&query=...
    const contactRes = await fetch(
      `${GHL_BASE}/contacts/?locationId=${PATRONPRO_LOCATION_ID}&query=${encodeURIComponent(email)}&limit=1`,
      { headers: { Authorization: `Bearer ${patronProToken}`, Version: GHL_VERSION } }
    );
    if (!contactRes.ok) return result;

    const contactJson = await contactRes.json() as Record<string, unknown>;
    const contacts = (contactJson.contacts as Record<string, unknown>[]) ?? [];
    if (!contacts.length) return result;
    const contactId = contacts[0].id as string;
    if (!contactId) return result;

    // 2 + 3 in parallel: SMS conversation + calendar appointment
    const now = Date.now();
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;

    const [smsRes, apptRes] = await Promise.allSettled([
      fetch(
        `${GHL_BASE}/conversations/search?locationId=${PATRONPRO_LOCATION_ID}&contactId=${contactId}&lastMessageType=TYPE_SMS&limit=1`,
        { headers: { Authorization: `Bearer ${patronProToken}`, Version: GHL_VERSION } }
      ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(
        `${GHL_BASE}/calendars/events?locationId=${PATRONPRO_LOCATION_ID}&calendarId=${ONBOARDING_CALENDAR_ID}&startTime=${now - sixMonthsMs}&endTime=${now + sixMonthsMs}`,
        { headers: { Authorization: `Bearer ${patronProToken}`, Version: GHL_VERSION } }
      ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    if (smsRes.status === "fulfilled" && smsRes.value) {
      const convs = (smsRes.value as Record<string, unknown>).conversations as unknown[];
      result.smsSent = Array.isArray(convs) && convs.length > 0;
    }

    if (apptRes.status === "fulfilled" && apptRes.value) {
      const events = ((apptRes.value as Record<string, unknown>).events as Record<string, unknown>[]) ?? [];
      const match = events.find((e) => e.contactId === contactId);
      result.appointmentDate = match
        ? ((match.startTime as string) ?? (match.dateAdded as string) ?? "found")
        : "";
    }
  } catch {
    // not available — leave defaults
  }

  return result;
}

// ─── SaaS plan name cache ─────────────────────────────────────────────────────

let cachedPlanMap: Map<string, string> | null = null;

async function getSaasPlanMap(agencyToken: string): Promise<Map<string, string>> {
  if (cachedPlanMap) return cachedPlanMap;

  const map = new Map<string, string>();

  // GHL SaaS plan catalog — try known paths
  const endpoints = [
    `/saas-api/company/${COMPANY_ID}/plans`,
    `/saas/company/${COMPANY_ID}/plans`,
    `/saas-api/plans?companyId=${COMPANY_ID}`,
    `/products?locationId=${PATRONPRO_LOCATION_ID}&type=recurring`,
  ];

  for (const path of endpoints) {
    try {
      const res = await fetch(`${GHL_BASE}${path}`, {
        headers: { Authorization: `Bearer ${agencyToken}`, Version: GHL_VERSION },
      });
      if (!res.ok) continue;
      const json = await res.json() as Record<string, unknown>;
      const plans = (json.plans ?? json.data ?? json.products ?? json) as Record<string, unknown>[];
      if (!Array.isArray(plans) || plans.length === 0) continue;
      for (const p of plans) {
        const id   = (p.id ?? p._id ?? p.planId) as string;
        const name = (p.name ?? p.planName ?? p.title) as string;
        if (id && name) map.set(id, name);
      }
      if (map.size > 0) break;
    } catch {
      continue;
    }
  }

  // If all endpoints fail, map stays empty — caller shows truncated ID
  cachedPlanMap = map;
  return map;
}

async function fetchLocation(
  locationId: string,
  agencyToken: string,
  patronProToken: string,
  email: string
): Promise<GHLLocationData> {
  const fallback: GHLLocationData = {
    locationId,
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    createdAt: "",
    planName: "—",
    planStatus: "—",
    mrr: 0,
    phoneNumbers: [],
    stripeConnected: false,
    twilioActive: false,
    customDomain: "",
    workflowsCount: 0,
    smsSent: false,
    appointmentDate: "",
  };

  try {
    const locRes = await fetch(`${GHL_BASE}/locations/${locationId}`, {
      headers: { Authorization: `Bearer ${agencyToken}`, Version: GHL_VERSION },
    });
    if (!locRes.ok) return fallback;

    const json = await locRes.json() as Record<string, unknown>;
    const loc = (json?.location as Record<string, unknown>) ?? json ?? {};

    // Extract SaaS status + plan directly from location object
    const settings     = (loc.settings as Record<string, unknown>) ?? {};
    const saasSettings = (settings.saasSettings as Record<string, unknown>) ?? {};
    const planDetails  = (saasSettings.planDetails as Record<string, unknown>) ?? {};
    const saasMode     = (saasSettings.saasMode as string) ?? "";
    const subStatus    = (planDetails.subscriptionStatus as string) ?? "";
    const saasPlanId   = (saasSettings.saasPlanId as string) ?? "";

    // planStatus: use subscriptionStatus if SaaS is activated, otherwise "—"
    const planStatus = saasMode === "activated" && subStatus ? subStatus : "—";

    const result: GHLLocationData = {
      locationId,
      name:              (loc.name as string) ?? "",
      address:           (loc.address as string) ?? "",
      phone:             (loc.phone as string) ?? "",
      email:             (loc.email as string) ?? "",
      website:           (loc.website as string) ?? "",
      createdAt:         (loc.dateAdded as string) ?? (loc.createdAt as string) ?? "",
      planName:          "—",
      planStatus,
      mrr:               0,
      phoneNumbers:      [],
      stripeConnected:   false,
      twilioActive:      false,
      customDomain:      (loc.customDomain as string) ?? "",
      workflowsCount:    0,
      smsSent:           false,
      appointmentDate:   "",
    };

    // Resolve plan name from cache
    if (saasPlanId) {
      const planMap = await getSaasPlanMap(agencyToken);
      result.planName = planMap.get(saasPlanId) ?? saasPlanId.slice(0, 8) + "…";
    }

    // Run secondary fetches in parallel (plan already extracted from location object)
    const [phonesResult, stripeResult, signalsResult] = await Promise.allSettled([
      fetch(`${GHL_BASE}/phone-system/numbers/location/${locationId}`, {
        headers: { Authorization: `Bearer ${agencyToken}`, Version: "2023-02-21" },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

      // Stripe (inferred from transactions)
      fetch(`${GHL_BASE}/payments/transactions?altId=${locationId}&altType=location&limit=1`, {
        headers: { Authorization: `Bearer ${agencyToken}`, Version: GHL_VERSION },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

      // PatronPro signals (SMS + appointment)
      fetchPatronProSignals(email || result.email, patronProToken),
    ]);

    // SaaS — plan name + status already extracted from location object above
    // (saasSettings in loc.settings — no separate API call needed)

    // Phones
    if (phonesResult.status === "fulfilled" && phonesResult.value) {
      const phonesJson = phonesResult.value as Record<string, unknown>;
      const list = (phonesJson.numbers as Record<string, unknown>[]) ?? [];
      result.phoneNumbers = list.map((p) => (p.phoneNumber as string) ?? "").filter(Boolean);
      result.twilioActive = (phonesJson.accountStatus as string) === "active";
    }

    // Stripe
    if (stripeResult.status === "fulfilled" && stripeResult.value) {
      const txJson = stripeResult.value as Record<string, unknown>;
      const total = (txJson.totalCount as number) ?? 0;
      const list = (txJson.data as unknown[]) ?? [];
      result.stripeConnected = total > 0 || list.length > 0;
    }

    // PatronPro signals
    if (signalsResult.status === "fulfilled") {
      result.smsSent          = signalsResult.value.smsSent;
      result.appointmentDate  = signalsResult.value.appointmentDate;
    }

    return result;
  } catch {
    return fallback;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function enrichLocations(
  locationIds: string[],
  emailMap: Map<string, string> = new Map()
): Promise<Map<string, GHLLocationData>> {
  if (!locationIds.length) return new Map();

  const [agencyToken, patronProToken] = await Promise.all([
    getAgencyAccessToken(),
    getPatronProToken(),
  ]);

  const entries = await Promise.all(
    locationIds.map(async (id) => {
      const email = emailMap.get(id) ?? "";
      const data = await fetchLocation(id, agencyToken, patronProToken, email);
      return [id, data] as [string, GHLLocationData];
    })
  );

  return new Map(entries);
}

export interface GHLSubAccount {
  locationId: string;
  name:       string;
  email:      string;
  phone:      string;
  website:    string;
  createdAt:  string;
}

export async function getAllGHLLocations(): Promise<GHLSubAccount[]> {
  try {
    const token = await getAgencyAccessToken();
    const res = await fetch(
      `${GHL_BASE}/locations/search?companyId=${COMPANY_ID}&limit=100`,
      { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
    );

    if (!res.ok) return [];

    const json = await res.json() as { locations?: Record<string, unknown>[] };
    const locations = json?.locations ?? [];

    return locations.map((loc) => ({
      locationId: (loc.id as string) ?? "",
      name:       (loc.name as string) ?? "",
      email:      (loc.email as string) ?? "",
      phone:      (loc.phone as string) ?? "",
      website:    (loc.website as string) ?? "",
      createdAt:  (loc.dateAdded as string) ?? (loc.createdAt as string) ?? "",
    }));
  } catch {
    return [];
  }
}

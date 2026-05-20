import { getAgencyAccessToken } from "@/lib/ghl/oauth";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const COMPANY_ID = "xv9xdsIAXWMIyGArcnKb";

export interface GHLLocationData {
  locationId:       string;
  name:             string;
  address:          string;
  phone:            string;
  email:            string;
  website:          string;
  createdAt:        string;
  // Subscription / SaaS
  planName:         string;  // e.g. "Mensual", "Anual", or "—"
  planStatus:       string;  // "active" | "inactive" | "trial" | "—"
  mrr:              number;  // monthly recurring revenue (0 if unknown)
  // Extra GHL data
  phoneNumbers:     string[];  // purchased phone numbers
  stripeConnected:  boolean;
  emailConnected:   boolean;
  customDomain:     string;
  workflowsCount:   number;
}

async function fetchLocation(
  locationId: string,
  token: string
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
    emailConnected: false,
    customDomain: "",
    workflowsCount: 0,
  };

  try {
    const res = await fetch(`${GHL_BASE}/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
      },
    });

    if (!res.ok) return fallback;

    const json = await res.json() as Record<string, unknown>;
    const loc = (json?.location as Record<string, unknown>) ?? json ?? {};

    const result: GHLLocationData = {
      locationId,
      name:            (loc.name as string) ?? "",
      address:         (loc.address as string) ?? "",
      phone:           (loc.phone as string) ?? "",
      email:           (loc.email as string) ?? "",
      website:         (loc.website as string) ?? "",
      createdAt:       (loc.dateAdded as string) ?? (loc.createdAt as string) ?? "",
      planName:        "—",
      planStatus:      "—",
      mrr:             0,
      phoneNumbers:    [],
      stripeConnected: false,
      emailConnected:  false,
      customDomain:    (loc.customDomain as string) ?? "",
      workflowsCount:  0,
    };

    // Try to fetch SaaS subscription info
    try {
      const saasRes = await fetch(`${GHL_BASE}/saas/location/${locationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: GHL_VERSION,
        },
      });

      if (saasRes.ok) {
        const saas = await saasRes.json() as Record<string, unknown>;
        result.planName   = (saas.planName as string) ?? (saas.name as string) ?? "—";
        result.planStatus = (saas.status as string) ?? (saas.planStatus as string) ?? "—";
        result.mrr        = (saas.mrr as number) ?? (saas.amount as number) ?? 0;
      }
    } catch {
      // SaaS endpoint not available — leave defaults
    }

    // Try to fetch purchased phone numbers
    try {
      const phonesRes = await fetch(
        `${GHL_BASE}/locations/${locationId}/phoneNumbers`,
        { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
      );
      if (phonesRes.ok) {
        const phonesJson = await phonesRes.json() as Record<string, unknown>;
        const list = (phonesJson.phoneNumbers as Record<string, unknown>[]) ?? [];
        result.phoneNumbers = list.map((p) => (p.phoneNumber as string) ?? "").filter(Boolean);
      }
    } catch {
      // not available — leave empty
    }

    // Try to fetch Stripe / payment integration status
    try {
      const stripeRes = await fetch(
        `${GHL_BASE}/payments/integrations/provider/whitelabel?locationId=${locationId}`,
        { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
      );
      if (stripeRes.ok) {
        const stripeJson = await stripeRes.json() as Record<string, unknown>;
        result.stripeConnected = !!(stripeJson.isConnected ?? stripeJson.connected);
      }
    } catch {
      // not available
    }

    // Try to fetch LC Email / email provider status
    try {
      const emailRes = await fetch(
        `${GHL_BASE}/locations/${locationId}/email/settings`,
        { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
      );
      if (emailRes.ok) {
        const emailJson = await emailRes.json() as Record<string, unknown>;
        result.emailConnected = !!(emailJson.isConnected ?? emailJson.enabled ?? emailJson.fromEmail);
      }
    } catch {
      // not available
    }

    // Try to fetch workflow count
    try {
      const wfRes = await fetch(
        `${GHL_BASE}/workflows?locationId=${locationId}&limit=1`,
        { headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION } }
      );
      if (wfRes.ok) {
        const wfJson = await wfRes.json() as Record<string, unknown>;
        result.workflowsCount = (wfJson.total as number) ?? (wfJson.count as number) ?? 0;
      }
    } catch {
      // not available
    }

    return result;
  } catch {
    return fallback;
  }
}

export async function enrichLocations(
  locationIds: string[]
): Promise<Map<string, GHLLocationData>> {
  if (!locationIds.length) return new Map();

  const token = await getAgencyAccessToken();
  const entries = await Promise.all(
    locationIds.map(async (id) => {
      const data = await fetchLocation(id, token);
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
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: GHL_VERSION,
        },
      }
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

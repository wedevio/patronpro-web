import { NextResponse } from "next/server";
import { getLocationAccessToken, getAgencyAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";

async function gh(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" },
  });
  let body: unknown;
  try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, body };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId)
    return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const [locToken, agencyToken] = await Promise.all([
    getLocationAccessToken(locationId),
    getAgencyAccessToken(),
  ]);

  const [phones, stripe, emailSettings, emailProvider] = await Promise.all([
    gh(`/locations/${locationId}/phoneNumbers`, locToken),
    gh(`/payments/integrations/provider/whitelabel?locationId=${locationId}`, locToken),
    gh(`/locations/${locationId}/email/settings`, locToken),
    gh(`/locations/${locationId}/emailProvider`, locToken),
  ]);

  // Also try with agency token for comparison
  const [phonesAgency, stripeAgency] = await Promise.all([
    gh(`/locations/${locationId}/phoneNumbers`, agencyToken),
    gh(`/payments/integrations/provider/whitelabel?locationId=${locationId}`, agencyToken),
  ]);

  return NextResponse.json({
    phones_loc:     phones,
    phones_agency:  phonesAgency,
    stripe_loc:     stripe,
    stripe_agency:  stripeAgency,
    email_settings: emailSettings,
    email_provider: emailProvider,
  });
}

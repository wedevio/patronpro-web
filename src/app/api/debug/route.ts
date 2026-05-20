import { NextResponse } from "next/server";
import { getLocationAccessToken, getAgencyAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";

async function gh(path: string, token: string, version = "2021-07-28") {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Version: version },
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

  const [locToken] = await Promise.all([
    getLocationAccessToken(locationId),
    getAgencyAccessToken(),
  ]);

  const [phones, transactions, locationFull] = await Promise.all([
    gh(`/phone-system/numbers/location/${locationId}`, locToken, "2023-02-21"),
    gh(`/payments/transactions?altId=${locationId}&altType=location&limit=1`, locToken),
    gh(`/locations/${locationId}`, locToken),
  ]);

  // Extract relevant fields from location to check email
  const locBody = (locationFull.body as Record<string, unknown>);
  const loc = (locBody?.location as Record<string, unknown>) ?? locBody ?? {};
  const emailFields = {
    fromEmail:    loc.fromEmail,
    replyToEmail: loc.replyToEmail,
    settings:     loc.settings,
  };

  return NextResponse.json({
    phones,
    transactions,
    email_fields: emailFields,
  });
}

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

  const CALENDAR_ID = "D7x8ts5xcdNOWnd6Pjlq";
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneYearAhead = now + 365 * 24 * 60 * 60 * 1000;

  const [locToken] = await Promise.all([getLocationAccessToken(locationId)]);
  const agencyToken = await getAgencyAccessToken();

  const [
    // Stripe — try direct integration endpoint with correct params
    stripeV1,
    stripeV2,
    // Location object — check for stripe/payment fields
    locationObj,
    // SMS outbound — search conversations with outbound SMS
    smsOutbound,
    // Appointment in onboarding calendar
    appointment,
  ] = await Promise.all([
    gh(`/payments/integrations/provider/whitelabel?altId=${locationId}&altType=location`, locToken),
    gh(`/payments/integrations/provider/whitelabel?altId=${locationId}&altType=location`, agencyToken),
    gh(`/locations/${locationId}`, locToken),
    gh(`/conversations/search?locationId=${locationId}&lastMessageType=TYPE_SMS&lastMessageDirection=outbound&limit=1`, locToken),
    gh(`/calendars/events?locationId=${locationId}&calendarId=${CALENDAR_ID}&startTime=${oneYearAgo}&endTime=${oneYearAhead}`, agencyToken),
  ]);

  // Extract stripe-related fields from location
  const locBody = (locationObj.body as Record<string, unknown>);
  const loc = (locBody?.location as Record<string, unknown>) ?? locBody ?? {};
  const stripeFields = {
    stripeId: loc.stripeId,
    stripeAccountId: loc.stripeAccountId,
    paymentProvider: loc.paymentProvider,
    stripeLiveMode: loc.stripeLiveMode,
    settings_stripe: (loc.settings as Record<string, unknown>)?.stripe,
    billing: loc.billing,
  };

  return NextResponse.json({
    stripe_v1:    stripeV1,
    stripe_v2:    stripeV2,
    stripe_fields_in_location: stripeFields,
    sms_outbound: smsOutbound,
    appointment,
  });
}

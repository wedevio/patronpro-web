import { NextResponse } from "next/server";
import { getLocationAccessToken, getAgencyAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";
const PATRONPRO_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";
const ONBOARDING_CALENDAR_ID = "D7x8ts5xcdNOWnd6Pjlq";

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
  // locationId = client sub-account, contactId = contact in PatronPro's account
  const locationId = searchParams.get("locationId");
  const contactId = searchParams.get("contactId");
  if (!locationId)
    return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const now = Date.now();
  const oneYearAgo  = now - 365 * 24 * 60 * 60 * 1000;
  const oneYearAhead = now + 365 * 24 * 60 * 60 * 1000;

  const [locToken, patronproToken, agencyToken] = await Promise.all([
    getLocationAccessToken(locationId),
    getLocationAccessToken(PATRONPRO_LOCATION_ID),
    getAgencyAccessToken(),
  ]);

  // Stripe — try integration endpoint + location object fields
  const [stripeIntegration, locationObj, smsOutbound] = await Promise.all([
    gh(`/payments/integrations/provider/whitelabel?altId=${locationId}&altType=location`, locToken),
    gh(`/locations/${locationId}`, locToken),
    gh(`/conversations/search?locationId=${locationId}&lastMessageType=TYPE_SMS&lastMessageDirection=outbound&limit=1`, locToken),
  ]);

  // Appointment — query PatronPro's location by contactId
  const appointmentResults: Record<string, unknown> = {};
  if (contactId) {
    const [apptWithContact, apptWithoutContact] = await Promise.all([
      gh(`/calendars/events?locationId=${PATRONPRO_LOCATION_ID}&calendarId=${ONBOARDING_CALENDAR_ID}&contactId=${contactId}&startTime=${oneYearAgo}&endTime=${oneYearAhead}`, patronproToken),
      gh(`/calendars/events?locationId=${PATRONPRO_LOCATION_ID}&calendarId=${ONBOARDING_CALENDAR_ID}&startTime=${oneYearAgo}&endTime=${oneYearAhead}`, patronproToken),
    ]);
    appointmentResults.with_contactId = apptWithContact;
    appointmentResults.without_contactId_first_results = {
      status: apptWithoutContact.status,
      count: ((apptWithoutContact.body as Record<string,unknown>)?.events as unknown[])?.length ?? 0,
      first: ((apptWithoutContact.body as Record<string,unknown>)?.events as Record<string,unknown>[])?.[0],
    };
  } else {
    appointmentResults.note = "Pass ?contactId= to test appointment lookup. Try with agency token too.";
    const apptAgency = await gh(
      `/calendars/events?locationId=${PATRONPRO_LOCATION_ID}&calendarId=${ONBOARDING_CALENDAR_ID}&startTime=${oneYearAgo}&endTime=${oneYearAhead}`,
      agencyToken
    );
    appointmentResults.agency_token = {
      status: apptAgency.status,
      count: ((apptAgency.body as Record<string,unknown>)?.events as unknown[])?.length ?? 0,
      first: ((apptAgency.body as Record<string,unknown>)?.events as Record<string,unknown>[])?.[0],
    };
  }

  // Extract stripe-related fields from location object
  const locBody = (locationObj.body as Record<string, unknown>);
  const loc = (locBody?.location as Record<string, unknown>) ?? locBody ?? {};
  const stripeFields = {
    stripeId:         loc.stripeId,
    stripeAccountId:  loc.stripeAccountId,
    paymentProvider:  loc.paymentProvider,
    settings_billing: (loc.settings as Record<string,unknown>)?.billing,
    settings_stripe:  (loc.settings as Record<string,unknown>)?.stripe,
    billing:          loc.billing,
  };

  // SaaS endpoint — try with agency token and location token
  const [saasAgency, saasLocation] = await Promise.all([
    gh(`/saas/location/${locationId}`, agencyToken),
    gh(`/saas/location/${locationId}`, locToken),
  ]);

  return NextResponse.json({
    // Full raw location object — all fields visible
    location_raw: loc,
    // SaaS subscription info
    saas_agency_token:   { status: saasAgency.status,   body: saasAgency.body },
    saas_location_token: { status: saasLocation.status, body: saasLocation.body },
    // Rest
    stripe_integration: stripeIntegration,
    stripe_fields_in_location: stripeFields,
    sms_outbound: { status: smsOutbound.status, body: smsOutbound.body },
    appointment: appointmentResults,
  });
}

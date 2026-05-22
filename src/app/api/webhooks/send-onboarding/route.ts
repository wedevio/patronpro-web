/**
 * POST /api/webhooks/send-onboarding
 *
 * Triggered by a GHL Workflow in PatronPro's sub-account.
 * Trigger: Contact Tag Added → "ob-meeting-ok"
 *
 * ─── Workflow setup (PatronPro sub-account) ───────────────────────────────────
 *   Trigger: Contact Tag Added → ob-meeting-ok
 *   Action:  HTTP Webhook → POST
 *            https://getpatronpro.com/api/webhooks/send-onboarding?secret=WEBHOOK_SECRET
 *   Body (Custom):
 *   {
 *     "email":        "{{contact.email}}",
 *     "phone":        "{{contact.phone}}",
 *     "firstName":    "{{contact.first_name}}",
 *     "businessName": "{{contact.company_name}}"
 *   }
 *
 * ─── What this endpoint does ─────────────────────────────────────────────────
 *   1. Recibe el email del cliente desde el workflow
 *   2. Busca en todas las GHL sub-cuentas cuál tiene ese email → locationId
 *   3. Busca el contacto en esa sub-cuenta por email → contactId
 *   4. Arma el link: /onboarding?locationId=...&contactId=...
 *   5. Hace upsert del contacto en PatronPro para mandar desde ahí
 *   6. Manda email + SMS desde PatronPro
 *
 * ─── Required env vars ───────────────────────────────────────────────────────
 *   PATRONPRO_LOCATION_ID   — PatronPro sub-account location ID
 *   PATRONPRO_PHONE_NUMBER  — Número desde el que sale el SMS
 *   WEBHOOK_SECRET          — Appended to URL as ?secret=
 *   NEXT_PUBLIC_APP_URL     — Base URL (ya existe)
 */

import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { getAllGHLLocations } from "@/lib/panel/ghl-enrich";
import { ghlFetch } from "@/lib/ghl/client";
import {
  ONBOARDING_EMAIL_SUBJECT,
  ONBOARDING_EMAIL_HTML,
  ONBOARDING_SMS_TEXT,
  interpolate,
} from "@/lib/onboarding/message-templates";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  email?:        string;
  phone?:        string;
  firstName?:    string;
  businessName?: string;
}

interface GHLContactsResponse {
  contacts?: Array<{ id: string; email?: string }>;
}

interface GHLUpsertResponse {
  contact?: { id: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find the client's sub-account locationId by matching their email */
async function findLocationByEmail(email: string): Promise<string | null> {
  const locations = await getAllGHLLocations();
  const match = locations.find(
    (l) => l.email?.toLowerCase().trim() === email.toLowerCase().trim()
  );
  return match?.locationId ?? null;
}

/** Find or create a contact in the client's sub-account. Always returns a contactId. */
async function findOrCreateContact(
  locationId: string,
  data: { email: string; phone: string; firstName: string; businessName: string },
  token: string
): Promise<string> {
  // Try to find first
  const res = await ghlFetch(
    `/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(data.email)}&limit=1`,
    { method: "GET", token }
  );

  if (res.ok) {
    const json = (await res.json()) as GHLContactsResponse;
    const found = json.contacts?.[0]?.id;
    if (found) return found;
  }

  // Not found → upsert (create)
  console.info("[send-onboarding] contact not found in sub-account — creating:", data.email);
  const upsertRes = await ghlFetch("/contacts/upsert", {
    method: "POST",
    token,
    body: JSON.stringify({
      locationId,
      email:       data.email,
      phone:       data.phone       || undefined,
      firstName:   data.firstName   || undefined,
      companyName: data.businessName || undefined,
    }),
  });

  if (!upsertRes.ok) {
    throw new Error(`Failed to create contact in sub-account: ${upsertRes.status} ${await upsertRes.text()}`);
  }

  const upsertJson = (await upsertRes.json()) as GHLUpsertResponse;
  const id = upsertJson.contact?.id;
  if (!id) throw new Error("Upsert in sub-account returned no contact id");
  return id;
}

/** Upsert client as contact in PatronPro's location so we can send from there */
async function upsertInPatronPro(
  ppLocationId: string,
  data: { email: string; phone: string; firstName: string; businessName: string },
  token: string
): Promise<string> {
  const res = await ghlFetch("/contacts/upsert", {
    method: "POST",
    token,
    body: JSON.stringify({
      locationId:  ppLocationId,
      email:       data.email,
      phone:       data.phone       || undefined,
      firstName:   data.firstName   || undefined,
      companyName: data.businessName || undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Upsert contact failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as GHLUpsertResponse;
  const id = json.contact?.id;
  if (!id) throw new Error("Upsert returned no contact id");
  return id;
}

/** Send email or SMS via GHL Conversations from PatronPro's location */
async function sendMessage(
  params: {
    contactId:   string;
    type:        "Email" | "SMS";
    subject?:    string;
    html?:       string;
    message?:    string;
    fromNumber?: string;
  },
  token: string
): Promise<void> {
  const body: Record<string, string> = {
    type:      params.type,
    contactId: params.contactId,
  };

  if (params.type === "Email") {
    body.subject = params.subject ?? "";
    body.html    = params.html    ?? "";
  } else {
    body.message    = params.message    ?? "";
    body.fromNumber = params.fromNumber ?? "";
  }

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    token,
    body:   JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GHL ${params.type} send failed: ${res.status} ${await res.text()}`);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const secret   = searchParams.get("secret") ?? "";
    const expected = process.env.WEBHOOK_SECRET  ?? "";

    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse ─────────────────────────────────────────────────────────────────
    const payload      = (await request.json()) as WebhookPayload;
    const email        = payload.email?.toLowerCase().trim() ?? "";
    const phone        = payload.phone        ?? "";
    const firstName    = payload.firstName    ?? "ahí";
    const businessName = payload.businessName ?? "";

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // ── Find client's locationId from their email ─────────────────────────────
    const clientLocationId = await findLocationByEmail(email);

    if (!clientLocationId) {
      console.error("[send-onboarding] no location found for email:", email);
      return NextResponse.json(
        { error: `No sub-account found for email: ${email}` },
        { status: 404 }
      );
    }

    // ── Find contactId in client's sub-account ────────────────────────────────
    const clientToken     = await getLocationAccessToken(clientLocationId);
    const clientContactId = await findOrCreateContact(
      clientLocationId,
      { email, phone, firstName, businessName },
      clientToken
    );

    // ── Build onboarding link ─────────────────────────────────────────────────
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpatronpro.com";
    const onboardingLink = `${appUrl}/onboarding?locationId=${clientLocationId}&contactId=${clientContactId}`;

    console.info("[send-onboarding] link built:", onboardingLink);

    // ── PatronPro location token ──────────────────────────────────────────────
    const ppLocationId = process.env.PATRONPRO_LOCATION_ID ?? "hHLZC7FaTtUINPf3cbHd";
    const ppToken      = await getLocationAccessToken(ppLocationId);

    // ── Upsert contact in PatronPro location (needed to send from there) ──────
    const ppContactId = await upsertInPatronPro(
      ppLocationId,
      { email, phone, firstName, businessName },
      ppToken
    );

    const vars = { firstName, businessName, link: onboardingLink };

    // ── Send email ────────────────────────────────────────────────────────────
    await sendMessage(
      {
        contactId: ppContactId,
        type:      "Email",
        subject:   interpolate(ONBOARDING_EMAIL_SUBJECT, vars),
        html:      interpolate(ONBOARDING_EMAIL_HTML,    vars),
      },
      ppToken
    );

    // ── Send SMS ──────────────────────────────────────────────────────────────
    if (phone) {
      await sendMessage(
        {
          contactId:  ppContactId,
          type:       "SMS",
          message:    interpolate(ONBOARDING_SMS_TEXT, vars),
          fromNumber: process.env.PATRONPRO_PHONE_NUMBER ?? "",
        },
        ppToken
      );
    } else {
      console.warn("[send-onboarding] no phone for", email, "— SMS skipped");
    }

    console.info("[send-onboarding] ✅ sent to", email, "→", onboardingLink);

    return NextResponse.json({ success: true, onboardingLink }, { status: 200 });

  } catch (err) {
    console.error("[POST /api/webhooks/send-onboarding]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

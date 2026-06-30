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
 *   ONBOARDING_LINK_SECRET  — HMAC secret for signed onboarding links
 *   NEXT_PUBLIC_APP_URL     — Base URL (ya existe)
 */

import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { getAllGHLLocations } from "@/lib/panel/ghl-enrich";
import { ghlFetch } from "@/lib/ghl/client";
import { getPatronProLocationId } from "@/lib/ghl/contacts";
import { buildOnboardingLink } from "@/lib/onboarding/invite";
import { saveOnboardingLink } from "@/lib/panel/store";
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
  // GHL sends the full contact payload with snake_case keys
  first_name?:   string;
  last_name?:    string;
  full_name?:    string;
  company_name?: string;
  // Legacy: custom body fields (kept for backwards compat)
  firstName?:    string;
  name?:         string;
  businessName?: string;
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
    const expected = process.env.WEBHOOK_SECRET ?? "";

    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate required env vars ───────────────────────────────────────────
    const patronProPhone = process.env.PATRONPRO_PHONE_NUMBER ?? "";
    if (!patronProPhone) {
      console.error("[send-onboarding] PATRONPRO_PHONE_NUMBER env var is not set — cannot send SMS");
      return NextResponse.json({ error: "Server misconfiguration: PATRONPRO_PHONE_NUMBER not set" }, { status: 500 });
    }

    if (!process.env.ONBOARDING_LINK_SECRET) {
      console.error("[send-onboarding] ONBOARDING_LINK_SECRET env var is not set — cannot sign onboarding links");
      return NextResponse.json({ error: "Server misconfiguration: ONBOARDING_LINK_SECRET not set" }, { status: 500 });
    }

    // ── Parse ─────────────────────────────────────────────────────────────────
    const raw = await request.text();
    const payload = JSON.parse(raw) as WebhookPayload;
    const email        = payload.email?.toLowerCase().trim() ?? "";
    const phone        = payload.phone        ?? "";

    // GHL sends snake_case keys in the full contact payload
    const firstName    = (payload.first_name  || payload.firstName || payload.full_name?.split(" ")[0] || "").trim();
    const businessName = (payload.company_name || payload.businessName || "").trim();

    console.info("[send-onboarding] payload received", {
      hasEmail: Boolean(email),
      hasPhone: Boolean(phone),
      hasFirstName: Boolean(firstName),
      hasBusinessName: Boolean(businessName),
    });

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

    // ── Build onboarding link + ensure both contacts exist ───────────────────
    const onboardingInvite = await buildOnboardingLink({
      locationId: clientLocationId,
      email,
      phone,
      firstName,
      businessName,
    });

    // ── PatronPro location token ──────────────────────────────────────────────
    const ppLocationId = getPatronProLocationId();
    const ppToken      = await getLocationAccessToken(ppLocationId);

    const onboardingLink = onboardingInvite.onboardingLink;
    const ppContactId = onboardingInvite.patronProContactId;

    try {
      await saveOnboardingLink(clientLocationId, onboardingInvite.onboardingLink, onboardingInvite.expiresAt);
    } catch (err) {
      console.error("[send-onboarding] link metadata persistence failed", {
        locationId: clientLocationId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    console.info("[send-onboarding] link built", { locationId: clientLocationId, hasSignature: true });

    const vars = { firstName: firstName || "ahí", businessName, link: onboardingLink };

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
    let smsSent = false;
    let smsSkipReason: string | undefined;

    if (!phone) {
      console.warn("[send-onboarding] SMS skipped — no phone", { locationId: clientLocationId, email, contactId: ppContactId });
      smsSkipReason = "no_phone";
    } else {
      await sendMessage(
        {
          contactId:  ppContactId,
          type:       "SMS",
          message:    interpolate(ONBOARDING_SMS_TEXT, vars),
          fromNumber: patronProPhone,
        },
        ppToken
      );
      smsSent = true;
    }

    console.info("[send-onboarding] done", { locationId: clientLocationId, smsSent, smsSkipReason });

    return NextResponse.json(
      { success: true, smsSent, ...(smsSkipReason && { reason: smsSkipReason }) },
      { status: 200 }
    );

  } catch (err) {
    console.error("[POST /api/webhooks/send-onboarding]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

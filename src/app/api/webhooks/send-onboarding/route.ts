/**
 * POST /api/webhooks/send-onboarding
 *
 * Triggered by a GHL Workflow when a contact gets the "ob-pending" tag.
 * Builds the correct onboarding link for the client's sub-account and
 * sends it via GHL Conversations API (email + SMS) from PatronPro's location.
 *
 * ─── Required env vars ───────────────────────────────────────────────────────
 *   PATRONPRO_LOCATION_ID   — PatronPro's own GHL location ID
 *   PATRONPRO_PHONE_NUMBER  — Phone number to send SMS from (e.g. +15551234567)
 *   WEBHOOK_SECRET          — Secret appended to the webhook URL for auth
 *   NEXT_PUBLIC_APP_URL     — Base URL (already set)
 *
 * ─── Required GHL setup ──────────────────────────────────────────────────────
 *   1. Create a Contact custom field in PatronPro's location:
 *      Name: "Client Location ID"  →  fieldKey: contact.client_location_id
 *      Type: TEXT
 *   2. When creating a client sub-account, set this field on the contact
 *      with the sub-account's locationId.
 *   3. Create a Workflow:
 *      Trigger:  Contact Tag Added → tag = "ob-pending"
 *      Action:   Webhook → POST https://[app]/api/webhooks/send-onboarding?secret=[WEBHOOK_SECRET]
 *      Body:     (leave as default — GHL sends full contact object)
 *
 * ─── GHL Webhook payload (Contact Tag Added) ─────────────────────────────────
 * {
 *   "type": "ContactTagUpdate",
 *   "locationId": "<patronpro_location_id>",
 *   "id": "<contactId_in_patronpro_location>",
 *   "email": "client@email.com",
 *   "phone": "+15551234567",
 *   "firstName": "Juan",
 *   "lastName": "García",
 *   "companyName": "Plomería XYZ",
 *   "tags": ["ob-pending"],
 *   "customFields": [
 *     { "id": "...", "value": "<clientLocationId>", "fieldKey": "contact.client_location_id" }
 *   ]
 * }
 */

import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";
import {
  ONBOARDING_EMAIL_SUBJECT,
  ONBOARDING_EMAIL_HTML,
  ONBOARDING_SMS_TEXT,
  interpolate,
} from "@/lib/onboarding/message-templates";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHLCustomField {
  id?:      string;
  value?:   string;
  fieldKey?: string;
  key?:     string; // some versions use "key"
}

interface GHLWebhookPayload {
  type?:         string;
  locationId?:   string;
  id?:           string;       // contactId in PatronPro's location
  contactId?:    string;       // alternate field name
  email?:        string;
  phone?:        string;
  firstName?:    string;
  lastName?:     string;
  name?:         string;
  companyName?:  string;
  tags?:         string[];
  customFields?: GHLCustomField[];
  // Allow passing clientLocationId directly (optional override in workflow body)
  clientLocationId?: string;
}

interface GHLContactSearchResult {
  contacts?: Array<{
    id:         string;
    email?:     string;
    firstName?: string;
    lastName?:  string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractClientLocationId(payload: GHLWebhookPayload): string | null {
  // 1. Direct field (workflow can map it explicitly)
  if (payload.clientLocationId) return payload.clientLocationId;

  // 2. customFields array
  const fields = payload.customFields ?? [];
  for (const f of fields) {
    const key = f.fieldKey ?? f.key ?? "";
    if (key.includes("client_location_id") && f.value) {
      return f.value;
    }
  }
  return null;
}

/**
 * Search for a contact in a given location by email.
 * Returns the contactId if found, null otherwise.
 */
async function findContactInLocation(
  locationId: string,
  email: string,
  token: string
): Promise<string | null> {
  const res = await ghlFetch(
    `/contacts/?locationId=${encodeURIComponent(locationId)}&email=${encodeURIComponent(email)}&limit=1`,
    { method: "GET", token }
  );

  if (!res.ok) {
    console.error("[send-onboarding] contact search failed:", res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as GHLContactSearchResult;
  return json.contacts?.[0]?.id ?? null;
}

/**
 * Send a message via GHL Conversations API from PatronPro's location.
 */
async function sendMessage(
  params: {
    contactId: string;
    type:      "Email" | "SMS";
    subject?:  string;
    html?:     string;
    message?:  string;
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
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[send-onboarding] sendMessage (${params.type}) failed:`, res.status, text);
    throw new Error(`GHL ${params.type} send failed: ${res.status}`);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // ── Auth: verify webhook secret ──────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const secret   = searchParams.get("secret") ?? "";
    const expected = process.env.WEBHOOK_SECRET   ?? "";

    if (!expected) {
      console.warn("[send-onboarding] WEBHOOK_SECRET not set — skipping auth check");
    } else if (secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse payload ────────────────────────────────────────────────────────
    const payload = (await request.json()) as GHLWebhookPayload;

    const ppContactId  = payload.id ?? payload.contactId ?? "";
    const email        = payload.email    ?? "";
    const phone        = payload.phone    ?? "";
    const firstName    = payload.firstName ?? payload.name?.split(" ")[0] ?? "ahí";
    const businessName = payload.companyName ?? "";

    if (!ppContactId || !email) {
      return NextResponse.json(
        { error: "Missing contactId or email in payload" },
        { status: 400 }
      );
    }

    // ── Get client's locationId ──────────────────────────────────────────────
    const clientLocationId = extractClientLocationId(payload);
    if (!clientLocationId) {
      console.error("[send-onboarding] client_location_id custom field missing on contact", ppContactId);
      return NextResponse.json(
        { error: "client_location_id custom field not set on contact" },
        { status: 422 }
      );
    }

    // ── Get PatronPro's location token (to send messages FROM PatronPro) ─────
    const ppLocationId = process.env.PATRONPRO_LOCATION_ID ?? "";
    if (!ppLocationId) {
      throw new Error("Missing PATRONPRO_LOCATION_ID env var");
    }
    const ppToken = await getLocationAccessToken(ppLocationId);

    // ── Find contact in client's sub-account ─────────────────────────────────
    const clientToken     = await getLocationAccessToken(clientLocationId);
    const clientContactId = await findContactInLocation(clientLocationId, email, clientToken);

    if (!clientContactId) {
      console.error("[send-onboarding] contact not found in client location", clientLocationId, email);
      return NextResponse.json(
        { error: `Contact not found in location ${clientLocationId} for email ${email}` },
        { status: 404 }
      );
    }

    // ── Build onboarding URL ──────────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://patronpro-web.vercel.app";
    const onboardingLink = `${appUrl}/onboarding?locationId=${clientLocationId}&contactId=${clientContactId}`;

    const vars = { firstName, businessName, link: onboardingLink };

    // ── Send EMAIL ────────────────────────────────────────────────────────────
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
      const fromNumber = process.env.PATRONPRO_PHONE_NUMBER ?? "";
      await sendMessage(
        {
          contactId:  ppContactId,
          type:       "SMS",
          message:    interpolate(ONBOARDING_SMS_TEXT, vars),
          fromNumber,
        },
        ppToken
      );
    } else {
      console.warn("[send-onboarding] No phone number — skipping SMS for", ppContactId);
    }

    console.info("[send-onboarding] ✅ sent email + SMS to", email, "| link:", onboardingLink);

    return NextResponse.json(
      { success: true, onboardingLink },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/webhooks/send-onboarding]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

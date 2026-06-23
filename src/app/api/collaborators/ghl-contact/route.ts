import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { queryRows } from "@/lib/collaborators/db";
import { ghlFetch } from "@/lib/ghl/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContactRouteRow = {
  person_contact_route_id?: string | null;
  type?: string | null;
  value?: string | null;
  url?: string | null;
  label?: string | null;
};

type ContactBookRow = {
  candidate_id: string;
  canonical_name: string;
  source_lane: string;
  person_id: string;
  full_name: string;
  primary_public_url?: string | null;
  role_taxonomy_key?: string | null;
  contact_book_group?: string | null;
  contact_book_rank?: number | string | null;
  relationship_confidence?: string | null;
  contact_routes?: ContactRouteRow[] | null;
};

type GhlUpsertResponse = {
  contact?: { id?: string };
  id?: string;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function readString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function splitName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "PatronPro", lastName: "Collaborator" };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") || undefined };
}

function routeEmail(route: ContactRouteRow | undefined | null) {
  if (!route || route.type !== "email") return undefined;
  const value = readString(route.value) ?? readString(route.url);
  const email = value?.replace(/^mailto:/i, "").trim();
  return email?.includes("@") ? email : undefined;
}

function routePhone(route: ContactRouteRow | undefined | null) {
  if (!route || route.type !== "phone") return undefined;
  return readString(route.value) ?? undefined;
}

function routeUrl(route: ContactRouteRow | undefined | null) {
  if (!route) return undefined;
  if (!["website", "contact_form", "public_profile", "third_party_profile"].includes(route.type ?? "")) return undefined;
  const url = readString(route.url) ?? readString(route.value);
  return url?.startsWith("http") ? url : undefined;
}

function selectRoute(routes: ContactRouteRow[], routeId?: string | null) {
  if (routeId) {
    const route = routes.find((item) => item.person_contact_route_id === routeId);
    if (!route) throw new ApiError(404, `person_contact_route_id ${routeId} not found`);
    return route;
  }
  return (
    routes.find((route) => route.type === "email") ??
    routes.find((route) => route.type === "phone") ??
    routes.find((route) => route.type === "contact_form") ??
    routes.find((route) => route.type === "website") ??
    routes[0] ??
    null
  );
}

function readLocationId() {
  return (
    process.env.GHL_LOCATION_ID ??
    process.env.GHL_PATRONPRO_LOCATION_ID ??
    process.env.PATRONPRO_LOCATION_ID ??
    null
  );
}

function readGhlToken() {
  return (
    process.env.GHL_PRIVATE_INTEGRATION_TOKEN ??
    process.env.GHL_LOCATION_PIT ??
    process.env.GHL_API_TOKEN ??
    null
  );
}

function canApplyInThisEnvironment() {
  return process.env.PATRONPRO_COLLAB_GHL_SYNC_ENABLED === "true";
}

function summarizeGhlResponse(response: GhlUpsertResponse) {
  const crmContactId = readString(response.contact?.id) ?? readString(response.id);
  return {
    crmContactId,
    crmContactIdPresent: Boolean(crmContactId),
  };
}

async function insertReceipt({
  candidateId,
  personId,
  routeId,
  locationId,
  crmContactId,
  action,
  status,
  dryRun,
  publicPayload,
  responseSummary,
  errorSummary,
}: {
  candidateId: string;
  personId: string;
  routeId?: string | null;
  locationId?: string | null;
  crmContactId?: string | null;
  action: "preview" | "upsert_contact";
  status: "dry_run" | "success" | "failed" | "skipped";
  dryRun: boolean;
  publicPayload: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
  errorSummary?: string | null;
}) {
  const receiptId = `crm_${randomUUID().replace(/-/g, "")}`;
  await queryRows(
    `INSERT INTO patronpro_collab.crm_contact_sync_receipts (
      crm_sync_receipt_id,
      candidate_id,
      person_id,
      person_contact_route_id,
      crm_system,
      crm_location_id,
      crm_contact_id,
      sync_action,
      sync_status,
      dry_run,
      request_payload_public,
      response_summary,
      error_summary,
      created_by
    ) VALUES ($1, $2, $3, $4, 'ghl', $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, 'nextjs-dashboard')`,
    [
      receiptId,
      candidateId,
      personId,
      routeId ?? null,
      locationId ?? null,
      crmContactId ?? null,
      action,
      status,
      dryRun,
      JSON.stringify(publicPayload),
      JSON.stringify(responseSummary),
      errorSummary ?? null,
    ]
  );
  return receiptId;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const candidateId = readString(body.candidateId);
    const personId = readString(body.personId);
    const routeId = readString(body.personContactRouteId);
    const apply = body.apply === true;
    const allowWithoutDirectRoute = body.allowWithoutDirectRoute === true;

    if (!candidateId || !personId) {
      throw new ApiError(400, "candidateId and personId are required");
    }

    const [contact] = await queryRows<ContactBookRow>(
      `SELECT *
       FROM patronpro_collab.candidate_contact_book
       WHERE candidate_id = $1 AND person_id = $2
       LIMIT 1`,
      [candidateId, personId]
    );

    if (!contact) throw new ApiError(404, "Contact not found in candidate contact book");

    const routes = Array.isArray(contact.contact_routes) ? contact.contact_routes : [];
    const selectedRoute = selectRoute(routes, routeId);
    const locationId = readLocationId();
    const selectedEmail = routeEmail(selectedRoute);
    const selectedPhone = routePhone(selectedRoute);
    const email = selectedEmail ?? routes.map(routeEmail).find(Boolean);
    const phone = selectedPhone ?? routes.map(routePhone).find(Boolean);
    const website = routeUrl(selectedRoute) ?? contact.primary_public_url ?? undefined;
    const canApply = Boolean(email || phone || allowWithoutDirectRoute);
    const minimumContactDataStatus = !locationId
      ? "missing_location_id"
      : email || phone
        ? "ready_email_or_phone"
        : allowWithoutDirectRoute
          ? "no_email_or_phone_allowed_by_request"
          : "blocked_missing_email_or_phone";

    let crmName = contact.full_name;
    if (contact.contact_book_group === "public_official_contact" && contact.full_name.toLowerCase().includes("public business contact")) {
      crmName = `${contact.canonical_name} - Public Business Contact`;
    }
    const { firstName, lastName } = splitName(crmName);
    const tags = Array.from(
      new Set([
        "patronpro-collab-research",
        `candidate:${contact.candidate_id}`,
        `lane:${contact.source_lane}`,
        `role:${contact.role_taxonomy_key ?? "unknown"}`,
      ])
    ).sort();
    const apiPayload: Record<string, unknown> = {
      ...(locationId ? { locationId } : {}),
      name: crmName,
      firstName,
      ...(lastName ? { lastName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      source: "PatronPro collaborator research",
      tags,
    };
    const publicPayload = {
      ...apiPayload,
      _patronpro_metadata: {
        candidate_id: contact.candidate_id,
        candidate_name: contact.canonical_name,
        person_id: contact.person_id,
        person_contact_route_id: selectedRoute?.person_contact_route_id ?? null,
        contact_book_group: contact.contact_book_group ?? null,
        contact_book_rank: contact.contact_book_rank ?? null,
        relationship_confidence: contact.relationship_confidence ?? null,
        outreach_guard: "No outreach message is sent by this endpoint.",
      },
      _minimum_contact_data_status: minimumContactDataStatus,
    };
    const payloadHash = createHash("sha256").update(JSON.stringify(publicPayload)).digest("hex");

    if (!apply) {
      const receiptId = await insertReceipt({
        candidateId,
        personId,
        routeId: selectedRoute?.person_contact_route_id,
        locationId,
        action: "preview",
        status: "dry_run",
        dryRun: true,
        publicPayload,
        responseSummary: { minimumContactDataStatus, payloadHash },
      });
      return NextResponse.json({
        applied: false,
        syncStatus: "dry_run",
        receiptId,
        minimumContactDataStatus,
        canApply,
        publicPayload,
      });
    }

    if (!canApplyInThisEnvironment()) {
      throw new ApiError(403, "GHL contact sync is disabled for this deployment");
    }
    if (!locationId) throw new ApiError(400, "Missing GHL location id");
    if (!canApply) throw new ApiError(400, "Contact needs a public email or phone before syncing to GHL");
    const token = readGhlToken();
    if (!token) throw new ApiError(500, "Missing GHL server token");

    const ghlResponse = await ghlFetch("/contacts/upsert", {
      method: "POST",
      token,
      body: JSON.stringify(apiPayload),
    });
    const responseBody = (await ghlResponse.json().catch(() => ({}))) as GhlUpsertResponse;
    if (!ghlResponse.ok) {
      const receiptId = await insertReceipt({
        candidateId,
        personId,
        routeId: selectedRoute?.person_contact_route_id,
        locationId,
        action: "upsert_contact",
        status: "failed",
        dryRun: false,
        publicPayload,
        responseSummary: { statusCode: ghlResponse.status, payloadHash },
        errorSummary: `GHL upsert failed with status ${ghlResponse.status}`,
      });
      return NextResponse.json({ error: "GHL upsert failed", receiptId }, { status: 502 });
    }

    const summary = summarizeGhlResponse(responseBody);
    const receiptId = await insertReceipt({
      candidateId,
      personId,
      routeId: selectedRoute?.person_contact_route_id,
      locationId,
      crmContactId: summary.crmContactId,
      action: "upsert_contact",
      status: "success",
      dryRun: false,
      publicPayload,
      responseSummary: { crmContactIdPresent: summary.crmContactIdPresent, payloadHash },
    });

    return NextResponse.json({
      applied: true,
      syncStatus: "success",
      receiptId,
      minimumContactDataStatus,
      crmContactIdPresent: summary.crmContactIdPresent,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[collaborators/ghl-contact] sync failed", error);
    return NextResponse.json({ error: "Internal GHL contact sync error" }, { status: 500 });
  }
}

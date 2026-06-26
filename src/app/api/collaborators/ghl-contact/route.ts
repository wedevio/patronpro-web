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
  is_direct?: boolean | null;
  is_business_route?: boolean | null;
  verification_status?: string | null;
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
  source_urls?: string[] | null;
  contact_routes?: ContactRouteRow[] | null;
  latest_ghl_contact_id?: string | null;
};

type SocialProfileRow = {
  platform?: string | null;
  canonical_url?: string | null;
  handle?: string | null;
  visible_metric_text?: string | null;
  followers_count?: number | string | null;
  subscribers_count?: number | string | null;
  likes_count?: number | string | null;
  status?: string | null;
  verification_status?: string | null;
  captured_at?: string | null;
};

type GhlUpsertResponse = {
  contact?: { id?: string };
  id?: string;
};

type GhlCustomFieldRow = {
  id?: string | null;
  name?: string | null;
  fieldKey?: string | null;
  key?: string | null;
  dataType?: string | null;
  model?: string | null;
  picklistOptions?: string[] | null;
};

type GhlCustomFieldValue = {
  id?: string;
  key?: string;
  field_value: string;
};

type SocialTouchpoint = {
  url?: string;
  handle?: string;
};

type SocialTouchpointCollection = {
  touchpoints: Record<string, SocialTouchpoint>;
  additionalLines: string[];
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string
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

function routeEmail(route: ContactRouteRow | undefined | null, allowIndirect = true) {
  if (!route || route.type !== "email") return undefined;
  if (!allowIndirect && route.is_direct !== true) return undefined;
  const value = readString(route.value) ?? readString(route.url);
  const email = value?.replace(/^mailto:/i, "").trim();
  return email?.includes("@") ? email : undefined;
}

function routePhone(route: ContactRouteRow | undefined | null, allowIndirect = true) {
  if (!route || route.type !== "phone") return undefined;
  if (!allowIndirect && route.is_direct !== true) return undefined;
  return readString(route.value) ?? undefined;
}

function routeUrl(route: ContactRouteRow | undefined | null) {
  if (!route) return undefined;
  if (!["website", "contact_form", "public_profile", "third_party_profile"].includes(route.type ?? "")) return undefined;
  const url = readString(route.url) ?? readString(route.value);
  return webUrl(url);
}

function routeLine(route: ContactRouteRow) {
  const label = readString(route.label) ?? readString(route.type) ?? "route";
  const value = readString(route.value) ?? readString(route.url);
  if (!value) return null;
  return `${label}: ${value}`;
}

function socialLine(profile: SocialProfileRow) {
  const platform = readString(profile.platform) ?? "social";
  const url = readString(profile.canonical_url);
  const metric = readString(profile.visible_metric_text)
    ?? (profile.followers_count != null ? `${profile.followers_count} followers` : null)
    ?? (profile.subscribers_count != null ? `${profile.subscribers_count} subscribers` : null)
    ?? (profile.likes_count != null ? `${profile.likes_count} likes` : null);
  const status = [readString(profile.status), readString(profile.verification_status)].filter(Boolean).join("/");
  return [platform, url, metric, status ? `(${status})` : null].filter(Boolean).join(" - ");
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function platformFromUrl(value: string | null | undefined) {
  const url = webUrl(value);
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("facebook.com")) return "facebook";
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("x.com") || host.includes("twitter.com")) return "x";
  if (host.includes("tumblr.com")) return "tumblr";
  if (host.includes("pinterest.com")) return "pinterest";
  return null;
}

function canonicalPlatform(value: string | null | undefined) {
  const platform = normalizeLabel(value);
  if (["twitter"].includes(platform)) return "x";
  if (["linked in"].includes(platform)) return "linkedin";
  return platform || null;
}

function handleFromUrl(value: string | null | undefined) {
  const url = webUrl(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const first = parsed.pathname.split("/").filter(Boolean)[0];
    if (!first || ["channel", "company", "in", "people", "share"].includes(first.toLowerCase())) return null;
    return first.startsWith("@") ? first : `@${first}`;
  } catch {
    return null;
  }
}

function socialLabel(platform: string | null, label: string | null | undefined) {
  return [platform ?? "other", readString(label)].filter(Boolean).join(" ");
}

function isCommunityUrl(value: string | null | undefined) {
  const url = webUrl(value);
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("facebook.com") && parsed.pathname.split("/").filter(Boolean)[0]?.toLowerCase() === "groups";
  } catch {
    return false;
  }
}

function socialUrlKey(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return value.toLowerCase();
  }
}

function collectSocialTouchpoints({
  routes,
  socialProfiles,
}: {
  routes: ContactRouteRow[];
  socialProfiles: SocialProfileRow[];
}): SocialTouchpointCollection {
  const byPlatform = new Map<string, SocialTouchpoint>();
  const additionalLines: string[] = [];
  const seenUrls = new Set<string>();
  const pushExtra = (label: string, url: string | undefined) => {
    const key = socialUrlKey(url);
    if (!url || !key || seenUrls.has(key)) return;
    seenUrls.add(key);
    additionalLines.push(`${label}: ${url}`);
  };
  const pushPrimary = (platform: string | null, url: string | undefined, handle: string | null | undefined, label: string | null | undefined) => {
    if (!platform) {
      pushExtra(socialLabel(null, label), url);
      return;
    }
    const current = byPlatform.get(platform) ?? {};
    if (!current.url && !isCommunityUrl(url)) {
      const key = socialUrlKey(url);
      if (key) seenUrls.add(key);
      byPlatform.set(platform, { url: current.url ?? url, handle: current.handle ?? handle ?? undefined });
      return;
    }
    if (handle && !current.handle) byPlatform.set(platform, { ...current, handle });
    if (url && socialUrlKey(url) !== socialUrlKey(current.url)) pushExtra(socialLabel(platform, label), url);
  };
  for (const profile of socialProfiles) {
    const platform = canonicalPlatform(profile.platform) ?? platformFromUrl(profile.canonical_url);
    const url = webUrl(readString(profile.canonical_url));
    const handle = readString(profile.handle) ?? handleFromUrl(url);
    pushPrimary(platform, url, handle, "profile");
  }
  for (const route of routes) {
    const url = webUrl(readString(route.url) ?? readString(route.value));
    const platform = platformFromUrl(url);
    const routeHint = normalizeLabel([route.label, route.type].filter(Boolean).join(" "));
    if (isCommunityUrl(url)) pushExtra("facebook community", url);
    else if (platform) pushPrimary(platform, url, handleFromUrl(url), route.label ?? route.type);
    else if (routeHint.includes("social") || routeHint.includes("community") || routeHint.includes("group")) {
      pushExtra(socialLabel(null, route.label ?? route.type), url);
    }
  }
  return { touchpoints: Object.fromEntries(byPlatform.entries()), additionalLines };
}

function isActiveContactRoute(route: ContactRouteRow) {
  const status = normalizeLabel(route.verification_status);
  return !status.startsWith("superseded") && !status.startsWith("duplicate");
}

function shouldUseCandidateSocialProfiles(contact: ContactBookRow) {
  const group = normalizeLabel(contact.contact_book_group);
  const role = normalizeLabel(contact.role_taxonomy_key);
  const name = normalizeLabel(contact.full_name);
  return group === "public official contact"
    || role === "public business route"
    || name.includes("public business contact");
}

function normalizeGhlLanguage(value: string | null | undefined) {
  const normalized = normalizeLabel(value);
  if (["es", "esp", "espanol", "espanol latino", "spanish"].includes(normalized)) return "Español";
  if (["en", "eng", "english", "ingles"].includes(normalized)) return "English";
  return "English";
}

function readGhlDefaultLanguage(bodyLanguage: string | null) {
  return normalizeGhlLanguage(
    bodyLanguage
      ?? readString(process.env.PATRONPRO_COLLAB_GHL_DEFAULT_LANGUAGE)
      ?? readString(process.env.PATRONPRO_DEFAULT_LANGUAGE)
      ?? "English"
  );
}

async function readGhlResponseDetail(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `status ${response.status}`;
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    return readString(json.message)
      ?? readString(json.error)
      ?? readString(json.msg)
      ?? JSON.stringify(json).slice(0, 400);
  } catch {
    return text.slice(0, 400);
  }
}

async function loadContactCustomFields(token: string, locationId: string) {
  const response = await ghlFetch(`/locations/${encodeURIComponent(locationId)}/customFields`, {
    method: "GET",
    token,
  });
  if (!response.ok) {
    return {
      fields: [] as GhlCustomFieldRow[],
      warning: `GHL custom fields lookup failed (${response.status}); social URLs were saved in the research note only.`,
    };
  }
  const body = (await response.json().catch(() => ({}))) as {
    customFields?: GhlCustomFieldRow[];
    fields?: GhlCustomFieldRow[];
  };
  const fields = (Array.isArray(body.customFields) ? body.customFields : body.fields ?? [])
    .filter((field) => (field.model ?? "contact") === "contact");
  return { fields, warning: null as string | null };
}

function findCustomField(fields: GhlCustomFieldRow[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeLabel).filter(Boolean);
  return fields.find((field) => {
    const values = [field.name, field.fieldKey, field.key].map(normalizeLabel);
    return normalizedCandidates.some((candidate) => values.some((value) => value === candidate || value.includes(candidate)));
  });
}

function makeCustomFieldValue(field: GhlCustomFieldRow | undefined, value: string | undefined) {
  if (!field || !value) return null;
  const id = readString(field.id);
  const key = readString(field.fieldKey) ?? readString(field.key);
  if (!id && !key) return null;
  return {
    ...(id ? { id } : {}),
    ...(key ? { key } : {}),
    field_value: value,
  } satisfies GhlCustomFieldValue;
}

async function buildGhlCustomFields({
  token,
  locationId,
  language,
  socialTouchpoints,
  additionalSocialUrls,
}: {
  token: string;
  locationId: string;
  language: string;
  socialTouchpoints: Record<string, SocialTouchpoint>;
  additionalSocialUrls: string[];
}) {
  const { fields, warning } = await loadContactCustomFields(token, locationId);
  const warnings = warning ? [warning] : [];
  const customFields: GhlCustomFieldValue[] = [];
  const languageField = findCustomField(fields, ["Language", "contact.language"]);
  const languageValue = makeCustomFieldValue(languageField, language);
  if (languageValue) {
    customFields.push(languageValue);
  } else {
    warnings.push("GHL Language custom field was not found; contact sync may fail if the location requires it.");
  }

  const platformFieldNames: Record<string, { url: string[]; handle: string[] }> = {
    facebook: {
      url: ["Facebook Profile URL", "Collaborator Facebook URL", "Facebook URL", "contact.facebook_profile_url", "contact.contactfacebook_profile_url"],
      handle: ["Facebook Handle", "contact.facebook_handle", "contact.contactfacebook_handle"],
    },
    instagram: {
      url: ["Instagram Profile URL", "Collaborator Instagram URL", "Instagram URL", "contact.instagram_profile_url", "contact.contactinstagram_profile_url"],
      handle: ["Instagram Handle", "contact.instagram_handle", "contact.contactinstagram_handle"],
    },
    tiktok: {
      url: ["TikTok Profile URL", "Collaborator TikTok URL", "TikTok URL", "contact.tiktok_profile_url"],
      handle: ["TikTok Handle", "contact.tiktok_handle"],
    },
    youtube: {
      url: ["YouTube Profile URL", "Collaborator YouTube URL", "YouTube URL", "contact.youtube_profile_url"],
      handle: ["YouTube Handle", "contact.youtube_handle"],
    },
    linkedin: {
      url: ["LinkedIn Profile URL", "Collaborator LinkedIn URL", "LinkedIn URL", "contact.linkedin_profile_url"],
      handle: ["LinkedIn Handle", "contact.linkedin_handle"],
    },
    x: {
      url: ["X Profile URL", "Twitter Profile URL", "Collaborator X URL", "X URL", "contact.x_profile_url"],
      handle: ["X Handle", "Twitter Handle", "contact.x_handle"],
    },
    tumblr: {
      url: ["Tumblr Profile URL", "contact.tumblr_profile_url"],
      handle: ["Tumblr Handle", "contact.tumblr_handle"],
    },
    pinterest: {
      url: ["Pinterest Profile URL", "contact.pinterest_profile_url"],
      handle: ["Pinterest Handle", "contact.pinterest_handle"],
    },
  };

  const missingSocialFields: string[] = [];
  for (const [platform, touchpoint] of Object.entries(socialTouchpoints)) {
    const names = platformFieldNames[platform];
    if (!names) continue;
    const urlValue = makeCustomFieldValue(findCustomField(fields, names.url), touchpoint.url);
    const handleValue = makeCustomFieldValue(findCustomField(fields, names.handle), touchpoint.handle);
    if (urlValue) customFields.push(urlValue);
    if (handleValue) customFields.push(handleValue);
    if (touchpoint.url && !urlValue) missingSocialFields.push(`${platform} url`);
    if (touchpoint.handle && !handleValue) missingSocialFields.push(`${platform} handle`);
  }

  if (missingSocialFields.length) {
    warnings.push(`No GHL custom fields matched ${missingSocialFields.join(", ")}; those social touchpoints were saved in the research note.`);
  }

  const additionalValue = additionalSocialUrls.join("\n").slice(0, 3500);
  const additionalField = findCustomField(fields, ["Additional Social / Community URLs", "contact.additional_social_community_urls"]);
  const additionalFieldValue = makeCustomFieldValue(additionalField, additionalValue);
  if (additionalFieldValue) {
    customFields.push(additionalFieldValue);
  } else if (additionalValue) {
    warnings.push("No GHL custom field matched Additional Social / Community URLs; overflow social URLs were saved in the research note.");
  }

  return { customFields, warnings };
}

function buildResearchNote({
  contact,
  routes,
  contactSocialProfiles,
  organizationSocialProfiles,
  selectedRoute,
}: {
  contact: ContactBookRow;
  routes: ContactRouteRow[];
  contactSocialProfiles: SocialProfileRow[];
  organizationSocialProfiles: SocialProfileRow[];
  selectedRoute: ContactRouteRow | null;
}) {
  const routeLines = routes.map(routeLine).filter(Boolean).slice(0, 12);
  const contactSocialLines = contactSocialProfiles.map(socialLine).filter(Boolean).slice(0, 12);
  const organizationSocialLines = organizationSocialProfiles.map(socialLine).filter(Boolean).slice(0, 12);
  const sourceLines = (contact.source_urls ?? []).slice(0, 6);
  return [
    "PatronPro collaborator research contact.",
    `Candidate: ${contact.canonical_name} (${contact.candidate_id})`,
    `Contact: ${contact.full_name}`,
    `Role: ${contact.role_taxonomy_key ?? "unknown"}; group: ${contact.contact_book_group ?? "unknown"}; confidence: ${contact.relationship_confidence ?? "unknown"}`,
    selectedRoute ? `Selected route: ${routeLine(selectedRoute) ?? selectedRoute.person_contact_route_id ?? "selected route"}` : null,
    routeLines.length ? `Public contact routes:\n- ${routeLines.join("\n- ")}` : "Public contact routes: none captured",
    contactSocialLines.length ? `Contact social/profile routes:\n- ${contactSocialLines.join("\n- ")}` : "Contact social/profile routes: none captured",
    organizationSocialLines.length ? `Organization social/profile routes, kept as context only:\n- ${organizationSocialLines.join("\n- ")}` : null,
    sourceLines.length ? `Evidence/source links:\n- ${sourceLines.join("\n- ")}` : null,
    "Guardrail: this sync creates/updates the CRM contact and note only. No outreach, DM, SMS, WhatsApp, email, or workflow trigger was sent by the dashboard.",
  ].filter(Boolean).join("\n\n").slice(0, 6500);
}

function webUrl(value: string | null | undefined) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : undefined;
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
  action: "preview" | "upsert_contact" | "create_contact" | "update_contact";
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
    const bypassReason = readString(body.bypassReason);
    const ghlLanguage = readGhlDefaultLanguage(readString(body.language));

    if (!candidateId || !personId) {
      throw new ApiError(400, "candidateId and personId are required");
    }
    if (allowWithoutDirectRoute && !bypassReason) {
      throw new ApiError(400, "allowWithoutDirectRoute requires bypassReason", "blocked_missing_bypass_reason");
    }

    const [contact] = await queryRows<ContactBookRow>(
      `SELECT *
       FROM patronpro_collab.candidate_contact_book
       WHERE candidate_id = $1 AND person_id = $2
       LIMIT 1`,
      [candidateId, personId]
    );

    if (!contact) throw new ApiError(404, "Contact not found in candidate contact book");

    const routes = Array.isArray(contact.contact_routes) ? contact.contact_routes.filter(isActiveContactRoute) : [];
    const selectedRoute = selectRoute(routes, routeId);
    const candidateSocialProfiles = await queryRows<SocialProfileRow>(
      `SELECT platform, canonical_url, handle, visible_metric_text, followers_count, subscribers_count, likes_count, status, verification_status, captured_at
       FROM patronpro_collab.social_profiles
       WHERE candidate_id = $1
         AND lower(coalesce(status, '')) !~ '^(superseded|duplicate)'
       ORDER BY platform, canonical_url`,
      [candidateId]
    );
    const useCandidateSocialProfiles = shouldUseCandidateSocialProfiles(contact);
    const allowIndirectContactRoutes = useCandidateSocialProfiles;
    const locationId = readLocationId();
    const selectedEmail = routeEmail(selectedRoute, allowIndirectContactRoutes);
    const selectedPhone = routePhone(selectedRoute, allowIndirectContactRoutes);
    const email = selectedEmail ?? routes.map((route) => routeEmail(route, allowIndirectContactRoutes)).find(Boolean);
    const phone = selectedPhone ?? routes.map((route) => routePhone(route, allowIndirectContactRoutes)).find(Boolean);
    const website = routeUrl(selectedRoute) ?? webUrl(readString(contact.primary_public_url));
    const contactSocialProfiles = useCandidateSocialProfiles ? candidateSocialProfiles : [];
    const organizationSocialProfiles = useCandidateSocialProfiles ? [] : candidateSocialProfiles;
    const socialCollection = collectSocialTouchpoints({ routes, socialProfiles: contactSocialProfiles });
    const socialTouchpoints = socialCollection.touchpoints;
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

    const buildPublicPayload = (customFieldWarnings: string[]) => ({
      ...apiPayload,
      _patronpro_metadata: {
        candidate_id: contact.candidate_id,
        candidate_name: contact.canonical_name,
        person_id: contact.person_id,
        person_contact_route_id: selectedRoute?.person_contact_route_id ?? null,
        contact_book_group: contact.contact_book_group ?? null,
        contact_book_rank: contact.contact_book_rank ?? null,
        relationship_confidence: contact.relationship_confidence ?? null,
        ghl_language: ghlLanguage,
        contact_routes: routes.map((route) => ({
          type: route.type ?? null,
          label: route.label ?? null,
          value: route.value ?? null,
          url: route.url ?? null,
        })),
        social_profiles: contactSocialProfiles.map((profile) => ({
          platform: profile.platform ?? null,
          url: profile.canonical_url ?? null,
          handle: profile.handle ?? null,
          visible_metric_text: profile.visible_metric_text ?? null,
          captured_at: profile.captured_at ?? null,
          status: profile.status ?? null,
          verification_status: profile.verification_status ?? null,
        })),
        organization_social_profiles: organizationSocialProfiles.map((profile) => ({
          platform: profile.platform ?? null,
          url: profile.canonical_url ?? null,
          handle: profile.handle ?? null,
          visible_metric_text: profile.visible_metric_text ?? null,
          captured_at: profile.captured_at ?? null,
          status: profile.status ?? null,
          verification_status: profile.verification_status ?? null,
        })),
        social_touchpoints: socialTouchpoints,
        additional_social_urls: socialCollection.additionalLines,
        custom_field_warnings: customFieldWarnings,
        allow_without_direct_route: allowWithoutDirectRoute,
        bypass_reason: allowWithoutDirectRoute ? bypassReason : null,
        outreach_guard: "No outreach message is sent by this endpoint.",
      },
      _minimum_contact_data_status: minimumContactDataStatus,
    });
    let customFieldWarnings: string[] = [];
    let publicPayload = buildPublicPayload(customFieldWarnings);
    let payloadHash = createHash("sha256").update(JSON.stringify(publicPayload)).digest("hex");

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
        responseSummary: { minimumContactDataStatus, payloadHash, allowWithoutDirectRoute, bypassReasonPresent: Boolean(bypassReason) },
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
    if (!canApply) throw new ApiError(400, "Contact needs a public email or phone before syncing to GHL", minimumContactDataStatus);
    const token = readGhlToken();
    if (!token) throw new ApiError(500, "Missing GHL server token");

    const customFieldResult = await buildGhlCustomFields({
      token,
      locationId,
      language: ghlLanguage,
      socialTouchpoints,
      additionalSocialUrls: socialCollection.additionalLines,
    });
    customFieldWarnings = customFieldResult.warnings;
    if (customFieldResult.customFields.length) {
      apiPayload.customFields = customFieldResult.customFields;
    }
    publicPayload = buildPublicPayload(customFieldWarnings);
    payloadHash = createHash("sha256").update(JSON.stringify(publicPayload)).digest("hex");

    const existingNoRouteContactId = !email && !phone && allowWithoutDirectRoute
      ? readString(contact.latest_ghl_contact_id)
      : null;
    if (existingNoRouteContactId) {
      const receiptId = await insertReceipt({
        candidateId,
        personId,
        routeId: selectedRoute?.person_contact_route_id,
        locationId,
        crmContactId: existingNoRouteContactId,
        action: "update_contact",
        status: "skipped",
        dryRun: false,
        publicPayload,
        responseSummary: {
          crmContactIdPresent: true,
          skippedReason: "existing_no_direct_route_contact_reused",
          payloadHash,
          allowWithoutDirectRoute,
          bypassReasonPresent: Boolean(bypassReason),
        },
      });
      return NextResponse.json({
        applied: true,
        syncStatus: "success",
        receiptId,
        minimumContactDataStatus,
        crmContactIdPresent: true,
        noteStatus: "skipped",
        customFieldWarnings,
      });
    }
    const syncAction = !email && !phone && allowWithoutDirectRoute
      ? "create_contact"
      : "upsert_contact";
    const ghlResponse = await ghlFetch(
      syncAction === "create_contact" ? "/contacts/" : "/contacts/upsert",
      {
        method: "POST",
        token,
        body: JSON.stringify(apiPayload),
      }
    );
    const responseBody = (await ghlResponse.clone().json().catch(() => ({}))) as GhlUpsertResponse;
    if (!ghlResponse.ok) {
      const detail = await readGhlResponseDetail(ghlResponse);
      const receiptId = await insertReceipt({
        candidateId,
        personId,
        routeId: selectedRoute?.person_contact_route_id,
        locationId,
        action: syncAction,
        status: "failed",
        dryRun: false,
        publicPayload,
        responseSummary: { statusCode: ghlResponse.status, payloadHash, allowWithoutDirectRoute, bypassReasonPresent: Boolean(bypassReason) },
        errorSummary: `GHL contact sync failed with status ${ghlResponse.status}: ${detail}`,
      });
      return NextResponse.json({
        error: "GHL contact sync failed",
        detail: `GHL rejected the contact: ${detail}`,
        receiptId,
        minimumContactDataStatus,
        customFieldWarnings,
      }, { status: 502 });
    }

    const summary = summarizeGhlResponse(responseBody);
    let noteStatus: "skipped" | "success" | "failed" = "skipped";
    let noteDetail: string | null = null;
    if (summary.crmContactId) {
      const noteResponse = await ghlFetch(`/contacts/${summary.crmContactId}/notes`, {
        method: "POST",
        token,
        body: JSON.stringify({
          body: buildResearchNote({ contact, routes, contactSocialProfiles, organizationSocialProfiles, selectedRoute }),
        }),
      }).catch(() => null);
      noteStatus = noteResponse?.ok ? "success" : "failed";
      if (noteResponse && !noteResponse.ok) {
        noteDetail = await readGhlResponseDetail(noteResponse);
      }
    }
    const receiptId = await insertReceipt({
      candidateId,
      personId,
      routeId: selectedRoute?.person_contact_route_id,
      locationId,
      crmContactId: summary.crmContactId,
      action: syncAction,
      status: "success",
      dryRun: false,
      publicPayload,
      responseSummary: {
        crmContactIdPresent: summary.crmContactIdPresent,
        noteStatus,
        ...(noteDetail ? { noteDetail } : {}),
        payloadHash,
        allowWithoutDirectRoute,
        bypassReasonPresent: Boolean(bypassReason),
      },
    });

    return NextResponse.json({
      applied: true,
      syncStatus: "success",
      receiptId,
      minimumContactDataStatus,
      crmContactIdPresent: summary.crmContactIdPresent,
      noteStatus,
      customFieldWarnings,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({
        error: error.message,
        detail: error.detail,
      }, { status: error.status });
    }
    console.error("[collaborators/ghl-contact] sync failed", error);
    return NextResponse.json({ error: "Internal GHL contact sync error" }, { status: 500 });
  }
}

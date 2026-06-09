#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const DEFAULT_LOCATION_ID = "4cPIvLND9hFAIzWQ1ZbL";
const DEFAULT_CLIENT = "Liverpool Digital";
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const GHL_CALENDAR_VERSION = "2021-04-15";
const GHL_BRAND_BOARD_VERSION = "2023-02-21";
const PATRONPRO_BASE = "https://www.getpatronpro.com";

const CHECKLIST_ITEMS = [
  ["form", "Formulario de onboarding recibido"],
  ["domain", "Dominio conectado / DNS configurado"],
  ["phone", "Numero de telefono asignado en GHL"],
  ["email", "Email de negocio conectado"],
  ["landing", "Landing page publicada"],
  ["calendar", "Calendario configurado"],
  ["stripe", "Stripe conectado"],
  ["client_ok", "Acceso verificado con el cliente"],
];

const CORE_CUSTOM_VALUES = [
  "company_name",
  "company_address",
  "dominio_web",
  "logo",
  "logo_cuadrado",
  "hours_of_operation",
  "domain_purchase_authorized",
  "on_site_visit_calendar",
  "free_consultation_calendar",
];

const LANDING_CUSTOM_VALUES = [
  "company_phone",
  "automation_sender_email",
  "landing_form",
  "website_hero_image",
  "website_about_image",
  "website_contact_image",
];

const PUBLICATION_CUSTOM_VALUES = [
  "landing_published_url",
];

const DEFAULT_DISABLED_PERMISSIONS = [
  "adPublishingEnabled",
  "adPublishingReadOnly",
  "adwordsReportingEnabled",
  "contentAiEnabled",
  "gokollabEnabled",
  "wordpressEnabled",
  "botService",
];

const DEFAULT_BRAND_COLORS = [
  { id: "main", label: "Main", hex: "#471F23" },
  { id: "accent", label: "Accent", hex: "#F69309" },
  { id: "complementary", label: "Complementary", hex: "#2F1417" },
];

function parseArgs(argv) {
  const first = argv[2];
  const args = {
    command: first && !first.startsWith("-") ? first : "qc",
    locationId: DEFAULT_LOCATION_ID,
    client: DEFAULT_CLIENT,
    out: "",
    outDir: "dev/agents/artifacts/doc/test/liverpool-digital",
    apply: false,
  };

  function readFlagValue(index, flag) {
    const value = argv[index + 1];
    if (!value || value.startsWith("-")) throw new Error(`${flag} requires a value.`);
    return value;
  }

  for (let i = first && !first.startsWith("-") ? 3 : 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--location" || arg === "--location-id") args.locationId = readFlagValue(i++, arg);
    else if (arg === "--client") args.client = readFlagValue(i++, arg);
    else if (arg === "--out") args.out = readFlagValue(i++, arg);
    else if (arg === "--out-dir") args.outDir = readFlagValue(i++, arg);
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--help" || arg === "-h") args.command = "help";
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function readSecretEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ghlToken =
    process.env.GHL_LOCATION_PIT ??
    process.env.GHL_MCP ??
    process.env.GHL_AGENCY_ACCESS_TOKEN ??
    "";

  return { supabaseUrl, supabaseKey, ghlToken };
}

function envStatus() {
  const { supabaseUrl, supabaseKey, ghlToken } = readSecretEnv();

  return {
    supabase: {
      ok: Boolean(supabaseUrl && supabaseKey),
      urlConfigured: Boolean(supabaseUrl),
      keyConfigured: Boolean(supabaseKey),
      missing: [
        !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
        !supabaseKey && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean),
    },
    ghl: {
      ok: Boolean(ghlToken),
      missing: ghlToken ? [] : ["GHL_LOCATION_PIT or GHL_MCP or GHL_AGENCY_ACCESS_TOKEN"],
      tokenConfigured: Boolean(ghlToken),
    },
  };
}

function timeoutSignal(ms = 15_000) {
  return AbortSignal.timeout(ms);
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function createResult(id, label, status, evidence = {}, remediation = "") {
  return { id, label, status, evidence, remediation };
}

function normalizeFieldKey(input) {
  return String(input ?? "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, "")
    .replace(/^custom_values\./, "")
    .trim();
}

function normalizeCustomValues(values) {
  const map = new Map();
  const knownKeys = [...CORE_CUSTOM_VALUES, ...LANDING_CUSTOM_VALUES, ...PUBLICATION_CUSTOM_VALUES];
  for (const value of values ?? []) {
    const fieldKey = String(value.fieldKey ?? value.field_key ?? value.name ?? "");
    const name = String(value.name ?? fieldKey);
    const normalizedFieldKey = normalizeFieldKey(fieldKey);
    const normalizedName = normalizeFieldKey(name);
    const raw = value.value ?? "";
    const key = knownKeys.find((item) => normalizedFieldKey === item || normalizedName === item);
    if (key) map.set(key, { ...value, value: raw });
  }
  return map;
}

async function supabaseFetch(path, options = {}) {
  const env = envStatus();
  const secrets = readSecretEnv();
  if (!env.supabase.ok) {
    return { blocked: true, reason: `Missing Supabase env: ${env.supabase.missing.join(", ")}` };
  }

  try {
    const url = `${secrets.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
    const res = await fetch(url, {
      ...options,
      signal: options.signal ?? timeoutSignal(),
      headers: {
        apikey: secrets.supabaseKey,
        Authorization: `Bearer ${secrets.supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers ?? {}),
      },
    });
    const body = await safeJson(res);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      blocked: true,
      reason: err instanceof Error ? err.message : "Supabase request failed",
    };
  }
}

async function ghlFetch(path, options = {}) {
  const env = envStatus();
  const secrets = readSecretEnv();
  if (!env.ghl.ok) {
    return { blocked: true, reason: `Missing GHL token env: ${env.ghl.missing.join(", ")}` };
  }

  try {
    const res = await fetch(`${GHL_BASE}${path}`, {
      ...options,
      signal: options.signal ?? timeoutSignal(),
      headers: {
        Authorization: `Bearer ${secrets.ghlToken}`,
        Version: options.version ?? GHL_VERSION,
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    const body = await safeJson(res);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      blocked: true,
      reason: err instanceof Error ? err.message : "GHL request failed",
    };
  }
}

async function fetchAccount(locationId) {
  const select = "id,location_id,contact_id,onboarding_at,approved_at,account_submissions(*),account_checklist(item_id,checked,checked_at,checked_by),account_websites(status,html,hero_image_url,about_image_url,contact_image_url,images_status,generated_at,updated_at,error_message)";
  const result = await supabaseFetch(`accounts?location_id=eq.${encodeURIComponent(locationId)}&select=${encodeURIComponent(select)}&limit=1`);
  if (result.blocked || !result.ok) return result;
  const account = Array.isArray(result.body) ? result.body[0] : null;
  return { ok: true, body: account ?? null };
}

async function fetchDocPages() {
  return supabaseFetch("doc_pages?select=*&order=position.asc");
}

async function fetchLocation(locationId) {
  return ghlFetch(`/locations/${encodeURIComponent(locationId)}`);
}

async function fetchCustomValues(locationId) {
  return ghlFetch(`/locations/${encodeURIComponent(locationId)}/customValues`);
}

async function fetchCalendars(locationId) {
  return ghlFetch(`/calendars/?locationId=${encodeURIComponent(locationId)}&showDrafted=true`, { version: GHL_CALENDAR_VERSION });
}

async function fetchPhoneNumbers(locationId) {
  return ghlFetch(`/phone-system/numbers/location/${encodeURIComponent(locationId)}`, { version: "2023-02-21" });
}

async function fetchTransactions(locationId) {
  return ghlFetch(`/payments/transactions?altId=${encodeURIComponent(locationId)}&altType=location&limit=1`);
}

async function fetchWorkflows(locationId) {
  return ghlFetch(`/workflows/?locationId=${encodeURIComponent(locationId)}`);
}

async function fetchPublicWebsite(locationId) {
  try {
    const res = await fetch(`${PATRONPRO_BASE}/api/website/${encodeURIComponent(locationId)}`, {
      signal: timeoutSignal(),
      headers: {
        Accept: "application/json",
      },
    });
    const body = await safeJson(res);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      blocked: true,
      reason: err instanceof Error ? err.message : "Public website request failed",
    };
  }
}

async function fetchFunnels(locationId) {
  return ghlFetch(`/funnels/funnel/list?locationId=${encodeURIComponent(locationId)}&limit=50&offset=0`);
}

async function fetchFunnelPages(locationId, funnelId) {
  return ghlFetch(`/funnels/page?locationId=${encodeURIComponent(locationId)}&funnelId=${encodeURIComponent(funnelId)}&limit=20&offset=0`);
}

async function fetchBrandBoards(locationId) {
  return ghlFetch(`/brand-boards/${encodeURIComponent(locationId)}?limit=20&offset=0`, { version: GHL_BRAND_BOARD_VERSION });
}

async function fetchBrandBoard(locationId, brandBoardId) {
  return ghlFetch(`/brand-boards/${encodeURIComponent(locationId)}/${encodeURIComponent(brandBoardId)}`, { version: GHL_BRAND_BOARD_VERSION });
}

async function fetchUsers(companyId, locationId) {
  if (!companyId) {
    return { blocked: true, reason: "Location companyId unavailable; cannot query users." };
  }
  return ghlFetch(`/users/search?companyId=${encodeURIComponent(companyId)}&locationId=${encodeURIComponent(locationId)}`);
}

function latestSubmission(account) {
  const submissions = account?.account_submissions ?? [];
  if (!Array.isArray(submissions) || !submissions.length) return null;
  return [...submissions].sort((a, b) => String(b.submitted_at ?? "").localeCompare(String(a.submitted_at ?? "")))[0];
}

function checklistMap(account) {
  const rows = account?.account_checklist ?? [];
  const map = new Map(CHECKLIST_ITEMS.map(([id]) => [id, false]));
  if (Array.isArray(rows)) {
    for (const row of rows) map.set(String(row.item_id), Boolean(row.checked));
  }
  return map;
}

function firstWebsite(account) {
  const websites = account?.account_websites ?? [];
  if (Array.isArray(websites)) {
    return [...websites].sort((a, b) => {
      const bTime = Date.parse(String(b?.generated_at ?? b?.updated_at ?? ""));
      const aTime = Date.parse(String(a?.generated_at ?? a?.updated_at ?? ""));
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })[0] ?? null;
  }
  return websites ?? null;
}

function websiteFromPublicResult(result) {
  return result?.body?.website ?? null;
}

function hexColorsFromHtml(html) {
  return [...new Set(String(html ?? "").match(/#[0-9a-fA-F]{3,8}\b/g) ?? [])];
}

function normalizeHexColor(value) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!match) return "";
  const hex = match[1];
  const expanded = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex.slice(0, 6);
  return `#${expanded.toUpperCase()}`;
}

function rgbFromHex(hexValue) {
  const hex = normalizeHexColor(hexValue).replace("#", "");
  if (hex.length !== 6) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function brandColorObject(color) {
  const hex = normalizeHexColor(color.hex);
  const rgb = rgbFromHex(hex);
  if (!hex || !rgb) return null;
  const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  return {
    id: color.id,
    label: color.label,
    hex,
    hexa: `${hex}FF`,
    rgb: rgbText,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
  };
}

function brandPaletteFromHtml(html) {
  const htmlColors = new Set(hexColorsFromHtml(html).map(normalizeHexColor).filter(Boolean));
  const palette = DEFAULT_BRAND_COLORS.map((color) => {
    const normalized = normalizeHexColor(color.hex);
    return {
      ...color,
      source: htmlColors.has(normalized) ? "generated_html" : "fallback_default",
    };
  });
  return palette.map(brandColorObject).filter(Boolean);
}

function brandBoardsFromResult(result) {
  const body = result?.body ?? {};
  const boards = body.brandBoards ?? body.boards ?? body.data ?? (Array.isArray(body) ? body : []);
  return Array.isArray(boards) ? boards : [];
}

function brandBoardId(board) {
  return board?._id ?? board?.id ?? "";
}

function colorHexFromBoardColor(color) {
  return normalizeHexColor(color?.hex ?? color?.value ?? color?.hexa ?? "");
}

function brandBoardColorHexes(board) {
  return (Array.isArray(board?.colors) ? board.colors : [])
    .map(colorHexFromBoardColor)
    .filter(Boolean);
}

function brandBoardHasPalette(board, palette) {
  const existing = new Set(brandBoardColorHexes(board));
  return palette.every((color) => existing.has(normalizeHexColor(color.hex)));
}

function brandBoardIsDefault(board) {
  return board?.default === true || board?.isDefault === true;
}

function brandBoardMatchesTarget(board, palette) {
  return brandBoardHasPalette(board, palette) && brandBoardIsDefault(board);
}

function brandBoardSummary(board) {
  return {
    id: brandBoardId(board),
    name: board?.name ?? "",
    default: board?.default ?? board?.isDefault ?? null,
    type: board?.type ?? null,
    colors: (Array.isArray(board?.colors) ? board.colors : []).map((color) => ({
      id: color.id ?? "",
      label: color.label ?? color.name ?? "",
      hex: colorHexFromBoardColor(color),
      rgb: color.rgb ?? "",
      rgba: color.rgba ?? "",
    })),
  };
}

async function hydrateBrandBoards(locationId, boards) {
  const hydrated = [];
  for (const board of boards) {
    const id = brandBoardId(board);
    if (!id || (Array.isArray(board?.colors) && board.colors.length > 0)) {
      hydrated.push(board);
      continue;
    }
    const detailResult = await fetchBrandBoard(locationId, id);
    hydrated.push(detailResult.ok ? detailResult.body : board);
  }
  return hydrated;
}

function locationPayload(locationResult) {
  const body = locationResult?.body ?? {};
  return body.location ?? body;
}

function calendarNames(calendarResult) {
  const calendars = calendarResult?.body?.calendars ?? calendarResult?.body?.data ?? [];
  return Array.isArray(calendars) ? calendars.map((cal) => String(cal.name ?? "")) : [];
}

function calendarItems(calendarResult) {
  const calendars = calendarResult?.body?.calendars ?? calendarResult?.body?.data ?? [];
  return Array.isArray(calendars) ? calendars : [];
}

function calendarIdFromBookingUrl(value) {
  const match = String(value ?? "").match(/\/booking\/([^/?#\s]+)/);
  return match?.[1] ?? "";
}

function targetCalendarIdsFromCustomValues(customValues) {
  return [
    calendarIdFromBookingUrl(customValues?.get("free_consultation_calendar")?.value),
    calendarIdFromBookingUrl(customValues?.get("on_site_visit_calendar")?.value),
  ].filter(Boolean);
}

function targetOnboardingCalendars(calendars, customValues = null) {
  const targetIds = new Set(targetCalendarIdsFromCustomValues(customValues));
  if (targetIds.size > 0) {
    return calendars.filter((calendar) => targetIds.has(String(calendar.id ?? "")));
  }

  return calendars.filter((calendar) => {
    const name = String(calendar.name ?? "");
    return /on[- ]?site/i.test(name) || /consultation|consulta/i.test(name);
  });
}

function teamMemberIds(calendar) {
  return Array.isArray(calendar?.teamMembers)
    ? calendar.teamMembers.map((member) => member?.userId).filter(Boolean)
    : [];
}

function publicUser(user) {
  return {
    id: user.id ?? "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "",
    emailPresent: Boolean(user.email),
  };
}

function calendarSchedulingSummary(calendar) {
  return {
    slotDuration: calendar?.slotDuration ?? null,
    slotDurationUnit: calendar?.slotDurationUnit ?? null,
    slotInterval: calendar?.slotInterval ?? null,
    slotIntervalUnit: calendar?.slotIntervalUnit ?? null,
    allowBookingAfter: calendar?.allowBookingAfter ?? null,
    allowBookingAfterUnit: calendar?.allowBookingAfterUnit ?? null,
    preBuffer: calendar?.preBuffer ?? null,
    preBufferUnit: calendar?.preBufferUnit ?? null,
    slotBuffer: calendar?.slotBuffer ?? null,
    formId: calendar?.formId ?? "",
    openHoursCount: Array.isArray(calendar?.openHours) ? calendar.openHours.length : 0,
    availabilityType: calendar?.availabilityType ?? null,
    autoConfirm: calendar?.autoConfirm ?? null,
  };
}

function transactionCount(txResult) {
  const body = txResult?.body ?? {};
  if (typeof body.totalCount === "number") return body.totalCount;
  if (Array.isArray(body.data)) return body.data.length;
  if (Array.isArray(body.transactions)) return body.transactions.length;
  return 0;
}

function normalizeDomain(value) {
  return String(value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

async function buildQcReport(args) {
  const startedAt = new Date().toISOString();
  const env = envStatus();

  const [accountResult, locationResult, customValuesResult, calendarsResult, phonesResult, txResult, workflowResult, publicWebsiteResult, brandBoardsResult] = await Promise.all([
    fetchAccount(args.locationId),
    fetchLocation(args.locationId),
    fetchCustomValues(args.locationId),
    fetchCalendars(args.locationId),
    fetchPhoneNumbers(args.locationId),
    fetchTransactions(args.locationId),
    fetchWorkflows(args.locationId),
    fetchPublicWebsite(args.locationId),
    fetchBrandBoards(args.locationId),
  ]);

  const account = accountResult.ok ? accountResult.body : null;
  const submission = latestSubmission(account);
  const checklist = checklistMap(account);
  const publicWebsite = websiteFromPublicResult(publicWebsiteResult);
  const website = firstWebsite(account) ?? publicWebsite;
  const location = locationResult.ok ? locationPayload(locationResult) : null;
  const companyId = location?.companyId ?? location?.company_id ?? location?.company?.id ?? "";
  const usersResult = await fetchUsers(companyId, args.locationId);
  const users = usersResult.ok ? (usersResult.body?.users ?? usersResult.body?.data ?? []) : [];
  const customValues = normalizeCustomValues(customValuesResult.ok ? customValuesResult.body?.customValues : []);
  const calendars = calendarNames(calendarsResult);
  const calendarRecords = calendarItems(calendarsResult);
  const onboardingCalendars = targetOnboardingCalendars(calendarRecords, customValues);
  const phones = phonesResult.ok ? (phonesResult.body?.numbers ?? phonesResult.body?.data ?? []) : [];
  const phoneNumbers = Array.isArray(phones) ? phones.map((item) => item.phoneNumber ?? item.number ?? item.phone).filter(Boolean) : [];
  const twilioActive = phonesResult.ok && phonesResult.body?.accountStatus === "active";
  const transactions = txResult.ok ? transactionCount(txResult) : 0;
  const workflows = workflowResult.ok ? (workflowResult.body?.workflows ?? workflowResult.body?.data ?? []) : [];
  const brandBoardList = brandBoardsFromResult(brandBoardsResult);
  const brandBoards = brandBoardsResult.ok ? await hydrateBrandBoards(args.locationId, brandBoardList) : brandBoardList;
  const brandPalette = brandPaletteFromHtml(publicWebsite?.html ?? "");

  const results = [];

  results.push(accountResult.blocked
    ? createResult("supabase_env", "Supabase access", "blocked", { missing: env.supabase.missing }, "Provide Supabase URL and service role key.")
    : accountResult.ok
      ? createResult("supabase_env", "Supabase access", "pass", { urlConfigured: env.supabase.urlConfigured, keyConfigured: env.supabase.keyConfigured })
      : createResult("supabase_env", "Supabase access", "fail", { status: accountResult.status, body: accountResult.body }, "Supabase env exists but API access failed."));

  results.push(locationResult.blocked
    ? createResult("ghl_env", "GHL access", "blocked", { missing: env.ghl.missing }, "Provide a non-rotating GHL PIT/access token.")
    : locationResult.ok
      ? createResult("ghl_env", "GHL access", "pass", { tokenConfigured: env.ghl.tokenConfigured })
      : createResult("ghl_env", "GHL access", "fail", { status: locationResult.status, body: locationResult.body }, "GHL token exists but location read failed."));

  results.push(location
    ? createResult("location_exists", "GHL location exists", "pass", {
        locationId: args.locationId,
        name: location.name ?? "",
        email: location.email ?? "",
        phone: location.phone ?? "",
        website: location.website ?? "",
        customDomain: location.customDomain ?? "",
      })
    : createResult("location_exists", "GHL location exists", locationResult.blocked ? "blocked" : "fail", {
        status: locationResult.status,
        error: locationResult.body,
      }, "Verify location ID and GHL token scope."));

  results.push(submission
    ? createResult("form", "Onboarding submission received", "pass", {
        submittedAt: submission.submitted_at,
        businessName: submission.business_name,
        email: submission.email,
      })
    : createResult("form", "Onboarding submission received", accountResult.blocked ? "blocked" : "fail", {}, "Generate link and submit/seed onboarding data."));

  results.push(account?.contact_id || submission?.contact_id
    ? createResult("contact_ids_known", "Panel contact IDs known", "pass", {
        accountContactId: account?.contact_id ?? "",
        submissionContactId: submission?.contact_id ?? "",
      })
    : createResult("contact_ids_known", "Panel contact IDs known", accountResult.blocked ? "blocked" : "fail", {}, "Generate/submit onboarding link so contact IDs are recorded."));

  const domainValue = customValues.get("dominio_web")?.value ?? submission?.domain ?? "";
  const customDomain = location?.customDomain ?? "";
  const domainReady = Boolean(customDomain && domainValue && normalizeDomain(customDomain) === normalizeDomain(domainValue));
  results.push(domainReady
    ? createResult("domain", "Domain connected / DNS configured", "pass", {
        customDomain,
        dominioWeb: domainValue,
      })
    : createResult("domain", "Domain connected / DNS configured", customValuesResult.blocked || locationResult.blocked ? "blocked" : "fail", {
        customDomain,
        dominioWeb: domainValue,
      }, "Connect DNS/custom domain and ensure customDomain matches dominio_web; DNS/SSL/public reachability still require separate proof."));

  results.push(phoneNumbers.length > 0 && twilioActive
    ? createResult("phone", "Phone number assigned in GHL", "pass", { phoneNumbers, twilioActive })
    : createResult("phone", "Phone number assigned in GHL", phonesResult.blocked ? "blocked" : "fail", {
        status: phonesResult.status,
        phoneNumbers,
        twilioActive,
      }, "Assign GHL phone number and verify active phone-system account status."));

  const automationEmail = customValues.get("automation_sender_email")?.value ?? "";
  results.push((location?.email && automationEmail)
    ? createResult("email", "Business email connected", "pass", {
        locationEmail: location?.email ?? "",
        automationSenderEmail: automationEmail,
      })
    : createResult("email", "Business email connected", customValuesResult.blocked || locationResult.blocked ? "blocked" : "fail", {
        locationEmail: location?.email ?? "",
        automationSenderEmail: automationEmail,
      }, "Connect business email and set automation_sender_email; both are required for pass."));

  const htmlLen = typeof website?.html === "string" ? website.html.length : 0;
  const publicHtmlLen = typeof publicWebsite?.html === "string" ? publicWebsite.html.length : 0;
  const publicImagesReady = Boolean(publicWebsite?.hero_image_url && publicWebsite?.about_image_url && publicWebsite?.contact_image_url);
  const imagesReady = ["website_hero_image", "website_about_image", "website_contact_image"].every((key) => Boolean(customValues.get(key)?.value));
  results.push(publicWebsite?.status === "ready" && publicHtmlLen > 0 && publicImagesReady && imagesReady
    ? createResult("website_generated_assets", "Website HTML/images generated", "pass", {
        source: `${PATRONPRO_BASE}/api/website/${args.locationId}`,
        websiteStatus: publicWebsite.status,
        htmlBytes: publicHtmlLen,
        imagesStatus: publicWebsite.images_status ?? null,
        publicImageUrlsReady: publicImagesReady,
        imageCustomValuesReady: imagesReady,
        colors: hexColorsFromHtml(publicWebsite.html),
      })
    : createResult("website_generated_assets", "Website HTML/images generated", publicWebsiteResult.blocked ? "blocked" : "fail", {
        publicStatus: publicWebsiteResult.status,
        websiteStatus: publicWebsite?.status ?? website?.status ?? null,
        htmlBytes: publicHtmlLen || htmlLen,
        publicImageUrlsReady: publicImagesReady,
        imageCustomValuesReady: imagesReady,
      }, "Generate or repair website HTML/images before attempting GHL publication."));

  const matchingBrandBoard = brandBoards.find((board) => brandBoardMatchesTarget(board, brandPalette));
  results.push(matchingBrandBoard
    ? createResult("brand_board", "Brand Board colors configured", "pass", {
        board: brandBoardSummary(matchingBrandBoard),
        expectedColors: brandPalette.map((color) => ({ id: color.id, label: color.label, hex: color.hex })),
      })
    : createResult("brand_board", "Brand Board colors configured", brandBoardsResult.blocked ? "blocked" : "fail", {
        status: brandBoardsResult.status,
        boardCount: brandBoards.length,
        boards: brandBoards.map(brandBoardSummary),
        expectedColors: brandPalette.map((color) => ({ id: color.id, label: color.label, hex: color.hex })),
      }, "Create or update a Brand Board with the generated website palette and verify by readback."));

  const generatedReady = website?.status === "ready" && htmlLen > 0 && imagesReady;
  const publicationEvidence = customValues.get("landing_published_url")?.value ?? "";
  results.push(generatedReady && publicationEvidence
    ? createResult("landing", "Landing page generated/published", "pass", {
        websiteStatus: website.status,
        htmlBytes: htmlLen,
        imagesStatus: website.images_status,
        imageCustomValuesReady: imagesReady,
        publicationEvidence,
      })
    : createResult("landing", "Landing page generated/published", accountResult.blocked ? "blocked" : "fail", {
        websiteStatus: website?.status ?? null,
        htmlBytes: htmlLen,
        imagesReady,
        publicationEvidence,
        locationWebsite: location?.website ?? "",
      }, "Generate landing HTML/images and add explicit GHL publication evidence; location.website alone is not proof."));

  const hasOnSiteCalendar = calendars.some((name) => /on[- ]?site/i.test(name));
  const hasConsultationCalendar = calendars.some((name) => /consultation|consulta/i.test(name));
  const hasOnSiteValue = Boolean(customValues.get("on_site_visit_calendar")?.value);
  const hasConsultationValue = Boolean(customValues.get("free_consultation_calendar")?.value);
  const mainUser = Array.isArray(users) && users.length === 1 ? users[0] : null;
  const mainUserId = mainUser?.id ?? "";
  const targetCalendarEvidence = onboardingCalendars.map((calendar) => ({
    id: calendar.id,
    name: calendar.name,
    isActive: calendar.isActive === true,
    teamMemberIds: teamMemberIds(calendar),
    calendarType: calendar.calendarType ?? null,
  }));
  const calendarOwnerReady = Boolean(mainUserId)
    && onboardingCalendars.length >= 2
    && onboardingCalendars.every((calendar) => {
      const ids = teamMemberIds(calendar);
      return ids.length === 1 && ids[0] === mainUserId;
    });
  const calendarActivationReady = onboardingCalendars.length >= 2 && onboardingCalendars.every((calendar) => calendar.isActive === true);

  results.push(calendarOwnerReady
    ? createResult("calendar_owner_assignment", "Calendar owner/team member assigned", "pass", {
        mainUser: publicUser(mainUser),
        calendars: targetCalendarEvidence,
      })
    : createResult("calendar_owner_assignment", "Calendar owner/team member assigned", calendarsResult.blocked || usersResult.blocked ? "blocked" : "fail", {
        mainUser: mainUser ? publicUser(mainUser) : null,
        userCount: Array.isArray(users) ? users.length : 0,
        calendars: targetCalendarEvidence,
      }, "Assign the single main user to each onboarding calendar through teamMembers before activation."));

  results.push(calendarActivationReady
    ? createResult("calendar_activation", "Calendars active", "pass", { calendars: targetCalendarEvidence })
    : createResult("calendar_activation", "Calendars active", calendarsResult.blocked ? "blocked" : "fail", {
        calendars: targetCalendarEvidence,
      }, "Activate calendars only after owner assignment and availability/booking rules are confirmed."));

  results.push(hasOnSiteCalendar && hasConsultationCalendar && hasOnSiteValue && hasConsultationValue && calendarOwnerReady && calendarActivationReady
    ? createResult("calendar", "Calendar configured", "pass", {
        calendars,
        onSiteValue: customValues.get("on_site_visit_calendar")?.value ?? "",
        consultationValue: customValues.get("free_consultation_calendar")?.value ?? "",
        ownerAssigned: true,
        active: true,
      })
    : createResult("calendar", "Calendar configured", calendarsResult.blocked ? "blocked" : "fail", {
        calendars,
        hasOnSiteValue,
        hasConsultationValue,
        ownerAssigned: calendarOwnerReady,
        active: calendarActivationReady,
      }, "Verify both calendars, booking custom values, owner assignment, and active state."));

  results.push(transactions > 0
    ? createResult("stripe", "Stripe connected", "pass", { transactionCount: transactions })
    : createResult("stripe", "Stripe connected", txResult.blocked ? "blocked" : "fail", {
        transactionCount: transactions,
        formHasStripeAccount: submission?.has_stripe_account ?? null,
      }, "Connect Stripe or confirm with stronger proof than the form flag."));

  results.push(checklist.get("client_ok")
    ? createResult("client_ok", "Client access verified", "pass", { checked: true })
    : createResult("client_ok", "Client access verified", accountResult.blocked ? "blocked" : "fail", { checked: false }, "Collect explicit client/operator sign-off."));

  results.push(account?.approved_at
    ? createResult("account_approved", "Panel account approved", "pass", { approvedAt: account.approved_at })
    : createResult("account_approved", "Panel account approved", accountResult.blocked ? "blocked" : "fail", {
        approvedAt: account?.approved_at ?? null,
      }, "Approve account only after setup evidence passes."));

  const userList = Array.isArray(users) ? users : [];
  const permissionViolations = userList.flatMap((user) => {
    const permissions = user.permissions ?? {};
    return DEFAULT_DISABLED_PERMISSIONS
      .filter((key) => permissions[key] === true)
      .map((key) => ({ userId: user.id ?? user.email ?? "unknown", permission: key }));
  });
  results.push(userList.length && permissionViolations.length === 0
    ? createResult("staff_permissions", "Default staff permissions disabled", "pass", {
        userCount: userList.length,
        disabledPermissions: DEFAULT_DISABLED_PERMISSIONS,
      })
    : createResult("staff_permissions", "Default staff permissions disabled", usersResult.blocked ? "blocked" : "fail", {
        companyId,
        userCount: userList.length,
        violations: permissionViolations,
      }, "Run or verify default staff permission hardening for this location."));

  const missingCore = CORE_CUSTOM_VALUES.filter((key) => !customValues.get(key)?.value);
  results.push(missingCore.length === 0
    ? createResult("core_custom_values", "Core custom values", "pass", { keys: CORE_CUSTOM_VALUES })
    : createResult("core_custom_values", "Core custom values", customValuesResult.blocked ? "blocked" : "fail", { missing: missingCore }, "Run custom value sync after onboarding data is complete."));

  const landingFormValue = customValues.get("landing_form")?.value ?? "";
  const landingFormGateOk = (!twilioActive && !landingFormValue) || (twilioActive && Boolean(landingFormValue));
  results.push(landingFormGateOk
    ? createResult("landing_form_gate", "Landing form Twilio gate", "pass", {
        twilioActive,
        landingFormPresent: Boolean(landingFormValue),
        deferred: !twilioActive && !landingFormValue,
      })
    : createResult("landing_form_gate", "Landing form Twilio gate", phonesResult.blocked ? "blocked" : "fail", {
        twilioActive,
        landingFormPresent: Boolean(landingFormValue),
      }, "Keep landing_form empty until Twilio/Trust Center is approved; set it only after phone/Twilio approval."));

  const missingLanding = LANDING_CUSTOM_VALUES
    .filter((key) => key !== "landing_form")
    .filter((key) => !customValues.get(key)?.value);
  results.push(missingLanding.length === 0
    ? createResult("landing_custom_values", "Landing custom values excluding deferred form", "pass", {
        keys: LANDING_CUSTOM_VALUES.filter((key) => key !== "landing_form"),
        deferred: ["landing_form"],
      })
    : createResult("landing_custom_values", "Landing custom values excluding deferred form", customValuesResult.blocked ? "blocked" : "fail", {
        missing: missingLanding,
        deferred: ["landing_form"],
      }, "Create only non-deferred custom values used by the landing page; landing_form is gated by Twilio approval."));

  const workflowNames = Array.isArray(workflows) ? workflows.map((workflow) => String(workflow.name ?? workflow.title ?? "")) : [];
  const hasOnboardingWorkflow = workflowNames.some((name) => /onboarding|ob-meeting-ok|send onboarding/i.test(name));
  results.push(hasOnboardingWorkflow
    ? createResult("onboarding_workflow", "Onboarding workflow present", "pass", { workflowNames })
    : createResult("onboarding_workflow", "Onboarding workflow present", workflowResult.blocked ? "blocked" : "fail", { workflowNames }, "Verify GHL workflow trigger tag ob-meeting-ok and webhook body in GHL UI."));

  const criticalActivationIds = ["domain", "phone", "email", "landing", "calendar", "stripe", "client_ok", "landing_form_gate"];
  const criticalRows = results.filter((row) => criticalActivationIds.includes(row.id));
  const criticalReady = criticalRows.every((row) => row.status === "pass");
  results.push(account?.approved_at && criticalReady
    ? createResult("account_activation_gate", "Final account activation gate", "pass", {
        approvedAt: account.approved_at,
        criticalIds: criticalActivationIds,
      })
    : createResult("account_activation_gate", "Final account activation gate", accountResult.blocked ? "blocked" : "fail", {
        approvedAt: account?.approved_at ?? null,
        criticalStatuses: Object.fromEntries(criticalRows.map((row) => [row.id, row.status])),
      }, "Do not activate/approve access until all critical setup, Twilio/form, Stripe, calendar, landing, and client sign-off gates pass."));

  const statusCounts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    metadata: {
      client: args.client,
      locationId: args.locationId,
      generatedAt: startedAt,
      command: "qc",
      dryRun: true,
    },
    env: {
      supabase: { ok: env.supabase.ok, missing: env.supabase.missing },
      ghl: { ok: env.ghl.ok, missing: env.ghl.missing },
    },
    statusCounts,
    checklist: Object.fromEntries([...checklist.entries()]),
    results,
  };
}

function plannedActionsFromReport(report) {
  const actions = [];
  for (const row of report.results) {
    if (row.status === "pass") continue;
    actions.push({
      id: row.id,
      status: row.status,
      action: row.remediation || `Resolve ${row.label}`,
      evidence: row.evidence,
      applyMode: "manual-review-required",
    });
  }
  return {
    metadata: {
      ...report.metadata,
      command: "plan",
      generatedAt: new Date().toISOString(),
    },
    summary: {
      totalActions: actions.length,
      liveMutationAllowed: false,
      note: "This plan is dry-run output. No mutation is performed by this command.",
    },
    actions,
  };
}

async function buildWebsiteAssetsReport(args) {
  const generatedAt = new Date().toISOString();
  const [publicWebsiteResult, customValuesResult, funnelsResult] = await Promise.all([
    fetchPublicWebsite(args.locationId),
    fetchCustomValues(args.locationId),
    fetchFunnels(args.locationId),
  ]);

  const publicWebsite = websiteFromPublicResult(publicWebsiteResult);
  const html = String(publicWebsite?.html ?? "");
  const customValues = normalizeCustomValues(customValuesResult.ok ? customValuesResult.body?.customValues : []);
  const funnels = Array.isArray(funnelsResult.body?.funnels) ? funnelsResult.body.funnels : [];
  const websites = funnels.filter((funnel) => funnel.type === "website");
  const targetWebsite = websites.find((funnel) => /construction company/i.test(String(funnel.name ?? ""))) ?? websites[0] ?? null;
  const pagesResult = targetWebsite?._id ? await fetchFunnelPages(args.locationId, targetWebsite._id) : null;
  const pages = Array.isArray(pagesResult?.body) ? pagesResult.body : [];
  const homePage = pages.find((page) => /home/i.test(String(page.name ?? ""))) ?? null;

  return {
    metadata: {
      client: args.client,
      locationId: args.locationId,
      generatedAt,
      command: "website-assets",
      dryRun: true,
    },
    publicWebsite: {
      ok: publicWebsiteResult.ok,
      status: publicWebsiteResult.status,
      endpoint: `${PATRONPRO_BASE}/api/website/${args.locationId}`,
      websiteStatus: publicWebsite?.status ?? null,
      imagesStatus: publicWebsite?.images_status ?? null,
      htmlBytes: html.length,
      colors: hexColorsFromHtml(html),
      heroImageUrl: publicWebsite?.hero_image_url ?? "",
      aboutImageUrl: publicWebsite?.about_image_url ?? "",
      contactImageUrl: publicWebsite?.contact_image_url ?? "",
      html,
    },
    ghlCustomValues: {
      ok: customValuesResult.ok,
      status: customValuesResult.status,
      imageValues: {
        website_hero_image: customValues.get("website_hero_image")?.value ?? "",
        website_about_image: customValues.get("website_about_image")?.value ?? "",
        website_contact_image: customValues.get("website_contact_image")?.value ?? "",
      },
      publicationEvidence: customValues.get("landing_published_url")?.value ?? "",
      landingFormDeferred: !customValues.get("landing_form")?.value,
    },
    ghlWebsiteInventory: {
      ok: funnelsResult.ok,
      status: funnelsResult.status,
      websiteCount: websites.length,
      targetWebsite: targetWebsite ? {
        id: targetWebsite._id ?? targetWebsite.id ?? "",
        name: targetWebsite.name ?? "",
        type: targetWebsite.type ?? "",
        url: targetWebsite.url ?? "",
        stepCount: Array.isArray(targetWebsite.steps) ? targetWebsite.steps.length : 0,
      } : null,
      pagesStatus: pagesResult?.status ?? null,
      pages: pages.map((page) => ({
        id: page._id ?? page.id ?? "",
        name: page.name ?? "",
        stepId: page.stepId ?? "",
        updatedAt: page.updatedAt ?? "",
      })),
      homePage: homePage ? {
        id: homePage._id ?? homePage.id ?? "",
        name: homePage.name ?? "",
        stepId: homePage.stepId ?? "",
        updatedAt: homePage.updatedAt ?? "",
      } : null,
    },
    publicationAutomation: {
      apiWriteEndpointDocumented: false,
      status: "not_proven",
      note: "Official HighLevel funnels docs in this workspace expose funnel/page list endpoints, but no documented page content update/publish endpoint for replacing the GHL Custom HTML block.",
      browserFallbackBead: "ppweb-elk.7",
    },
  };
}

async function buildCalendarOwnerPlan(args) {
  const generatedAt = new Date().toISOString();
  const locationResult = await fetchLocation(args.locationId);
  const location = locationResult.ok ? locationPayload(locationResult) : null;
  const companyId = location?.companyId ?? location?.company_id ?? location?.company?.id ?? "";
  const [usersResult, calendarsResult, customValuesResult] = await Promise.all([
    fetchUsers(companyId, args.locationId),
    fetchCalendars(args.locationId),
    fetchCustomValues(args.locationId),
  ]);

  const users = usersResult.ok ? (usersResult.body?.users ?? usersResult.body?.data ?? []) : [];
  const customValues = normalizeCustomValues(customValuesResult.ok ? customValuesResult.body?.customValues : []);
  const calendars = calendarItems(calendarsResult);
  const targetCalendarIds = targetCalendarIdsFromCustomValues(customValues);
  const onboardingCalendars = targetOnboardingCalendars(calendars, customValues);
  const mainUser = Array.isArray(users) && users.length === 1 ? users[0] : null;
  const mainUserId = mainUser?.id ?? "";
  const blockers = [];

  if (locationResult.blocked || !locationResult.ok) blockers.push("GHL location read failed.");
  if (usersResult.blocked || !usersResult.ok) blockers.push("GHL users read failed.");
  if (calendarsResult.blocked || !calendarsResult.ok) blockers.push("GHL calendars read failed.");
  if (customValuesResult.blocked || !customValuesResult.ok) blockers.push("GHL custom values read failed.");
  if (!mainUserId) blockers.push(`Expected exactly one location user, found ${Array.isArray(users) ? users.length : 0}.`);
  if (targetCalendarIds.length < 2) blockers.push(`Expected 2 target calendar IDs from booking custom values, found ${targetCalendarIds.length}.`);
  if (onboardingCalendars.length !== targetCalendarIds.length) blockers.push(`Expected ${targetCalendarIds.length} target calendars by exact custom value IDs, found ${onboardingCalendars.length}.`);

  const plannedCalendars = onboardingCalendars.map((calendar) => {
    const currentTeamMemberIds = teamMemberIds(calendar);
    const hasDifferentMember = currentTeamMemberIds.some((id) => id !== mainUserId);
    const alreadyAssigned = currentTeamMemberIds.length === 1 && currentTeamMemberIds[0] === mainUserId;
    const hasUnsafeExistingMembers = currentTeamMemberIds.length > 0 && !alreadyAssigned;
    const eligible = Boolean(mainUserId) && !hasDifferentMember && !hasUnsafeExistingMembers;
    return {
      id: calendar.id,
      name: calendar.name,
      calendarType: calendar.calendarType ?? null,
      isActive: calendar.isActive === true,
      currentTeamMemberIds,
      targetTeamMembers: mainUserId ? [{ userId: mainUserId }] : [],
      alreadyAssigned,
      eligible,
      scheduling: calendarSchedulingSummary(calendar),
      reason: hasDifferentMember
        ? "Calendar already has a different assigned team member; refusing to overwrite automatically."
        : hasUnsafeExistingMembers
          ? "Calendar has an unexpected existing team member shape; refusing to reduce or rewrite automatically."
          : "",
    };
  });

  return {
    metadata: {
      client: args.client,
      locationId: args.locationId,
      generatedAt,
      command: "assign-calendar-owner",
      dryRun: !args.apply,
    },
    preconditions: {
      ok: blockers.length === 0 && plannedCalendars.every((calendar) => calendar.eligible),
      blockers,
      mainUser: mainUser ? publicUser(mainUser) : null,
      userCount: Array.isArray(users) ? users.length : 0,
      targetCalendarIds,
    },
    calendars: plannedCalendars,
    plannedAction: "Set teamMembers to the single main user for each onboarding calendar. Calendar activation is intentionally separate.",
  };
}

async function buildCalendarActivationPlan(args) {
  const ownerPlan = await buildCalendarOwnerPlan(args);
  return {
    ...ownerPlan,
    metadata: {
      ...ownerPlan.metadata,
      command: "activate-calendars",
      dryRun: !args.apply,
    },
    preconditions: {
      ...ownerPlan.preconditions,
      ok: ownerPlan.preconditions.ok && ownerPlan.calendars.every((calendar) => calendar.alreadyAssigned),
      blockers: [
        ...ownerPlan.preconditions.blockers,
        ...ownerPlan.calendars
          .filter((calendar) => !calendar.alreadyAssigned)
          .map((calendar) => `${calendar.name} is not assigned to the single main user; run assign-calendar-owner first.`),
      ],
    },
    calendars: ownerPlan.calendars.map((calendar) => ({
      ...calendar,
      alreadyActive: calendar.isActive === true,
      targetIsActive: true,
    })),
    plannedAction: "Set isActive to true for each exact onboarding calendar. Owner/teamMembers remain unchanged.",
  };
}

async function assignCalendarOwner(args) {
  const plan = await buildCalendarOwnerPlan(args);
  if (!args.apply) {
    return {
      ...plan,
      status: "dry_run",
      note: "No GHL mutation performed. Re-run with --apply to assign the calendar owner/team member.",
    };
  }

  if (!plan.preconditions.ok) {
    return {
      ...plan,
      status: "blocked",
      note: "No GHL mutation performed because preconditions failed.",
    };
  }

  const updates = [];
  for (const calendar of plan.calendars) {
    if (calendar.alreadyAssigned) {
      updates.push({ id: calendar.id, name: calendar.name, status: "skipped", reason: "already assigned" });
      continue;
    }

    const result = await ghlFetch(`/calendars/${encodeURIComponent(calendar.id)}`, {
      method: "PUT",
      version: GHL_CALENDAR_VERSION,
      body: JSON.stringify({
        teamMembers: calendar.targetTeamMembers,
      }),
    });
    updates.push({
      id: calendar.id,
      name: calendar.name,
      status: result.ok ? "updated" : "failed",
      statusCode: result.status,
      error: result.ok ? null : result.body,
    });
  }

  const verificationResult = await fetchCalendars(args.locationId);
  const targetIdSet = new Set(plan.preconditions.targetCalendarIds);
  const verificationCalendars = calendarItems(verificationResult)
    .filter((calendar) => targetIdSet.has(String(calendar.id ?? "")))
    .map((calendar) => ({
    id: calendar.id,
    name: calendar.name,
    isActive: calendar.isActive === true,
    teamMemberIds: teamMemberIds(calendar),
  }));
  const expectedUserId = plan.preconditions.mainUser?.id ?? "";
  const verified = verificationResult.ok && verificationCalendars.length === targetIdSet.size && targetIdSet.size >= 2 && verificationCalendars.every((calendar) => {
    return calendar.teamMemberIds.length === 1 && calendar.teamMemberIds[0] === expectedUserId;
  });

  return {
    ...plan,
    metadata: {
      ...plan.metadata,
      dryRun: false,
    },
    status: verified ? "pass" : "fail",
    updates,
    verification: {
      ok: verified,
      status: verificationResult.status,
      calendars: verificationCalendars,
    },
  };
}

async function activateCalendars(args) {
  const plan = await buildCalendarActivationPlan(args);
  if (!args.apply) {
    return {
      ...plan,
      status: "dry_run",
      note: "No GHL mutation performed. Re-run with --apply to activate the onboarding calendars.",
    };
  }

  if (!plan.preconditions.ok) {
    return {
      ...plan,
      status: "blocked",
      note: "No GHL mutation performed because preconditions failed.",
    };
  }

  const updates = [];
  for (const calendar of plan.calendars) {
    if (calendar.alreadyActive) {
      updates.push({ id: calendar.id, name: calendar.name, status: "skipped", reason: "already active" });
      continue;
    }

    const result = await ghlFetch(`/calendars/${encodeURIComponent(calendar.id)}`, {
      method: "PUT",
      version: GHL_CALENDAR_VERSION,
      body: JSON.stringify({
        isActive: true,
      }),
    });
    updates.push({
      id: calendar.id,
      name: calendar.name,
      status: result.ok ? "updated" : "failed",
      statusCode: result.status,
      error: result.ok ? null : result.body,
    });
  }

  const verificationResult = await fetchCalendars(args.locationId);
  const targetIdSet = new Set(plan.preconditions.targetCalendarIds);
  const expectedUserId = plan.preconditions.mainUser?.id ?? "";
  const verificationCalendars = calendarItems(verificationResult)
    .filter((calendar) => targetIdSet.has(String(calendar.id ?? "")))
    .map((calendar) => ({
      id: calendar.id,
      name: calendar.name,
      isActive: calendar.isActive === true,
      teamMemberIds: teamMemberIds(calendar),
      scheduling: calendarSchedulingSummary(calendar),
    }));
  const verified = verificationResult.ok && verificationCalendars.length === targetIdSet.size && targetIdSet.size >= 2 && verificationCalendars.every((calendar) => {
    return calendar.isActive === true && calendar.teamMemberIds.length === 1 && calendar.teamMemberIds[0] === expectedUserId;
  });

  return {
    ...plan,
    metadata: {
      ...plan.metadata,
      dryRun: false,
    },
    status: verified ? "pass" : "fail",
    updates,
    verification: {
      ok: verified,
      status: verificationResult.status,
      calendars: verificationCalendars,
    },
  };
}

async function buildBrandBoardPlan(args) {
  const generatedAt = new Date().toISOString();
  const [publicWebsiteResult, brandBoardsResult] = await Promise.all([
    fetchPublicWebsite(args.locationId),
    fetchBrandBoards(args.locationId),
  ]);
  const publicWebsite = websiteFromPublicResult(publicWebsiteResult);
  const palette = brandPaletteFromHtml(publicWebsite?.html ?? "");
  const boardList = brandBoardsFromResult(brandBoardsResult);
  const boards = brandBoardsResult.ok ? await hydrateBrandBoards(args.locationId, boardList) : boardList;
  const matchingBoard = boards.find((board) => brandBoardMatchesTarget(board, palette));
  const paletteOnlyBoard = boards.find((board) => brandBoardHasPalette(board, palette));
  const namedBoard = boards.find((board) => String(board?.name ?? "").trim().toLowerCase() === String(args.client).trim().toLowerCase());
  const targetBoard = matchingBoard ?? paletteOnlyBoard ?? namedBoard ?? boards[0] ?? null;
  const targetBoardId = brandBoardId(targetBoard);
  const blockers = [];

  if (publicWebsiteResult.blocked || !publicWebsiteResult.ok) blockers.push("Generated website read failed; cannot derive brand palette.");
  if (brandBoardsResult.blocked || !brandBoardsResult.ok) blockers.push("Brand Boards read failed.");
  if (palette.length !== DEFAULT_BRAND_COLORS.length) blockers.push(`Expected ${DEFAULT_BRAND_COLORS.length} valid brand colors, found ${palette.length}.`);

  const action = matchingBoard ? "noop" : targetBoardId ? "update" : "create";
  const createPayload = {
    locationId: args.locationId,
    name: args.client,
    colors: palette,
    default: true,
  };
  const updatePayload = {
    name: targetBoard?.name || args.client,
    colors: palette,
    default: true,
  };

  return {
    metadata: {
      client: args.client,
      locationId: args.locationId,
      generatedAt,
      command: "apply-brand-board",
      dryRun: !args.apply,
    },
    preconditions: {
      ok: blockers.length === 0,
      blockers,
      publicWebsiteStatus: publicWebsiteResult.status,
      brandBoardsStatus: brandBoardsResult.status,
      htmlBytes: String(publicWebsite?.html ?? "").length,
    },
    current: {
      boardCount: boards.length,
      boards: boards.map(brandBoardSummary),
    },
    palette: palette.map((color) => ({ id: color.id, label: color.label, hex: color.hex, rgb: color.rgb, rgba: color.rgba })),
    plannedAction: {
      action,
      endpoint: action === "create"
        ? "POST /brand-boards/"
        : action === "update"
          ? `PATCH /brand-boards/${args.locationId}/${targetBoardId}`
          : "none",
      targetBoard: targetBoard ? brandBoardSummary(targetBoard) : null,
      payload: action === "create" ? createPayload : action === "update" ? updatePayload : null,
    },
  };
}

async function applyBrandBoard(args) {
  const plan = await buildBrandBoardPlan(args);
  if (!args.apply) {
    return {
      ...plan,
      status: "dry_run",
      note: "No GHL mutation performed. Re-run with --apply to create or update the Brand Board colors.",
    };
  }

  if (!plan.preconditions.ok) {
    return {
      ...plan,
      status: "blocked",
      note: "No GHL mutation performed because preconditions failed.",
    };
  }

  if (plan.plannedAction.action === "noop") {
    return {
      ...plan,
      metadata: {
        ...plan.metadata,
        dryRun: false,
      },
      status: "pass",
      updates: [{ status: "skipped", reason: "Brand Board already contains expected palette." }],
      verification: {
        ok: true,
        boards: plan.current.boards,
      },
    };
  }

  const result = plan.plannedAction.action === "create"
    ? await ghlFetch("/brand-boards/", {
        method: "POST",
        version: GHL_BRAND_BOARD_VERSION,
        body: JSON.stringify(plan.plannedAction.payload),
      })
    : await ghlFetch(`/brand-boards/${encodeURIComponent(args.locationId)}/${encodeURIComponent(plan.plannedAction.targetBoard.id)}`, {
        method: "PATCH",
        version: GHL_BRAND_BOARD_VERSION,
        body: JSON.stringify(plan.plannedAction.payload),
      });

  const verificationResult = await fetchBrandBoards(args.locationId);
  const verifiedBoardList = brandBoardsFromResult(verificationResult);
  const verifiedBoards = verificationResult.ok ? await hydrateBrandBoards(args.locationId, verifiedBoardList) : verifiedBoardList;
  const matchingBoard = verifiedBoards.find((board) => brandBoardMatchesTarget(board, plan.palette));
  const verified = result.ok && verificationResult.ok && Boolean(matchingBoard);

  return {
    ...plan,
    metadata: {
      ...plan.metadata,
      dryRun: false,
    },
    status: verified ? "pass" : "fail",
    updates: [{
      action: plan.plannedAction.action,
      status: result.ok ? (plan.plannedAction.action === "create" ? "created" : "updated") : "failed",
      statusCode: result.status,
      response: result.ok ? {
        keys: Object.keys(result.body ?? {}),
        id: brandBoardId(result.body?.brandBoard ?? result.body),
      } : result.body,
    }],
    verification: {
      ok: verified,
      status: verificationResult.status,
      matchingBoard: matchingBoard ? brandBoardSummary(matchingBoard) : null,
      boards: verifiedBoards.map(brandBoardSummary),
    },
  };
}

async function exportDocs(args) {
  const result = await fetchDocPages();
  const generatedAt = new Date().toISOString();
  if (result.blocked) {
    return {
      metadata: { client: args.client, locationId: args.locationId, generatedAt, command: "export-docs" },
      status: "blocked",
      reason: result.reason,
      remediation: "Provide Supabase env or use an authenticated panel API session.",
    };
  }
  if (!result.ok) {
    return {
      metadata: { client: args.client, locationId: args.locationId, generatedAt, command: "export-docs" },
      status: "failed",
      statusCode: result.status,
      body: result.body,
    };
  }

  const pages = Array.isArray(result.body) ? result.body : [];
  const outDir = resolve(args.outDir, "doc-pages");
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "doc-pages.json"), JSON.stringify({ generatedAt, pages }, null, 2));

  const markdown = [
    "# PatronPro Panel Doc Pages Export",
    "",
    `Generated: ${generatedAt}`,
    `Pages: ${pages.length}`,
    "",
    ...pages.flatMap((page) => [
      `## ${page.title ?? page.slug ?? page.id}`,
      "",
      `Slug: ${page.slug ?? ""}`,
      `Published: ${page.published ?? ""}`,
      `Updated: ${page.updated_at ?? ""}`,
      "",
      ...(Array.isArray(page.blocks) ? page.blocks.map(renderBlock) : []),
      "",
    ]),
  ].join("\n");
  await writeFile(resolve(outDir, "doc-pages.md"), markdown);

  return {
    metadata: { client: args.client, locationId: args.locationId, generatedAt, command: "export-docs" },
    status: "pass",
    pageCount: pages.length,
    files: {
      json: resolve(outDir, "doc-pages.json"),
      markdown: resolve(outDir, "doc-pages.md"),
    },
  };
}

function renderBlock(block) {
  const data = block.data ?? {};
  if (block.type === "heading") return `${"#".repeat(data.level ?? 2)} ${data.text ?? ""}`;
  if (block.type === "text") return String(data.content ?? "");
  if (block.type === "callout") return `> ${data.title ? `${data.title}: ` : ""}${data.content ?? ""}`;
  if (block.type === "image") return `![${data.alt ?? ""}](${data.url ?? ""})${data.caption ? `\n\n_${data.caption}_` : ""}`;
  if (block.type === "video") return `[Video](${data.url ?? ""})${data.caption ? `\n\n_${data.caption}_` : ""}`;
  return JSON.stringify(block);
}

async function writeOutput(args, payload) {
  const text = JSON.stringify(payload, null, 2);
  if (args.out) {
    const target = resolve(args.out);
    const repoRoot = process.cwd();
    const rel = relative(repoRoot, target);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(`Refusing to write outside the repository: ${target}`);
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${text}\n`);
    return target;
  }
  console.log(text);
  return "";
}

function printHelp() {
  console.log(`Liverpool Digital PatronPro automation harness

Usage:
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs qc [--location ${DEFAULT_LOCATION_ID}] [--out report.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs plan [--out plan.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs assign-calendar-owner [--apply] [--out report.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs activate-calendars [--apply] [--out report.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs website-assets [--out report.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs apply-brand-board [--apply] [--out report.json]
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs export-docs [--out-dir dev/agents/artifacts/doc/test/liverpool-digital]

Commands:
  qc                     Read-only QC across Supabase and GHL. Missing env becomes blocked checks.
  plan                   Read-only planned actions based on QC failures/blockers.
  assign-calendar-owner  Dry-run by default. With --apply, assigns the single main user to onboarding calendars.
  activate-calendars     Dry-run by default. With --apply, sets onboarding calendars active after owner QA.
  website-assets         Read-only proof for generated HTML/images and GHL website/page inventory.
  apply-brand-board      Dry-run by default. With --apply, creates or updates a Brand Board from generated colors.
  export-docs            Export Supabase doc_pages to JSON and Markdown when Supabase env exists.

Environment:
  Supabase reads need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
  GHL reads need GHL_LOCATION_PIT, GHL_MCP, or GHL_AGENCY_ACCESS_TOKEN.

Safety:
  This script is dry-run/read-only unless assign-calendar-owner, activate-calendars, or apply-brand-board is run with --apply.
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === "help") {
    printHelp();
    return;
  }

  let payload;
  if (args.command === "qc") payload = await buildQcReport(args);
  else if (args.command === "plan") payload = plannedActionsFromReport(await buildQcReport(args));
  else if (args.command === "website-assets") payload = await buildWebsiteAssetsReport(args);
  else if (args.command === "assign-calendar-owner") payload = await assignCalendarOwner(args);
  else if (args.command === "activate-calendars") payload = await activateCalendars(args);
  else if (args.command === "apply-brand-board") payload = await applyBrandBoard(args);
  else if (args.command === "export-docs") payload = await exportDocs(args);
  else throw new Error(`Unknown command: ${args.command}`);

  const target = await writeOutput(args, payload);
  if (target) console.error(`wrote ${target}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

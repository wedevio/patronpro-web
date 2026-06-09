#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_LOCATION_ID = "4cPIvLND9hFAIzWQ1ZbL";
const DEFAULT_CLIENT = "Liverpool Digital";
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

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

function parseArgs(argv) {
  const first = argv[2];
  const args = {
    command: first && !first.startsWith("-") ? first : "qc",
    locationId: DEFAULT_LOCATION_ID,
    client: DEFAULT_CLIENT,
    out: "",
    outDir: "dev/agents/artifacts/doc/test/liverpool-digital",
  };

  for (let i = first && !first.startsWith("-") ? 3 : 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--location" || arg === "--location-id") args.locationId = argv[++i] ?? args.locationId;
    else if (arg === "--client") args.client = argv[++i] ?? args.client;
    else if (arg === "--out") args.out = argv[++i] ?? args.out;
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? args.outDir;
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

function normalizeCustomValues(values) {
  const map = new Map();
  for (const value of values ?? []) {
    const fieldKey = String(value.fieldKey ?? value.field_key ?? value.name ?? "");
    const name = String(value.name ?? fieldKey);
    const raw = value.value ?? "";
    for (const key of [...CORE_CUSTOM_VALUES, ...LANDING_CUSTOM_VALUES, ...PUBLICATION_CUSTOM_VALUES]) {
      if (fieldKey.includes(key) || name === key) {
        map.set(key, { ...value, value: raw });
      }
    }
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
  return ghlFetch(`/calendars/?locationId=${encodeURIComponent(locationId)}`);
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

function locationPayload(locationResult) {
  const body = locationResult?.body ?? {};
  return body.location ?? body;
}

function calendarNames(calendarResult) {
  const calendars = calendarResult?.body?.calendars ?? calendarResult?.body?.data ?? [];
  return Array.isArray(calendars) ? calendars.map((cal) => String(cal.name ?? "")) : [];
}

function transactionCount(txResult) {
  const body = txResult?.body ?? {};
  if (typeof body.totalCount === "number") return body.totalCount;
  if (Array.isArray(body.data)) return body.data.length;
  if (Array.isArray(body.transactions)) return body.transactions.length;
  return 0;
}

async function buildQcReport(args) {
  const startedAt = new Date().toISOString();
  const env = envStatus();

  const [accountResult, locationResult, customValuesResult, calendarsResult, phonesResult, txResult, workflowResult] = await Promise.all([
    fetchAccount(args.locationId),
    fetchLocation(args.locationId),
    fetchCustomValues(args.locationId),
    fetchCalendars(args.locationId),
    fetchPhoneNumbers(args.locationId),
    fetchTransactions(args.locationId),
    fetchWorkflows(args.locationId),
  ]);

  const account = accountResult.ok ? accountResult.body : null;
  const submission = latestSubmission(account);
  const checklist = checklistMap(account);
  const website = firstWebsite(account);
  const location = locationResult.ok ? locationPayload(locationResult) : null;
  const companyId = location?.companyId ?? location?.company_id ?? location?.company?.id ?? "";
  const usersResult = await fetchUsers(companyId, args.locationId);
  const users = usersResult.ok ? (usersResult.body?.users ?? usersResult.body?.data ?? []) : [];
  const customValues = normalizeCustomValues(customValuesResult.ok ? customValuesResult.body?.customValues : []);
  const calendars = calendarNames(calendarsResult);
  const phones = phonesResult.ok ? (phonesResult.body?.numbers ?? phonesResult.body?.data ?? []) : [];
  const phoneNumbers = Array.isArray(phones) ? phones.map((item) => item.phoneNumber ?? item.number ?? item.phone).filter(Boolean) : [];
  const twilioActive = phonesResult.ok && phonesResult.body?.accountStatus === "active";
  const transactions = txResult.ok ? transactionCount(txResult) : 0;
  const workflows = workflowResult.ok ? (workflowResult.body?.workflows ?? workflowResult.body?.data ?? []) : [];

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
  const domainReady = Boolean(location?.customDomain && domainValue);
  results.push(domainReady
    ? createResult("domain", "Domain connected / DNS configured", "pass", {
        customDomain: location?.customDomain ?? "",
        dominioWeb: domainValue,
      })
    : createResult("domain", "Domain connected / DNS configured", customValuesResult.blocked || locationResult.blocked ? "blocked" : "fail", {
        customDomain: location?.customDomain ?? "",
        dominioWeb: domainValue,
      }, "Connect DNS/custom domain and sync dominio_web; both are required for pass."));

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
  const imagesReady = ["website_hero_image", "website_about_image", "website_contact_image"].every((key) => Boolean(customValues.get(key)?.value));
  const generatedReady = website?.status === "ready" && htmlLen > 0 && imagesReady;
  const publicationEvidence = customValues.get("landing_published_url")?.value ?? location?.website ?? "";
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
      }, "Generate landing HTML/images and add GHL publication evidence."));

  const hasOnSiteCalendar = calendars.some((name) => /on[- ]?site/i.test(name));
  const hasConsultationCalendar = calendars.some((name) => /consultation|consulta/i.test(name));
  const hasOnSiteValue = Boolean(customValues.get("on_site_visit_calendar")?.value);
  const hasConsultationValue = Boolean(customValues.get("free_consultation_calendar")?.value);
  results.push(hasOnSiteCalendar && hasConsultationCalendar && hasOnSiteValue && hasConsultationValue
    ? createResult("calendar", "Calendar configured", "pass", {
        calendars,
        onSiteValue: customValues.get("on_site_visit_calendar")?.value ?? "",
        consultationValue: customValues.get("free_consultation_calendar")?.value ?? "",
      })
    : createResult("calendar", "Calendar configured", calendarsResult.blocked ? "blocked" : "fail", {
        calendars,
        hasOnSiteValue,
        hasConsultationValue,
      }, "Create/verify both on-site and consultation calendars, then sync both booking custom values."));

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

  const missingLanding = LANDING_CUSTOM_VALUES.filter((key) => !customValues.get(key)?.value);
  results.push(missingLanding.length === 0
    ? createResult("landing_custom_values", "Landing custom values", "pass", { keys: LANDING_CUSTOM_VALUES })
    : createResult("landing_custom_values", "Landing custom values", customValuesResult.blocked ? "blocked" : "fail", { missing: missingLanding }, "Create missing custom values used by landing generator/published page."));

  const workflowNames = Array.isArray(workflows) ? workflows.map((workflow) => String(workflow.name ?? workflow.title ?? "")) : [];
  const hasOnboardingWorkflow = workflowNames.some((name) => /onboarding|ob-meeting-ok|send onboarding/i.test(name));
  results.push(hasOnboardingWorkflow
    ? createResult("onboarding_workflow", "Onboarding workflow present", "pass", { workflowNames })
    : createResult("onboarding_workflow", "Onboarding workflow present", workflowResult.blocked ? "blocked" : "fail", { workflowNames }, "Verify GHL workflow trigger tag ob-meeting-ok and webhook body in GHL UI."));

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
  bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs export-docs [--out-dir dev/agents/artifacts/doc/test/liverpool-digital]

Commands:
  qc           Read-only QC across Supabase and GHL. Missing env becomes blocked checks.
  plan         Read-only planned actions based on QC failures/blockers.
  export-docs  Export Supabase doc_pages to JSON and Markdown when Supabase env exists.

Environment:
  Supabase reads need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
  GHL reads need GHL_LOCATION_PIT, GHL_MCP, or GHL_AGENCY_ACCESS_TOKEN.

Safety:
  This script is dry-run/read-only. It performs no live mutation.
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
  else if (args.command === "export-docs") payload = await exportDocs(args);
  else throw new Error(`Unknown command: ${args.command}`);

  const target = await writeOutput(args, payload);
  if (target) console.error(`wrote ${target}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

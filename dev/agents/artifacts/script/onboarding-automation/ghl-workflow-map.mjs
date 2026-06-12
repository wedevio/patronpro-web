#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const DEFAULT_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";

const TARGET_WORKFLOWS = [
  {
    name: "1. Onboaring Link Send",
    prior: { published: true, version: 15, updatedAt: "2026-06-11T12:08:45.307Z" },
  },
  {
    name: "2. Onboarding Email Automation",
    prior: { published: true, version: 28, updatedAt: "2026-06-11T11:19:25.242Z" },
  },
  {
    name: "2.5 Onboarding Appointment Completed",
    prior: { published: true, version: 6, updatedAt: "2026-06-11T11:04:48.742Z" },
  },
  {
    name: "3. Onboarding Meeting Requirements Email",
    prior: { published: true, version: 12, updatedAt: "2026-06-11T12:05:02.971Z" },
  },
];

function parseArgs(argv) {
  const args = {
    locationId: DEFAULT_LOCATION_ID,
    out: "dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json",
    md: "dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--location") args.locationId = readValue(argv, ++i, arg);
    else if (arg === "--out") args.out = readValue(argv, ++i, arg);
    else if (arg === "--md") args.md = readValue(argv, ++i, arg);
    else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log(`Read-only PatronPro onboarding workflow metadata probe

Usage:
  GHL_LOCATION_PIT="$(op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken")" \\
  bun dev/agents/artifacts/script/onboarding-automation/ghl-workflow-map.mjs \\
    --location ${DEFAULT_LOCATION_ID} \\
    --out dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json \\
    --md dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md

Safety:
  Performs GET /workflows only. Writes redacted metadata and no auth/session data.
`);
}

function getToken() {
  return process.env.GHL_LOCATION_PIT ?? process.env.GHL_MCP ?? process.env.GHL_AGENCY_ACCESS_TOKEN ?? "";
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeRateLimitHeaders(headers) {
  const allowed = {};
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (!/^x-ratelimit-[a-z0-9-]+$/.test(lower)) continue;
    const combined = `${lower}:${value}`.toLowerCase();
    if (/(account|contact|user|location|request|trace|id)/.test(combined)) continue;
    allowed[lower] = value;
  }
  return {
    status: Object.keys(allowed).length ? "allowlist_applied" : "none_present_or_omitted",
    values: allowed,
  };
}

async function fetchWorkflows(locationId, token) {
  const url = `${GHL_BASE}/workflows/?locationId=${encodeURIComponent(locationId)}`;
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
      },
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusClass: "network_or_timeout_error",
      error: err instanceof Error ? err.name : "unknown_error",
      topLevelKeys: [],
      workflows: [],
      safeRateLimitHeaders: { status: "unavailable", values: {} },
    };
  }

  const body = await safeJson(res);
  const workflows = extractWorkflows(body);
  return {
    ok: res.ok,
    status: res.status,
    statusClass: responseClass(res.status),
    topLevelKeys: body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body).sort() : [],
    workflows,
    safeRateLimitHeaders: safeRateLimitHeaders(res.headers),
  };
}

function responseClass(status) {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream_server_error";
  if (status >= 400) return "client_error";
  if (status >= 200 && status < 300) return "ok";
  return "unknown_status";
}

function extractWorkflows(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  if (Array.isArray(body.workflows)) return body.workflows;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

function safeWorkflowMetadata(workflow) {
  const status = stringOrNull(workflow.status ?? workflow.workflowStatus ?? workflow.state);
  const published =
    typeof workflow.published === "boolean"
      ? workflow.published
      : typeof workflow.isPublished === "boolean"
        ? workflow.isPublished
        : status?.toLowerCase() === "published"
          ? true
          : null;

  return {
    id: stringOrNull(workflow.id ?? workflow._id ?? workflow.workflowId),
    name: stringOrNull(workflow.name ?? workflow.title),
    status,
    published,
    version: numberOrNull(workflow.version ?? workflow.workflowVersion),
    createdAt: stringOrNull(workflow.createdAt ?? workflow.dateAdded),
    updatedAt: stringOrNull(workflow.updatedAt ?? workflow.dateUpdated),
  };
}

function stringOrNull(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function numberOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function mapTargets(workflows, source) {
  const metadata = workflows.map(safeWorkflowMetadata).filter((workflow) => workflow.name);
  return TARGET_WORKFLOWS.map((target) => {
    const observed = metadata.find((workflow) => workflow.name === target.name);
    if (observed) {
      return {
        targetName: target.name,
        observedName: observed.name,
        workflowId: observed.id,
        status: "partial",
        evidenceSource: source,
        metadata: observed,
        triggerSummary: "blocked_by_profile9_ui",
        actionSendBoundary: "blocked_by_profile9_ui",
        appointmentCalendarDependency: "blocked_by_profile9_ui",
        meetingInviteGap: "gap_partial",
        nextProofNeeded: "Profile 9 UI or separately approved export is needed to inspect triggers/actions.",
        safetyNote: "Read-only GET metadata only; no live GHL mutation performed.",
      };
    }

    if (source === "rlm-prior") {
      return rlmPriorTarget(target);
    }

    return {
      targetName: target.name,
      observedName: null,
      workflowId: null,
      status: "not_found",
      evidenceSource: source,
      metadata: {
        id: null,
        name: null,
        status: null,
        published: null,
        version: null,
        createdAt: null,
        updatedAt: null,
      },
      triggerSummary: "not_found_in_complete_api_collection",
      actionSendBoundary: "not_found_in_complete_api_collection",
      appointmentCalendarDependency: "not_found_in_complete_api_collection",
      meetingInviteGap: "gap_blocked",
      nextProofNeeded: "Reconcile fresh API collection against RLM prior before implementing invite placement.",
      safetyNote: "Read-only GET metadata only; no live GHL mutation performed.",
    };
  });
}

function rlmPriorTarget(target) {
  return {
    targetName: target.name,
    observedName: target.name,
    workflowId: null,
    status: "partial",
    evidenceSource: "rlm-prior",
    metadata: {
      id: null,
      name: target.name,
      status: "published",
      published: target.prior.published,
      version: target.prior.version,
      createdAt: null,
      updatedAt: target.prior.updatedAt,
    },
    triggerSummary: "blocked_live_api_unavailable",
    actionSendBoundary: "blocked_live_api_unavailable",
    appointmentCalendarDependency: "blocked_live_api_unavailable",
    meetingInviteGap: "gap_partial",
    nextProofNeeded: "Fresh API read or Profile 9 UI evidence needed before closing without user acceptance.",
    safetyNote: "RLM prior only; no live GHL mutation performed.",
  };
}

function canonicalTargetMetadata(workflows) {
  const metadata = workflows.map(safeWorkflowMetadata).filter((workflow) => workflow.name);
  const targets = TARGET_WORKFLOWS.map((target) => {
    const observed = metadata.find((workflow) => workflow.name === target.name);
    return {
      id: observed?.id ?? null,
      name: observed?.name ?? target.name,
      status: observed?.status ?? null,
      published: observed?.published ?? null,
      version: observed?.version ?? null,
      createdAt: observed?.createdAt ?? null,
      updatedAt: observed?.updatedAt ?? null,
    };
  });
  return targets.sort((a, b) => `${a.id ?? ""}:${a.name}`.localeCompare(`${b.id ?? ""}:${b.name}`));
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeysDeep(value[key])]));
}

function sha256Canonical(value) {
  const sorted = sortKeysDeep(value);
  return createHash("sha256").update(JSON.stringify(sorted), "utf8").digest("hex");
}

function noMutationProof(first, second) {
  if (!first.ok) {
    return {
      status: "blocked_pre_read_failed",
      blocker: first.statusClass,
      hashCanonicalizationVersion: "workflow-target-metadata-v1",
    };
  }
  if (!second.ok) {
    return {
      status: "blocked_post_read_failed",
      blocker: second.statusClass,
      hashCanonicalizationVersion: "workflow-target-metadata-v1",
    };
  }

  const preRunHash = sha256Canonical(canonicalTargetMetadata(first.workflows));
  const postRunHash = sha256Canonical(canonicalTargetMetadata(second.workflows));
  return {
    status: preRunHash === postRunHash ? "hashes_match_after_read_only_gets" : "hashes_differ_after_read_only_gets",
    preRunHash,
    postRunHash,
    hashCanonicalizationVersion: "workflow-target-metadata-v1",
  };
}

function buildBlockedProbe(locationId, generatedAt, reason) {
  const workflowTargets = TARGET_WORKFLOWS.map(rlmPriorTarget);
  return {
    schemaVersion: "patronpro-onboarding-workflow-map-v1",
    generatedAt,
    bead: "ppweb-0ka.1",
    branch: "feature/onboarding-automation",
    locationId,
    apiProbe: {
      status: reason,
      method: "GET",
      endpoint: "/workflows/",
      topLevelKeys: [],
      observedWorkflowCount: 0,
      observedWorkflowNames: [],
      responseStatus: null,
      responseClass: reason,
    },
    noMutationProof: {
      status: "blocked_pre_read_failed",
      blocker: reason,
      hashCanonicalizationVersion: "workflow-target-metadata-v1",
    },
    safeRateLimitHeaders: { status: "unavailable", values: {} },
    workflowTargets,
    profile9: { status: "not_attempted_requires_user_approval" },
    validator: { status: "pending" },
    safety: {
      liveMutationPerformed: false,
      mutationBoundary: "read_only_get_workflows_or_rlm_prior",
      secretHandling: "No token, cookie, or raw request data stored.",
    },
    sourceNotes: [
      "RLM prior says the four target workflows were visible in a 2026-06-12 read-only API inventory.",
      "Fresh API evidence is required before closing unless the user accepts a prior-evidence-only checkpoint.",
    ],
  };
}

function buildApiProbe(locationId, generatedAt, first, second) {
  const workflowTargets = first.ok ? mapTargets(first.workflows, "api") : TARGET_WORKFLOWS.map(rlmPriorTarget);
  const safeNames = first.ok
    ? first.workflows.map(safeWorkflowMetadata).map((workflow) => workflow.name).filter(Boolean).sort()
    : [];

  const status =
    first.ok ? "success_read_only_api_metadata" : first.status === 401 || first.status === 403 ? "blocked_location_token_scope" : first.statusClass;

  return {
    schemaVersion: "patronpro-onboarding-workflow-map-v1",
    generatedAt,
    bead: "ppweb-0ka.1",
    branch: "feature/onboarding-automation",
    locationId,
    apiProbe: {
      status,
      method: "GET",
      endpoint: "/workflows/",
      topLevelKeys: first.topLevelKeys,
      observedWorkflowCount: first.workflows.length,
      observedWorkflowNames: safeNames,
      responseStatus: first.status,
      responseClass: first.statusClass,
    },
    noMutationProof: noMutationProof(first, second),
    safeRateLimitHeaders: first.safeRateLimitHeaders,
    workflowTargets,
    profile9: { status: "not_attempted_requires_user_approval" },
    validator: { status: "pending" },
    safety: {
      liveMutationPerformed: false,
      mutationBoundary: "read_only_get_workflows",
      secretHandling: "No token, cookie, or raw request data stored.",
    },
    sourceNotes: [
      "Fresh API metadata wins over RLM prior for status, version, and timestamps.",
      "Trigger/action internals remain blocked unless Profile 9 UI evidence is explicitly authorized.",
    ],
  };
}

function renderMarkdown(probe) {
  const counts = countStatuses(probe.workflowTargets);
  const lines = [
    "# PatronPro Onboarding GHL Workflow Map",
    "",
    `Date: ${probe.generatedAt}`,
    "Bead: `ppweb-0ka.1`",
    "Branch: `feature/onboarding-automation`",
    `Location: \`${probe.locationId}\``,
    "Artifact role: read-only workflow evidence",
    "",
    "## Summary",
    "",
    `- API probe: \`${probe.apiProbe.status}\` (${probe.apiProbe.responseStatus ?? "no_live_status"})`,
    `- Workflows observed by API: ${probe.apiProbe.observedWorkflowCount}`,
    `- Target statuses: ${counts.proven} proven, ${counts.partial} partial, ${counts.blocked} blocked, ${counts.not_found} not_found`,
    `- No-mutation proof: \`${probe.noMutationProof.status}\``,
    "- No live GHL mutation was performed. No Save, Publish, Send, Delete, Submit, Approve, or mutation-capable UI action was used.",
    "- Profile 9 UI evidence was not attempted in this pass; it requires explicit approval and an authenticated WSL Profile 9 CDP connection.",
    "",
    "## Target Workflows",
    "",
  ];

  for (const workflow of probe.workflowTargets) {
    lines.push(`### ${workflow.targetName}`);
    lines.push("");
    lines.push(`- Representation status: \`${workflow.status}\``);
    lines.push(`- Evidence source: \`${workflow.evidenceSource}\``);
    lines.push(`- Observed name: ${workflow.observedName ? `\`${workflow.observedName}\`` : "`not observed`"}`);
    lines.push(`- Workflow id: ${workflow.workflowId ? `\`${workflow.workflowId}\`` : "`not available`"}`);
    lines.push(`- Published/status: ${formatValue(workflow.metadata.published)} / ${formatValue(workflow.metadata.status)}`);
    lines.push(`- Version: ${formatValue(workflow.metadata.version)}`);
    lines.push(`- Created: ${formatValue(workflow.metadata.createdAt)}`);
    lines.push(`- Updated: ${formatValue(workflow.metadata.updatedAt)}`);
    lines.push(`- Trigger summary: \`${workflow.triggerSummary}\``);
    lines.push(`- Action/send boundary: \`${workflow.actionSendBoundary}\``);
    lines.push(`- Appointment/calendar dependency: \`${workflow.appointmentCalendarDependency}\``);
    lines.push(`- Meeting-invite gap: \`${workflow.meetingInviteGap}\``);
    lines.push(`- Next proof needed: ${workflow.nextProofNeeded}`);
    lines.push(`- Safety note: ${workflow.safetyNote}`);
    lines.push("");
  }

  lines.push("## Future Ownership");
  lines.push("");
  lines.push("- `ppweb-0ka.2` owns deterministic universal invite generation: ICS plus provider-specific add-to-calendar links.");
  lines.push("- `ppweb-0ka.3` owns the Monday PoC panel for operator preview/download/test without GHL mutation.");
  lines.push("- `ppweb-0ka.4` is the follow-up path for token scope or Google Meet research.");
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push("- Validator status: `pending` before `validate-workflow-map.ts` runs.");
  lines.push("- This artifact should be considered closeable only after the validator records PASS and `ppweb-0ka.1` is updated.");
  lines.push("");
  lines.push("## Observed Workflow Names");
  lines.push("");
  if (probe.apiProbe.observedWorkflowNames.length) {
    for (const name of probe.apiProbe.observedWorkflowNames) {
      lines.push(`- ${name}`);
    }
  } else {
    lines.push("- No fresh API workflow names available in this artifact.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "`not available`";
  return `\`${String(value)}\``;
}

function countStatuses(workflows) {
  return workflows.reduce(
    (acc, workflow) => {
      acc[workflow.status] = (acc[workflow.status] ?? 0) + 1;
      return acc;
    },
    { proven: 0, partial: 0, blocked: 0, not_found: 0 }
  );
}

async function writeArtifacts(jsonPath, mdPath, probe) {
  await mkdir(dirname(jsonPath), { recursive: true });
  await mkdir(dirname(mdPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(probe, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(probe));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const generatedAt = new Date().toISOString();
  const token = getToken();
  let probe;

  if (!token) {
    probe = buildBlockedProbe(args.locationId, generatedAt, "blocked_missing_credentials");
  } else {
    const first = await fetchWorkflows(args.locationId, token);
    const second = first.ok
      ? await fetchWorkflows(args.locationId, token)
      : {
          ok: false,
          status: 0,
          statusClass: "blocked_second_read_skipped",
          topLevelKeys: [],
          workflows: [],
          safeRateLimitHeaders: { status: "unavailable", values: {} },
        };
    probe = buildApiProbe(args.locationId, generatedAt, first, second);
  }

  await writeArtifacts(args.out, args.md, probe);
  console.log(`Wrote ${args.out}`);
  console.log(`Wrote ${args.md}`);
  console.log(`API probe status: ${probe.apiProbe.status}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

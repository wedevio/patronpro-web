#!/usr/bin/env bun
import { readFile } from "node:fs/promises";

const TARGET_WORKFLOWS = [
  "1. Onboaring Link Send",
  "2. Onboarding Email Automation",
  "2.5 Onboarding Appointment Completed",
  "3. Onboarding Meeting Requirements Email",
];

const STATUS_VALUES = new Set(["proven", "partial", "blocked", "not_found"]);
const EVIDENCE_VALUES = new Set(["api", "profile9-ui", "rlm-prior"]);
const GAP_VALUES = new Set(["gap_proven", "gap_partial", "gap_not_applicable", "gap_blocked"]);
const HASH_RE = /^[a-f0-9]{64}$/;

function parseArgs(argv: string[]) {
  const args: { json?: string; md?: string; help?: boolean } = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") args.json = readValue(argv, ++i, arg);
    else if (arg === "--md") args.md = readValue(argv, ++i, arg);
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readValue(argv: string[], index: number, flag: string) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function printHelp() {
  console.log(`Validate PatronPro onboarding workflow map artifacts

Usage:
  bun dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts \\
    --json dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json \\
    --md dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md
`);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function collectText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(collectText).join("\n");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}\n${collectText(entry)}`)
      .join("\n");
  }
  return "";
}

function assertNoSensitiveText(text: string, source: string) {
  const checks: Array<[RegExp, string]> = [
    [/Authorization/i, "authorization marker"],
    [/\bBearer\s+[A-Za-z0-9._-]+/i, "bearer token"],
    [/Set-Cookie/i, "set-cookie marker"],
    [/localStorage/i, "localStorage marker"],
    [/session[_ -]?header/i, "session header marker"],
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "email address"],
    [/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, "phone number"],
  ];

  for (const [regex, label] of checks) {
    assert(!regex.test(text), `${source} contains prohibited ${label}`);
  }
}

function validateWorkflowTargets(json: any) {
  assert(Array.isArray(json.workflowTargets), "workflowTargets must be an array");
  assert(json.workflowTargets.length === 4, "workflowTargets must contain exactly four entries");

  for (const name of TARGET_WORKFLOWS) {
    assert(
      json.workflowTargets.some((workflow: any) => workflow.targetName === name),
      `missing target workflow ${name}`
    );
  }

  for (const workflow of json.workflowTargets) {
    assert(STATUS_VALUES.has(workflow.status), `invalid workflow status ${workflow.status}`);
    assert(EVIDENCE_VALUES.has(workflow.evidenceSource), `invalid evidence source ${workflow.evidenceSource}`);
    assert(GAP_VALUES.has(workflow.meetingInviteGap), `invalid meeting gap ${workflow.meetingInviteGap}`);
    assert(typeof workflow.safetyNote === "string" && workflow.safetyNote.length > 0, "missing safety note");
  }
}

function validateNoMutationProof(json: any) {
  const proof = json.noMutationProof;
  assert(proof && typeof proof === "object", "missing noMutationProof");
  assert(
    proof.hashCanonicalizationVersion === "workflow-target-metadata-v1",
    "missing hashCanonicalizationVersion"
  );

  if (proof.status === "hashes_match_after_read_only_gets" || proof.status === "hashes_differ_after_read_only_gets") {
    assert(HASH_RE.test(proof.preRunHash), "invalid preRunHash");
    assert(HASH_RE.test(proof.postRunHash), "invalid postRunHash");
  } else {
    assert(typeof proof.blocker === "string" && proof.blocker.length > 0, "blocked proof requires blocker");
  }
}

function validateSafeRateLimitHeaders(json: any) {
  const headers = json.safeRateLimitHeaders;
  assert(headers && typeof headers === "object", "missing safeRateLimitHeaders");
  const values = headers.values ?? {};
  assert(typeof values === "object" && !Array.isArray(values), "safeRateLimitHeaders.values must be an object");
  for (const key of Object.keys(values)) {
    assert(/^x-ratelimit-[a-z0-9-]+$/.test(key), `unsafe rate-limit header key ${key}`);
    assert(!/(account|contact|user|location|request|trace|id)/i.test(`${key}:${values[key]}`), `unsafe rate-limit header value for ${key}`);
  }
}

function validateMarkdown(markdown: string) {
  for (const name of TARGET_WORKFLOWS) {
    assert(markdown.includes(`### ${name}`), `Markdown missing section for ${name}`);
  }
  assert(markdown.includes("No live GHL mutation was performed"), "Markdown missing no-mutation statement");
  assert(markdown.includes("ppweb-0ka.2"), "Markdown missing ppweb-0ka.2 reference");
  assert(markdown.includes("ppweb-0ka.3"), "Markdown missing ppweb-0ka.3 reference");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  assert(args.json, "--json is required");
  assert(args.md, "--md is required");

  const jsonText = await readFile(args.json, "utf8");
  const markdown = await readFile(args.md, "utf8");
  const json = JSON.parse(jsonText);

  assert(json.schemaVersion === "patronpro-onboarding-workflow-map-v1", "unexpected schemaVersion");
  validateWorkflowTargets(json);
  validateNoMutationProof(json);
  validateSafeRateLimitHeaders(json);
  validateMarkdown(markdown);
  assertNoSensitiveText(collectText(json), "JSON artifact");
  assertNoSensitiveText(markdown, "Markdown artifact");

  console.log("PASS workflow map validation");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

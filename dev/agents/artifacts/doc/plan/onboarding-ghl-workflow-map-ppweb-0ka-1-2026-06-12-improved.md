# Onboarding GHL Workflow Map PRD

Date: 2026-06-12
Bead: `ppweb-0ka.1`
Epic: `ppweb-0ka`
Repo: `/home/oz/projects/2026/onboarding-automation`
Branch: `feature/onboarding-automation`
Artifact role: quality-loop PRD for read-only GHL workflow reconnaissance
Artifact status: CE-improved after Mini rerun should-fixes

## Goal

Produce a read-only workflow map for PatronPro's current onboarding automations so the Monday onboarding invite PoC starts from observed GHL behavior, not assumptions. The map must show what the public API proves, what the UI path still needs to prove if separately authorized, and where the missing meeting-invite/calendar-add flow belongs.

## Scope

Document these main-location workflows in Patron Pro location `hHLZC7FaTtUINPf3cbHd`:

- `1. Onboaring Link Send`
- `2. Onboarding Email Automation`
- `2.5 Onboarding Appointment Completed`
- `3. Onboarding Meeting Requirements Email`

The observed spelling `Onboaring` must be preserved if returned by GHL or RLM evidence. Do not silently correct it to `Onboarding`.

## Source Evidence

- RLM checkpoint: `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/patronpro-onboarding-calendar-invite-aut-sance-2026-06-12.md`
  - Proves: a live read-only GHL API inventory on 2026-06-12 returned 10 workflows for main PatronPro location `hHLZC7FaTtUINPf3cbHd`, including the four target onboarding-sequence workflow names, published status, versions, and update timestamps.
  - Still open: trigger/action internals and exact email/send boundaries, because the public workflow API exposed metadata only in that pass.
- RLM main-account appointment pattern: `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/patronpro-main-account-onboarding-appoin--booking-pattern.md`
  - Proves: onboarding appointments belong in the PatronPro main GHL account, calendar `D7x8ts5xcdNOWnd6Pjlq`, assigned user `r2NA4HiIxWRvKwzuYpzv`, and GHL remains the appointment source of truth.
  - Still open: how the four onboarding workflows react to that appointment and whether any workflow sends an `.ics`, hosted calendar link, or provider-specific calendar links.
- HighLevel official API support article, modified 2026-05-13, which points developers to `https://marketplace.gohighlevel.com/docs/`, says API v1 reached end-of-support on 2025-12-31, and documents current v2 rate limits.
- HighLevel official Workflows docs, current version selector showing `v3`, with `GET /workflows/` documented under Workflows.
- Existing repo evidence in `CHANGELOG.md` for prior PatronPro/GHL read-only and UI automation boundaries.
- If available, a fresh read-only API probe using the 1Password item `GHL - PatronPro - api key - MAIN` from the `Picturelle` vault.

Reconciliation rule: fresh live API evidence wins over RLM-prior metadata for status/version/timestamps. RLM-prior evidence remains useful for explaining why the target workflows matter, but any contradiction must be recorded in the map as `fresh_api_contradicts_rlm_prior`.

## Guardrails

- No live GHL mutation. Do not click Save, Publish, Send, Delete, Submit, Approve, Add Contact, or any mutation-capable workflow control.
- Do not read, print, write, commit, or store tokens, cookies, localStorage, session headers, passwords, or account session state.
- Browser fallback must use WSL Profile 9 only: `/home/oz/.config/chrome-patronpro-profile9`.
- Do not fall back to Windows Chrome Profile 9 or Oscar personal WSL Chrome profiles.
- API probes are metadata-only and use `GET /workflows/?locationId=...` only. If returned workflow objects contain nested actions, body text, staff emails, account ids, or other PII-like internals, the artifact stores only redacted summaries and shape metadata.
- If the API exposes only workflow metadata, say that plainly and mark trigger/action internals as `blocked_by_profile9_or_export`.
- Approved export is not an execution path for this pass. If a future operator wants export-based evidence, create a follow-up bead that names the approver, export source, storage path, parser, and redaction policy first.
- No screenshots for this first pass unless the operator explicitly authorizes Profile 9 UI evidence and a separate screenshot redaction helper is present. In this pass, screenshots are out of scope to avoid URL/profile/account leakage.
- PII scrub list: authorization headers, cookies, session headers, localStorage, passwords, tokens, staff emails, contact emails, phone numbers, free-form workflow action body text, `Set-Cookie`, profile menu content, and any browser URL/query string that contains session or account state.

## Proposed Evidence Artifacts

Write working evidence under:

`dev/agents/artifacts/doc/test/onboarding-automation/`

Minimum files:

- `ghl-onboarding-workflows-api-probe-2026-06-12.json`
- `ghl-onboarding-workflow-map-2026-06-12.md`

Optional files if Profile 9 is authenticated, reachable, and explicitly authorized in a later pass:

- `ghl-onboarding-workflows-profile9-map-2026-06-12.json`

Validation helper to create or use during implementation:

- `dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts`

## Workflow Map Schema

For each workflow, record:

- workflow name
- workflow id when returned by API
- status/published state
- version
- `createdAt` and `updatedAt`
- evidence source: `api`, `profile9-ui`, or `rlm-prior`
- trigger summary
- action/send boundary
- email or SMS template evidence, if visible without unsafe disclosure
- appointment/calendar dependency, if visible
- meeting-invite gap assessment
- next proof needed
- safety note confirming no mutation

Use these terminal workflow status values:

- `proven`: directly observed from API/UI evidence and sufficient to answer the field being claimed.
- `partial`: workflow metadata was observed, but trigger/action/email-send internals are unavailable.
- `blocked`: no allowed source can represent the workflow or a required proof path is unavailable. Do not use `blocked` merely because internals are missing when metadata exists; use `partial` in that case.
- `not_found`: a complete, parsed workflow collection was searched and the expected workflow was absent.

Meeting-invite gap rubric:

- `gap_proven`: workflow internals show a client-facing appointment/onboarding email is sent but no `.ics`, hosted ICS URL, Google/Microsoft/Apple/Zoho add-link, or equivalent calendar-add instruction is present.
- `gap_partial`: metadata and RLM prior indicate the workflow belongs to onboarding, but trigger/action internals are unavailable, so the report can only identify the likely gap slot.
- `gap_not_applicable`: workflow is unrelated to appointment preparation or client meeting reminders.
- `gap_blocked`: no live or prior evidence is sufficient to classify the gap.

Expected future ownership:

- `ppweb-0ka.2` owns deterministic universal invite generation: ICS file plus Google/Microsoft/Apple/iOS/Zoho links.
- `ppweb-0ka.3` owns the Monday PoC panel where an operator previews/downloads/tests those invite artifacts without mutating GHL.
- `ppweb-0ka.4` is the follow-up trigger for 401/403, wrong-location, or insufficient-scope token failures that prevent a complete main-location workflow read.

## Secret Handling And 1Password Field Rule

The 1Password field label `api tonken` is a known literal typo in the current handoff. Treat it as intentional and do not normalize it to `api token` unless label-only discovery proves the item changed.

Primary secret read:

```bash
op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken"
```

Preflight before any API probe:

```bash
command -v op
op whoami
```

If the `op read` path fails, inspect field labels only. Do not print field values:

```bash
op item get "GHL - PatronPro - api key - MAIN" \
  --vault "Picturelle" \
  --format json \
  | jq -r '.fields[]?.label'
```

After label-only discovery, use the exact returned label with `op read`. Do not store the discovered labels in RLM unless there is a durable non-secret naming decision to record.

## Safe Rate-Limit Header Rule

The JSON artifact may store only:

- HTTP status code.
- Lowercased response header names that match `^x-ratelimit-[a-z0-9-]+$`.
- Scalar `x-ratelimit-*` values after confirming they do not contain account, contact, user, location, request, trace, or id-like substrings.

Do not store `x-request-id`, `cf-ray`, `traceparent`, `server-timing`, `set-cookie`, `location`, authorization echoes, or any header whose name or value contains account/contact/user/location identifiers. If safe filtering is uncertain, store the status code only and set `rateLimitHeaders.status = "omitted_uncertain_safety"`.

## No-Mutation Hash Canonicalization

The `preRunHash` and `postRunHash` must be computed from identical canonicalization logic:

1. Select only the four target workflows from the parsed `GET /workflows/` collection.
2. Keep only safe metadata fields needed for no-mutation comparison: `id`, `name`, `status`, `published`, `version`, `createdAt`, and `updatedAt`. Missing fields must be represented as `null`.
3. Sort the target workflow array by `id` first and `name` second. If `id` is missing, sort that workflow with an empty-string id and then by the observed name.
4. Sort object keys recursively in lexicographic order.
5. JSON stringify the recursively sorted object with no extra whitespace.
6. Compute SHA-256 over the UTF-8 JSON bytes and store lowercase hex.

Store `hashCanonicalizationVersion = "workflow-target-metadata-v1"` beside both hashes. If either read cannot produce the canonical object, store the exact blocker and do not assert `hashes_match_after_read_only_gets`.

## Generated Artifact Validator

Implementation must include or use `dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts` before `ppweb-0ka.1` can close. The validator is an artifact helper, not application code.

Required command shape:

```bash
bun dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts \
  --json dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json \
  --md dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md
```

Minimum assertions:

- JSON parses and Markdown file exists.
- Exactly four target workflow entries are represented in JSON or the JSON records a single global blocker that explains why representation is impossible.
- Workflow names include the exact target strings, including `1. Onboaring Link Send`.
- Workflow status values are limited to `proven`, `partial`, `blocked`, and `not_found`.
- Evidence source values are limited to `api`, `profile9-ui`, and `rlm-prior`.
- Meeting gap values are limited to `gap_proven`, `gap_partial`, `gap_not_applicable`, and `gap_blocked`.
- `noMutationProof` exists and either includes two lowercase 64-character SHA-256 hashes plus `hashCanonicalizationVersion`, or includes a precise blocker status.
- `safeRateLimitHeaders` contains only allowed `x-ratelimit-*` keys or an explicit omitted status.
- Markdown includes one section per target workflow, a no-mutation statement, and future ownership references to `ppweb-0ka.2` and `ppweb-0ka.3`.
- JSON and Markdown do not contain `Authorization`, `Bearer `, `Set-Cookie`, cookie values, localStorage values, passwords, session headers, raw request headers, staff/contact email addresses, phone numbers, or unredacted workflow body text.

## Implementation Plan

1. Run a read-only API probe for `GET /workflows/?locationId=hHLZC7FaTtUINPf3cbHd` if GHL credentials can be injected safely.
2. Use the 1Password service account only through command substitution or `op read`; never echo the secret. Expected field path uses the known literal typo:

   ```bash
   op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken"
   ```

   If that field path fails, inspect labels only with the fallback in "Secret Handling And 1Password Field Rule" and do not print field values.
3. Probe command shape:

   ```bash
   GHL_LOCATION_PIT="$(op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken")" \
   bun dev/agents/artifacts/script/onboarding-automation/ghl-workflow-map.mjs \
     --location hHLZC7FaTtUINPf3cbHd \
     --out dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json
   ```

   The helper must use `Authorization: Bearer <token>`, `Version: 2021-07-28`, a 15s timeout, and no user-agent secrets. If the helper is not created, use a one-off `bun` probe with the same output shape and redaction rules.
4. Store a redacted JSON artifact containing only workflow metadata, top-level response keys, status code, safe rate-limit headers, probe status, no-mutation hash data, and validator status. Never store raw auth headers, request headers, token-bearing command output, or unredacted response bodies.
5. Include `preRunHash` and `postRunHash` of the normalized target workflow metadata from two consecutive `GET /workflows/` reads using `workflow-target-metadata-v1` canonicalization. If both reads succeed and hashes match, set `noMutationProof.status = "hashes_match_after_read_only_gets"`. If the second read fails, set `noMutationProof.status = "blocked_post_read_failed"` and do not assert mutation proof.
6. Build the Markdown workflow map from the fresh probe plus the RLM prior if live credentials are unavailable.
7. Run the generated artifact validator and record its pass/fail status in the Markdown map.
8. Check Profile 9 availability only if UI evidence is authorized:

   ```bash
   curl -fsS http://127.0.0.1:9229/json/version
   ```

   If unavailable, record `profile9=blocked_cdp_unavailable`. Do not launch or attach another profile without user approval. If reachable, verify the inspected tab is on `app.gohighlevel.com` for location `hHLZC7FaTtUINPf3cbHd` before reading anything.
9. If Profile 9 is unavailable, mark internals as blocked rather than substituting another browser profile.
10. Update `CHANGELOG.md` with this template:

   ```markdown
   - Read-only GHL workflow map for PatronPro onboarding (`ppweb-0ka.1`): N proven, M partial, K blocked, J not_found; read-only pass only, no UI navigation of mutation-capable controls and no Save/Publish/Send/Delete action performed, contrasting with the prior 2026-06-10 UI-driven Add Contact/language/DND mutation work. Artifacts: `...api-probe...json`, `...workflow-map...md`; validator: PASS|FAIL.
   ```

11. Update `ppweb-0ka.1` with artifact paths, validator result, and any triggered follow-up bead id.

## 401/403 Token Scope Contingency

If GHL returns 401 or 403:

- Store only the status code and a safe summary: `api_probe=blocked_location_token_scope`.
- Do not store the response body unless it is reduced to a non-identifying class such as `unauthorized`, `forbidden`, or `scope_missing`.
- Do not retry with personal tokens, alternate locations, Windows Chrome, or Oscar profiles.
- Do not infer `not_found`; the workflow collection was not readable.
- Create or trigger follow-up bead `ppweb-0ka.4` to request a location-scoped PatronPro main-location token from the GHL agency or authorized owner.
- If RLM-prior evidence exists, write a prior-only map for context but keep `ppweb-0ka.1` open unless the user explicitly accepts a prior-evidence-only checkpoint.

## Close Criteria Decision Tree

Use this decision tree after artifact generation:

1. If any live mutation occurred, any secret/PII leaked into artifacts, or validation found prohibited auth/session data, keep `ppweb-0ka.1` open and stop implementation until cleanup is complete.
2. If the JSON or Markdown artifact cannot be written, or the validator fails, keep `ppweb-0ka.1` open.
3. If no complete API workflow collection is available and no separately authorized Profile 9 evidence exists:
   - If the map is RLM-prior-only, keep open unless the user explicitly accepts a prior-evidence-only checkpoint.
   - If the blocker is 401/403 or token scope, trigger `ppweb-0ka.4`.
   - If the blocker is missing `op`, missing 1Password auth, or field-label mismatch, keep open with the exact precondition blocker.
4. If a complete API workflow collection is parsed and target matching ran against the full collection:
   - Four `proven` or `partial` workflows: close `ppweb-0ka.1` after validator pass and record unresolved internals as next proof.
   - Any mix of `proven`, `partial`, and `not_found`: close after validator pass. `not_found` is terminal only because the full collection was parsed. If RLM prior expected the missing workflow, mark `fresh_api_contradicts_rlm_prior`.
   - Four `not_found`: close only if the parsed collection has a nonzero workflow inventory and target matching was audited against all workflow names; otherwise keep open as endpoint-shape or token-scope blocked.
   - Any workflow-level `blocked`: keep open unless the workflow itself is represented as `partial` and only nonessential trigger/action internals are blocked.
5. If Profile 9 UI evidence is authorized but CDP is unavailable:
   - Close only if the API map is complete enough under rule 4.
   - Otherwise keep open with `profile9=blocked_cdp_unavailable` and name the next proof needed.

## Acceptance Criteria

- The four target workflows are each represented in the map, even if the outcome is `not_found` or `blocked`.
- The artifact names, location id, branch, and bead id are explicit.
- API evidence is redacted and contains no token, cookie, localStorage, session header, password, or Google/GHL account state.
- The report states whether each trigger/action/email-send boundary is proven, partial, or blocked.
- The report identifies the missing meeting-invite gap and ties it to the future `ppweb-0ka.2` and `ppweb-0ka.3` slices.
- The report explicitly says no live GHL mutation was performed.
- The JSON artifact includes a no-mutation proof field based on two read-only workflow metadata hashes using `workflow-target-metadata-v1`, or a precise blocker if the second read cannot be performed.
- Safe rate-limit headers are stored only under the strict `x-ratelimit-*` allowlist, or omitted with an explicit safety reason.
- If Profile 9 is unavailable, the blocker is exact: not running, CDP unavailable, unauthenticated, wrong location, or Chrome launch failure.
- If GHL returns 401/403, the artifact records `blocked_location_token_scope` and the bead update triggers follow-up `ppweb-0ka.4`.
- The generated artifact validator passes and its result is recorded.
- The report preserves the exact observed spelling `Onboaring` if that is what GHL/RLM returns; do not silently correct it.

## Failure Modes

- Missing GHL credentials: produce RLM-prior-only map with `api_probe=blocked_missing_credentials`.
- 401/403 from GHL: store status code and safe response class only, set `api_probe=blocked_location_token_scope`, trigger `ppweb-0ka.4`, and do not mark workflows `not_found`.
- Endpoint shape drift: store top-level keys and mark parsing blocked; do not guess fields.
- Rate limiting: store status and safe `x-ratelimit-*` headers only; retry is not required for this documentation pass.
- Browser unavailable: stop UI work and record Profile 9 blocker.
- 1Password unavailable or field path mismatch: store `api_probe=blocked_1password_access` or `blocked_1password_field_path` and continue only with RLM-prior evidence.
- Validator failure: keep the bead open and fix the artifact or validator before closing.
- Hash mismatch between two read-only GETs: store both hashes, mark `noMutationProof.status = "hashes_differ_after_read_only_gets"`, do not claim mutation proof, and keep open unless the diff is explained by timestamp/version drift in safe metadata.
- Artifact retention: files under `dev/agents/artifacts/doc/test/onboarding-automation/` are git-tracked work-session evidence unless a later PII review flags them. Redacted metadata artifacts are safe to commit; unredacted artifacts must stay out of git and out of RLM.

## Score Target

This PRD should score at least 46/50:

- Completeness: all four workflows, API/UI paths, blockers, token-scope contingency, and next proof are covered.
- Clarity: source-of-truth, literal typo handling, safe headers, status semantics, and blocked boundaries are explicit.
- Actionability: artifact paths, commands, validation, CHANGELOG wording, and follow-up bead triggers are concrete.
- Testability: artifacts are machine-checkable, hash canonicalization is deterministic, and close criteria are decision-tree based.
- Safety: no mutation, no secrets, no unsafe headers, no profile fallback, and no unsupported 401/403 workaround.

## Self-Assessment

- Completeness: 10/10
- Clarity: 10/10
- Actionability: 10/10
- Testability: 9/10
- Safety: 10/10

Total: 49/50

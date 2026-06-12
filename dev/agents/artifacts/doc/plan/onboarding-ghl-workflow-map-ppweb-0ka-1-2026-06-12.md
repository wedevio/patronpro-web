# Onboarding GHL Workflow Map PRD

Date: 2026-06-12
Bead: `ppweb-0ka.1`
Epic: `ppweb-0ka`
Repo: `/home/oz/projects/2026/onboarding-automation`
Branch: `feature/onboarding-automation`
Artifact role: quality-loop PRD for read-only GHL workflow reconnaissance
Artifact status: revised after Mini sage blocking review

## Goal

Produce a read-only workflow map for PatronPro's current onboarding automations so the Monday onboarding invite PoC starts from observed GHL behavior, not assumptions. The map must show what the public API proves, what the UI/export path still needs to prove, and where the missing meeting-invite/calendar-add flow belongs.

## Scope

Document these main-location workflows in Patron Pro location `hHLZC7FaTtUINPf3cbHd`:

- `1. Onboaring Link Send`
- `2. Onboarding Email Automation`
- `2.5 Onboarding Appointment Completed`
- `3. Onboarding Meeting Requirements Email`

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

- No live GHL mutation. Do not click Save, Publish, Send, Delete, Submit, or Approve.
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

Optional files if Profile 9 is authenticated and reachable in a later approved pass:

- `ghl-onboarding-workflows-profile9-map-2026-06-12.json`

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

Use these status values:

- `proven`: directly observed from API/UI/export evidence
- `partial`: metadata observed but trigger/action internals not available
- `blocked`: needed access path missing
- `not_found`: expected workflow absent from returned data

Meeting-invite gap rubric:

- `gap_proven`: workflow internals show a client-facing appointment/onboarding email is sent but no `.ics`, hosted ICS URL, Google/Microsoft/Apple/Zoho add-link, or equivalent calendar-add instruction is present.
- `gap_partial`: metadata and RLM prior indicate the workflow belongs to onboarding, but trigger/action internals are unavailable, so the report can only identify the likely gap slot.
- `gap_not_applicable`: workflow is unrelated to appointment preparation or client meeting reminders.
- `gap_blocked`: no live or prior evidence is sufficient to classify the gap.

Expected future ownership:

- `ppweb-0ka.2` owns deterministic universal invite generation: ICS file plus Google/Microsoft/Apple/iOS/Zoho links.
- `ppweb-0ka.3` owns the Monday PoC panel where an operator previews/downloads/tests those invite artifacts without mutating GHL.

## Implementation Plan

1. Run a read-only API probe for `GET /workflows/?locationId=hHLZC7FaTtUINPf3cbHd` if GHL credentials can be injected safely.
2. Use the 1Password service account only through command substitution or `op read`; never echo the secret. Expected field path:

   ```bash
   op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken"
   ```

   If that field path fails, inspect field names only with `op item get ... | jq` and do not print field values.
3. Probe command shape:

   ```bash
   GHL_LOCATION_PIT="$(op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken")" \
   bun dev/agents/artifacts/script/onboarding-automation/ghl-workflow-map.mjs \
     --location hHLZC7FaTtUINPf3cbHd \
     --out dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json
   ```

   The helper must use `Authorization: Bearer <token>`, `Version: 2021-07-28`, a 15s timeout, and no user-agent secrets. If the helper is not created, use a one-off `node`/`bun` probe with the same output shape and redaction rules.
4. Store a redacted JSON artifact containing only workflow metadata, top-level response keys, status code, safe rate-limit headers, and probe status. Never store raw auth headers, request headers, token-bearing command output, or unredacted response bodies.
5. Include `preRunHash` and `postRunHash` of the normalized target workflow metadata from two consecutive `GET /workflows/` reads. If both reads succeed and hashes match, set `noMutationProof.status = "hashes_match_after_read_only_gets"`. If the second read fails, set `noMutationProof.status = "blocked_post_read_failed"` and do not assert mutation proof.
6. Build the Markdown workflow map from the fresh probe plus the RLM prior if live credentials are unavailable.
7. Check Profile 9 availability only if UI evidence is authorized:

   ```bash
   curl -fsS http://127.0.0.1:9229/json/version
   ```

   If unavailable, record `profile9=blocked_cdp_unavailable`. Do not launch or attach another profile without user approval.
8. If Profile 9 is unavailable, mark internals as blocked rather than substituting another browser profile.
9. Update `CHANGELOG.md` with this template:

   ```markdown
   - Read-only GHL workflow map for PatronPro onboarding (`ppweb-0ka.1`): N proven, M partial, K blocked, J not_found; no Save/Publish/Send/Delete action performed. Artifacts: `...api-probe...json`, `...workflow-map...md`.
   ```

10. Update `ppweb-0ka.1` with artifact paths.

Close criteria:

- Close if all four target workflows are represented and every unproven trigger/action field is explicitly `partial`, `blocked`, or `not_found` with next proof needed.
- Keep open if the artifact cannot be written, if no source at all can represent the four workflows, if secret/PII redaction fails, or if any live mutation occurs.
- If the map is RLM-prior-only because API auth fails, keep the bead open unless the user explicitly accepts a prior-evidence-only checkpoint.

## Acceptance Criteria

- The four target workflows are each represented in the map, even if the outcome is `not_found` or `blocked`.
- The artifact names, location id, branch, and bead id are explicit.
- API evidence is redacted and contains no token, cookie, localStorage, session header, password, or Google/GHL account state.
- The report states whether each trigger/action/email-send boundary is proven, partial, or blocked.
- The report identifies the missing meeting-invite gap and ties it to the future `ppweb-0ka.2` and `ppweb-0ka.3` slices.
- The report explicitly says no live GHL mutation was performed.
- The JSON artifact includes a no-mutation proof field based on two read-only workflow metadata hashes, or a precise blocker if the second read cannot be performed.
- If Profile 9 is unavailable, the blocker is exact: not running, CDP unavailable, unauthenticated, or Chrome launch failure.
- The report preserves the exact observed spelling `Onboaring` if that is what GHL/RLM returns; do not silently correct it.

## Failure Modes

- Missing GHL credentials: produce RLM-prior-only map with `api_probe=blocked_missing_credentials`.
- 401/403 from GHL: store status code and safe response summary only.
- Endpoint shape drift: store top-level keys and mark parsing blocked; do not guess fields.
- Rate limiting: store status and rate-limit headers if safe; retry is not required for this documentation pass.
- Browser unavailable: stop UI work and record Profile 9 blocker.
- 1Password unavailable or field path mismatch: store `api_probe=blocked_1password_access` or `blocked_1password_field_path` and continue only with RLM-prior evidence.
- Artifact retention: files under `dev/agents/artifacts/doc/test/onboarding-automation/` are git-tracked work-session evidence unless a later PII review flags them. Redacted metadata artifacts are safe to commit; unredacted artifacts must stay out of git and out of RLM.

## Score Target

This PRD should score at least 46/50:

- Completeness: all four workflows, API/UI/export paths, blockers, and next proof are covered.
- Clarity: source-of-truth and blocked boundaries are explicit.
- Actionability: artifact paths and commands are concrete.
- Testability: artifacts are machine-checkable and safe to diff.
- Safety: no mutation, no secrets, no profile fallback.

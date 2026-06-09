Reviewed both files. Findings below, grouped by category, with file/section refs and severity (Critical / High / Medium / Low).

## Bugs

**H1. PUT body re-sends `isActive`, violating "owner ≠ activation" guardrail** — `liverpool-digital-automation.mjs:699-701`
- The apply-mode PUT to `/calendars/{id}` sends `{ teamMembers, isActive: calendar.isActive }`. The PRD §"Guardrails" explicitly says *"Keep calendar owner assignment separate from calendar activation."* Even if `isActive` is the current value, the script (a) re-asserts the field every apply, (b) could trigger GHL side effects (re-activation, audit re-fires), (c) prevents idempotent future split. Drop the field from the body.

**H2. `eligible` logic permits destructive overwrite of duplicate-member calendars** — `liverpool-digital-automation.mjs:633-649`
- When a calendar has `teamMembers: [u1, u1]` (main user twice), `hasDifferentMember=false`, `length !== 1`, so `alreadyAssigned=false` and `eligible=true`. The PUT then reduces 2→1. The PRD §"App Automation Candidates #3" says *"no overwrite of different existing members"* — extend this to *"no silent reduction of any teamMembers array"*.

**M1. `parseArgs` accepts adjacent flag as value** — `liverpool-digital-automation.mjs:70-74`
- `args.locationId = argv[++i] ?? args.locationId` — `??` only catches `null/undefined`. `--location --client foo` makes `args.locationId = "--client"`. Same for `--client`, `--out`, `--out-dir`. Reject values that start with `-`.

**M2. `normalizeCustomValues` silently drops unknown keys** — `liverpool-digital-automation.mjs:141-154`
- Only fields matching `CORE_CUSTOM_VALUES ∪ LANDING_CUSTOM_VALUES ∪ PUBLICATION_CUSTOM_VALUES` survive the filter. Custom values not on the list (e.g., a future `company_phone_v2`) vanish from the QC report without warning. Add a "unrecognized custom values" bucket in the output.

**M3. `fetchUsers` requires `companyId` but doesn't fall back to sub-account** — `liverpool-digital-automation.mjs:252-257`
- Locations with a sub-account (agency-managed) may not expose `companyId` on the location payload. The script returns blocked. No fallback to agency-level user search. Document this limitation or add a `--company-id` override.

**L1. `firstWebsite` sort is unstable when both timestamps are NaN** — `liverpool-digital-automation.mjs:274-284`
- Edge case only. Worth a comment or explicit `?? Date.now()` fallback.

## Missing QA Gates

**H3. No pre-apply confirmation prompt** — `liverpool-digital-automation.mjs:670-738`
- `assignCalendarOwner --apply` proceeds immediately after reading the plan. The script emits a dry-run plan first when invoked without `--apply`, but `apply` is a one-shot. Add an `--yes`/`--force` flag pattern so the plan output must be explicitly confirmed.

**H4. No audit trail for live mutations** — `liverpool-digital-automation.mjs` (whole file)
- Apply mode records no `actor`, `host`, `git rev`, `command line`, or timestamp of the run (only the pre-generated `generatedAt`). For productization, append an immutable `audit.jsonl` with `{ts, actor, host, command, args, beforeState, afterState, resultHash}`.

**H5. No rollback command** — `liverpool-digital-automation.mjs` (no `revert-calendar-owner`)
- If `--apply` overwrites a calendar's team members, the only recovery is reading the previous state from a manual GHL snapshot. Add `revert-calendar-owner` that uses the captured `currentTeamMemberIds` from the most recent plan artifact (the script already captures it but throws it away after verification).

**M4. No retry on 5xx / 429** — `liverpool-digital-automation.mjs:187-214, 695-702`
- A single transient failure in a multi-calendar apply produces a partially-updated location. At minimum, retry once with backoff and surface 429s explicitly.

**M5. No rate-limit awareness** — `liverpool-digital-automation.mjs:670-710`
- GHL enforces per-token rate limits. The script fires all calendar PUTs serially with no delay. Add a `--rate` flag and/or honor `Retry-After`.

**M6. No `field-mask`/etag protection on calendar PUT** — `liverpool-digital-automation.mjs:695-702`
- If a calendar's `isActive` or schedule changes between read and write, the script silently overwrites. Capture `updatedAt` on read and require it unchanged (or warn) before PUT.

**M7. No schema validation of GHL responses** — `liverpool-digital-automation.mjs` (all `ghlFetch` callers)
- Shapes like `body.calendars` vs `body.data`, `body.users` vs `body.data`, `body.numbers` vs `body.data` are probed ad-hoc. A future GHL response change yields silent `pass`/`fail` transitions (e.g., phone system returning nested data). Define a zod-like runtime check for each endpoint and fail loud on shape drift.

**L2. No fixture-based regression suite** — `liverpool-digital-automation.mjs` (no `*.test.*` nearby)
- "Deterministic and idempotent" is a quality-gate criterion, but there's no recorded JSON to replay. Add fixtures under `dev/agents/artifacts/fixture/liverpool-digital/` and a `bun test` that runs the harness against them.

## Unsafe Live Mutations

**C1. Calendar owner apply mutates non-target fields** (see H1) — Severity promoted to Critical because it directly contradicts a stated safety guardrail. Drop `isActive` from the PUT body.

**C2. `--out` path is unrestricted** — `liverpool-digital-automation.mjs:805-815`
- `resolve(args.out)` accepts absolute paths and `..` traversal. `bun script.mjs qc --out /etc/cron.d/payload` would write a JSON blob into a privileged location. Resolve to a base directory (default `dev/agents/artifacts/doc/test/liverpool-digital`) and reject paths outside.

**H6. `export-docs` overwrites without confirmation** — `liverpool-digital-automation.mjs:740-793`
- `mkdir({recursive})` + `writeFile` silently clobbers existing `doc-pages.json` / `doc-pages.md`. If the operator's local copy diverges from Supabase, the local copy is gone.

**M8. PII in stdout / file output is unredacted** — `liverpool-digital-automation.mjs:805-815`, `liverpool-digital-automation.mjs:330-580` (QC report contents)
- QC report includes `submission.email`, `submission.business_name`, `phoneNumbers`, `location.email`, etc. If `--out` is omitted, the JSON prints to the terminal/CI log. Add a `--redact` mode that masks emails, phones, and contact IDs for non-audit contexts. The PRD §"Guardrails" says "Never print, store, or commit API tokens" — extend the principle to PII.

**M9. No `--dry-run` global flag** — `liverpool-digital-automation.mjs:57-80`
- The dry-run default exists for `assign-calendar-owner` only. `export-docs` always writes. A consistent global `--dry-run` would prevent accidental writes from CI mistakes.

## Documentation Gaps

**H7. PRD "score: 88/100" has no rubric** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:141-143`
- The quality-gate section lists six criteria but doesn't map them to a 0-100 scale, weighting, or how to reproduce the 88. Add a scoring template (e.g., 6 dims × ~16.6 pts each, or weighted), and have the script compute it from `results[]` so the number is auditable.

**H8. PRD does not define "blocked" vs "fail"** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md` (no occurrence)
- The script uses both statuses (e.g., `qc` rows 364-368, 370-374). The PRD is silent on what differentiates them or how each should be treated in the activation gate. Add: `blocked = prerequisite missing, retry when env is fixed; fail = prerequisite OK but system state is wrong, requires human action`.

**H9. PRD references "Anexo C" without providing it** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:115`
- Item 10 of the To-Do list defers pause mechanism, prep email, portal process, final QA owner, and communications workflow mapping to Anexo C. Productization cannot complete without these. Either link the actual annex or extract the five items into the PRD.

**H10. PRD gives no on-boarding instructions for a new client** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md` (entire file)
- `DEFAULT_LOCATION_ID` is hardcoded; the script accepts `--location`, but the PRD never describes how to set up a new location, what custom value schema to seed, or what the per-client config file should contain. This blocks reusing the harness beyond Liverpool Digital.

**M10. No exit-code contract** — `liverpool-digital-automation.mjs:859-862`
- `process.exit(1)` is the only non-zero exit. CI cannot distinguish "bad args" from "GHL 5xx" from "Supabase blocked". Define: 0 = pass, 1 = unhandled, 2 = user error, 3 = upstream API error, 4 = precondition blocked.

**M11. No CLI examples in script header** — `liverpool-digital-automation.mjs:1-10`
- Only the `--help` output documents usage. Add a top-of-file doc comment with 3-4 invocations: dry-run, apply, export-docs, CI integration.

**M12. Two `GHL_VERSION` constants, no explanation** — `liverpool-digital-automation.mjs:8-9, 237, 241, 696`
- `2021-07-28` (default) vs `2021-04-15` (calendars) vs `2023-02-21` (phone). Why three? Which is current? When does each deprecate? Comment or ADR.

**M13. Logo custom value "Pass" entry has no script-side implementation** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:37`
- The successful-automation table credits a prior RLM checkpoint for setting `logo` from `logo_cuadrado`. The current script has no `set-custom-value` command. The PRD's "App Automation Candidates #2" promises one. For productization, the script must implement what the PRD claims works.

**M14. PRD does not document `ob-meeting-ok` workflow trigger** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:81` and `liverpool-digital-automation.mjs:555`
- The regex includes this tag literally; the PRD says it should be verified in UI but doesn't document what creates/triggers it. If the workflow is renamed, the script silently fails this gate. Reference the canonical workflow spec or expose the expected workflow names as a configurable list.

**L3. No ADR for PUT-vs-PATCH choice** — `liverpool-digital-automation.mjs:695`
- `/calendars/{id}` PUT semantics are unspecified in the doc — does GHL treat the body as a full replacement or a partial update? This bears on H1 and M6.

**L4. "Final QA" undefined** — `liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:21, 102`
- The guardrail says "activation only after final QA", and §8.2 says "Only after all critical QA rows pass". Which rows are critical? The QC report has 14+ rows. A gating expression (e.g., `results.every(r => r.status === 'pass' || r.id in allowedDeferred)`) is missing.

**L5. No retention/deletion policy for output artifacts** — `liverpool-digital-automation.mjs` and PRD
- QC reports and apply logs are written to `dev/agents/artifacts/doc/test/liverpool-digital/` and may contain PII (M8). No policy for when to delete, where to archive, or how to handle the data subject's right-to-delete requests.

## Summary

- **Critical (2):** C1 isActive-in-PUT, C2 unrestricted `--out` path
- **High (10):** H1-H10 — calendar overwrite logic, missing audit/rollback/confirmation/rubric/annex/onboarding
- **Medium (12):** M1-M12 — arg parsing, response schemas, PII, exit codes, multi-version GHL
- **Low (5):** L1-L5 — sort stability, ADR, "final QA" definition, retention, test fixtures

The script is well-structured (parallel reads, dry-run default, defensive blocked/fail/pass trinary). The two blockers for productization are **(a) H7/H8/H9 — incomplete PRD**, and **(b) C1/H1/H2/H6 — apply-mode mutates fields it shouldn't and writes paths it shouldn't**. Fix the apply path and the PRD's scoring rubric, and the harness is close to shippable.

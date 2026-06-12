# Merge: ppweb-0ka.4 Google Meet Calendar API PRD

Input PRD: `dev/agents/artifacts/doc/plan/onboarding-google-meet-calendar-api-ppweb-0ka-4-2026-06-12.md`
Mini review: `dev/agents/artifacts/doc/sages/onboarding-google-meet-calendar-api-ppweb-0ka-4-20260612/sage-mini.md`
Mini score: 38/50

## MUST FIX

1. Clarify `conferenceData.createRequest.requestId` lifecycle:
   - Dry-run may be deterministic for reproducible artifacts.
   - Live mode must regenerate a fresh UUID-style request ID at the dry-run/live boundary.
   - Live mode must refuse literal placeholders such as `fresh-unique-request-id` or `REPLACE_BEFORE_LIVE_USE`.
   - Collision concern belongs to the conference create request for the same organizer/calendar; cross-organizer reuse does not link conferences.

2. Reframe conference generation timing:
   - `events.insert` commonly returns Meet details synchronously when `conferenceDataVersion=1`.
   - The adapter must still treat conference data as eventually consistent and verify `conferenceData.createRequest.status.statusCode` plus `conferenceData.entryPoints`.

3. Make live approval operational:
   - Require `--execute`, `--confirm-live`, explicit credentials path, and a non-empty local confirmation token/env var before any network call.
   - Live send behavior must be displayed before execution.

4. Add PII guardrails:
   - Dry-run output must redact attendee emails by default.
   - `--show-pii` may expose local terminal output for operator debugging.
   - RLM and committed artifacts must use redacted payloads.

5. Tighten time handling:
   - Reject timezone-naive `dateTime`.
   - Require IANA `timeZone`.
   - Explain that Google interprets timed events against the `timeZone`; offsets must match the intended booking instant.

6. Tighten testing:
   - Include CLI output schema expectations.
   - Add negative cases for unsafe live flags and non-none `sendUpdates` without approval.
   - Verify `conferenceDataVersion` equals `1`, not just present.

## SHOULD FIX

1. Document `useDefault: false` as required for reminder overrides.
2. Include `extendedProperties.private` for PatronPro/GHL correlation IDs instead of relying on Google Calendar as source of truth.
3. Scope the PoC to single timed events; all-day and recurring events are out of scope.
4. Note that `organizer` is derived from the OAuth principal, not set arbitrarily by the request body.
5. Warn that Calendar scopes can require OAuth verification for external rollout.
6. Mention rate-limit/backoff behavior for a future batch executor.

## NOT FIXING

1. Mini suggested `iCalUID` as event idempotency. The Google insert reference distinguishes event `id` and `icalUID`; `icalUID` should not be supplied at event creation. Use `extendedProperties.private` for PatronPro correlation and a future event-id strategy only after a live sync design is approved.
2. Mini's Mexico City DST statement is historically useful but too broad for a general Calendar adapter. The improved PRD should require IANA timezone validation and offset-aware inputs without hard-coding a Mexico-only calendar rule.

## Approval Target

CE merge must produce an improved PRD scored at least 46/50 and ready for implementation of the dry-run Python skeleton plus research note.

# PRD: Google Meet creation through Google Calendar API

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.4`
Date: 2026-06-12
Status: Improved PRD after CE merge pass

## Goal

Produce a research-backed, deterministic PoC lane for creating organizer-owned Google Meet links through the Google Calendar API without making Google Calendar the PatronPro appointment source of truth.

This bead does not authorize live API calls, does not create real calendar events, does not send invite notifications, and does not mutate GHL, Google, Supabase, email, or PatronPro panel data. The deliverable is a source-cited research note plus a Python-first dry-run skeleton that shows the exact `events.insert` payload, query parameters, OAuth checklist, response parsing, and future execution guardrails.

## Source Baseline

Official Google docs checked on 2026-06-12:

- Events insert reference: `https://developers.google.com/workspace/calendar/api/v3/reference/events/insert`
- Events resource reference: `https://developers.google.com/workspace/calendar/api/v3/reference/events`
- Create events guide: `https://developers.google.com/workspace/calendar/api/guides/create-events`
- Python quickstart: `https://developers.google.com/workspace/calendar/api/quickstart/python`
- Create credentials guide: `https://developers.google.com/workspace/guides/create-credentials`

Key official findings:

- Event creation endpoint is `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`.
- `conferenceDataVersion=1` is required to create or preserve conference data through event modification requests. For this PoC, the only accepted value is exactly `1`; omission or any other value is a contract failure.
- Google Meet creation is requested in the event body with `conferenceData.createRequest`.
- `conferenceData.createRequest.conferenceSolutionKey.type` should be `hangoutsMeet` for Google Meet.
- `conferenceData.createRequest.requestId` is the client-generated unique ID for the conference creation request, not the event ID. Reusing the same request ID for a new conference request on the same organizer/calendar can cause Google to ignore the repeated conference creation request. Cross-organizer reuse does not link conferences.
- `events.insert` commonly returns Meet details synchronously when `conferenceDataVersion=1`, but the adapter must still treat conference data as eventually consistent. It must verify `conferenceData.createRequest.status.statusCode` and `conferenceData.entryPoints`, then support a future read-after-write verification if entry points are absent from the initial response.
- `sendUpdates` must be selected intentionally. Values are `all`, `externalOnly`, or `none`; `none` can harm external sync and still creates a calendar event when a live request reaches Google. The PoC safety boundary is dry-run/no network execution, not `sendUpdates=none`.
- Insert requires authorization with at least one suitable Calendar scope. The broad documented create-events example uses `https://www.googleapis.com/auth/calendar`; the insert reference also lists narrower event-related scopes including `calendar.events`, `calendar.app.created`, and `calendar.events.owned`.
- Calendar write scopes can require Google's OAuth app verification before external production rollout. Internal PoC testing should use a test-user allowlist and document the verification path before any customer-facing flow.
- Python quickstart uses local OAuth credentials and `token.json`; the sample readonly scope must be changed for event creation and any existing stored token deleted when scopes change.

## Product Constraints

- GHL remains the appointment source of truth.
- The universal ICS/calendar-link generator from `ppweb-0ka.2` remains the default invite path.
- Google Calendar API is a future organizer-owned Meet creation adapter only.
- No live PatronPro, GHL, Google Calendar, email, or Supabase mutation in this bead.
- No secrets committed. `credentials.json`, `token.json`, OAuth refresh tokens, confirmation tokens, and service account keys must remain local ignored files.
- Low-volume PoC is Python-first. The app may later wrap this adapter from TypeScript, but the first experimental lane should be explicit and easy to run from a server or operator machine.
- The PoC is scoped to single timed onboarding events only. All-day events and recurring events are out of scope for this bead.

## Integration Boundary

PatronPro must continue to treat GHL appointment data as canonical. The Google Calendar event may store PatronPro/GHL correlation data only as metadata for lookup and reconciliation.

Required private correlation fields:

```json
{
  "extendedProperties": {
    "private": {
      "patronproSource": "onboarding-automation",
      "patronproBead": "ppweb-0ka.4",
      "ghlAppointmentId": "ghl_appt_demo_123",
      "patronproOnboardingId": "onboarding_demo_123"
    }
  }
}
```

Do not rely on Google Calendar `iCalUID` as the insertion idempotency strategy. The improved plan intentionally rejects supplying `iCalUID` during event creation; a future live sync design may define a Google event `id` strategy or a persistence table after live execution is approved.

## Proposed Deliverables

1. Research note:
   - Exact endpoint, query parameters, payload shape, scopes, credential flow, `sendUpdates` behavior, reminder fields, response parsing, correlation metadata, time handling, PII handling, and rate-limit posture.
   - Recommended PatronPro default: dry-run first; later live mode requires operator approval and OAuth credentials.

2. Python-first script skeleton:
   - Path: `dev/agents/artifacts/script/onboarding-automation/google_meet_calendar_poc.py`
   - Default mode: `--dry-run`, no network imports required.
   - Output: normalized JSON payload and request metadata for `events.insert`.
   - Dry-run request IDs may be deterministic for reproducible artifacts.
   - Live mode must regenerate a fresh UUID-style request ID at the dry-run/live boundary before sending any request.
   - Optional future live mode is guarded by all of:
     - `--execute`
     - `--confirm-live`
     - explicit `--credentials-path`
     - explicit `--token-path`
     - non-empty local confirmation env var, `PATRONPRO_GOOGLE_MEET_LIVE_TOKEN`
     - explicit `--allow-send-updates` whenever `sendUpdates` is not `none`

3. Test/verification:
   - `python3 -m py_compile dev/agents/artifacts/script/onboarding-automation/google_meet_calendar_poc.py`
   - Dry-run fixture command emits valid JSON matching the output schema below.
   - Negative tests cover unsafe live flags, placeholder request IDs, non-`none` `sendUpdates` without approval, timezone-naive input, missing IANA timezone, and `conferenceDataVersion` not equal to `1`.
   - No credential file is required for dry-run verification.

4. RLM checkpoint after implementation, not during this PRD-only merge pass:
   - Store the final research and skeleton notes with current branch, bead, source URLs, and rollback instruction.
   - Store only redacted payloads. Never store attendee email addresses, OAuth files, tokens, Google response headers, cookies, or provider credentials.

## CLI Contract

Target command shape for dry-run:

```bash
python3 dev/agents/artifacts/script/onboarding-automation/google_meet_calendar_poc.py \
  --calendar-id primary \
  --summary "PatronPro Onboarding - Demo Auto Shop" \
  --description "Generated by PatronPro onboarding automation dry-run." \
  --start "2026-06-15T10:00:00-06:00" \
  --end "2026-06-15T11:00:00-06:00" \
  --timezone "America/Mexico_City" \
  --attendee-email "client@example.com" \
  --attendee-name "Demo Client" \
  --ghl-appointment-id "ghl_appt_demo_123" \
  --patronpro-onboarding-id "onboarding_demo_123" \
  --dry-run
```

Expected function boundaries:

- `parse_args(argv) -> argparse.Namespace`
- `validate_time_window(start: str, end: str, timezone: str) -> None`
- `redact_email(email: str) -> str`
- `build_dry_run_request_id(inputs: Mapping[str, str]) -> str`
- `build_live_request_id() -> str`
- `build_event_payload(args, request_id: str, redact_pii: bool) -> dict`
- `build_request_metadata(calendar_id: str, send_updates: str) -> dict`
- `validate_live_guards(args, env: Mapping[str, str]) -> None`
- `main(argv) -> int`

## Output Schema

Dry-run stdout must be one JSON object:

```json
{
  "mode": "dry-run",
  "piiRedacted": true,
  "request": {
    "method": "POST",
    "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "query": {
      "conferenceDataVersion": 1,
      "sendUpdates": "none"
    }
  },
  "event": {
    "summary": "PatronPro Onboarding - Demo Auto Shop",
    "description": "Generated by PatronPro onboarding automation dry-run.",
    "start": {
      "dateTime": "2026-06-15T10:00:00-06:00",
      "timeZone": "America/Mexico_City"
    },
    "end": {
      "dateTime": "2026-06-15T11:00:00-06:00",
      "timeZone": "America/Mexico_City"
    },
    "attendees": [
      {
        "email": "***@***",
        "displayName": "Demo Client"
      }
    ],
    "transparency": "opaque",
    "guestsCanInviteOthers": false,
    "guestsCanModify": false,
    "guestsCanSeeOtherGuests": false,
    "reminders": {
      "useDefault": false,
      "overrides": [
        {
          "method": "email",
          "minutes": 1440
        },
        {
          "method": "popup",
          "minutes": 60
        }
      ]
    },
    "extendedProperties": {
      "private": {
        "patronproSource": "onboarding-automation",
        "patronproBead": "ppweb-0ka.4",
        "ghlAppointmentId": "ghl_appt_demo_123",
        "patronproOnboardingId": "onboarding_demo_123"
      }
    },
    "conferenceData": {
      "createRequest": {
        "requestId": "dryrun_ppweb_0ka_4_20260615_100000_demo",
        "conferenceSolutionKey": {
          "type": "hangoutsMeet"
        }
      }
    }
  },
  "liveGuards": {
    "executeRequired": true,
    "confirmLiveRequired": true,
    "credentialsPathRequired": true,
    "tokenPathRequired": true,
    "confirmationEnvVar": "PATRONPRO_GOOGLE_MEET_LIVE_TOKEN",
    "allowSendUpdatesRequiredForNonNone": true
  }
}
```

Schema assertions:

- `mode` is `dry-run` unless `--execute` is explicitly approved in a future task.
- `request.query.conferenceDataVersion` is integer `1`.
- `request.query.sendUpdates` is one of `none`, `all`, or `externalOnly`.
- In dry-run, `request.query.sendUpdates` is metadata only; no HTTP request is made.
- `event.conferenceData.createRequest.conferenceSolutionKey.type` equals `hangoutsMeet`.
- `event.conferenceData.createRequest.requestId` is non-empty and is never the literal `fresh-unique-request-id` or `REPLACE_BEFORE_LIVE_USE`.
- `event.start.dateTime` and `event.end.dateTime` include numeric UTC offsets.
- `event.start.timeZone` and `event.end.timeZone` are valid IANA timezone names and match the provided `--timezone`.
- `event.attendees[].email` is redacted to `***@***` unless `--show-pii` is set.
- `event.reminders.useDefault` is `false`; otherwise Google ignores reminder `overrides`.

## Payload Contract

Minimum event body for the future live request:

```json
{
  "summary": "PatronPro Onboarding - Demo Auto Shop",
  "description": "Generated by PatronPro onboarding automation.",
  "start": {
    "dateTime": "2026-06-15T10:00:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "end": {
    "dateTime": "2026-06-15T11:00:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "attendees": [
    {
      "email": "client@example.com",
      "displayName": "Demo Client"
    }
  ],
  "transparency": "opaque",
  "guestsCanInviteOthers": false,
  "guestsCanModify": false,
  "guestsCanSeeOtherGuests": false,
  "reminders": {
    "useDefault": false,
    "overrides": [
      {
        "method": "email",
        "minutes": 1440
      },
      {
        "method": "popup",
        "minutes": 60
      }
    ]
  },
  "extendedProperties": {
    "private": {
      "patronproSource": "onboarding-automation",
      "patronproBead": "ppweb-0ka.4",
      "ghlAppointmentId": "ghl_appt_demo_123",
      "patronproOnboardingId": "onboarding_demo_123"
    }
  },
  "conferenceData": {
    "createRequest": {
      "requestId": "GENERATED_UUID_V4_AT_LIVE_EXECUTION_BOUNDARY",
      "conferenceSolutionKey": {
        "type": "hangoutsMeet"
      }
    }
  }
}
```

Request metadata:

```json
{
  "method": "POST",
  "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  "query": {
    "conferenceDataVersion": 1,
    "sendUpdates": "none"
  }
}
```

Time rules:

- Timed events must use `dateTime`; all-day `date` events are out of scope.
- `dateTime` values must include a UTC offset.
- `timeZone` must be a valid IANA timezone.
- The script must reject timezone-naive input such as `2026-06-15T10:00:00`.
- The script must reject start/end values whose offset conflicts with the intended booking instant for the supplied IANA timezone.
- Google interprets timed events against the supplied `timeZone`; the numeric offset must be treated as part of validation, not as a substitute for the IANA timezone.

## Request ID Lifecycle

Dry-run behavior:

- Dry-run request IDs may be deterministic so artifacts are reproducible.
- The dry-run ID must be derived from non-secret stable inputs such as bead ID, appointment ID, local date/time, and a local salt.
- Dry-run IDs may appear in committed artifacts only if they contain no PII or secrets.

Future live behavior:

- Live mode must regenerate the request ID immediately before the Google API call.
- Live request IDs must be UUID-style random values, such as UUIDv4.
- Live mode must refuse placeholder or deterministic-looking values, including `fresh-unique-request-id`, `REPLACE_BEFORE_LIVE_USE`, and any dry-run prefix.
- Live mode must validate that `conferenceDataVersion` is exactly `1` before sending.
- If Google does not return Meet `entryPoints` in the initial response, the adapter must mark the result pending and perform a future explicit read-back check rather than assuming success.

## OAuth Checklist

Testing desktop-client path:

1. Create or select a Google Cloud project.
2. Enable Google Calendar API.
3. Configure Google Auth platform branding/consent for an internal test app where possible.
4. Create OAuth client ID as Desktop app for local PoC.
5. Save downloaded OAuth JSON outside the repo or under an ignored local path.
6. Use Calendar write scope for creation testing; delete any existing `token.json` if the scope changes.
7. Run only with a test calendar or test Google account.
8. Use the OAuth app test-user allowlist for internal testing. Do not present this as production-ready for external users until verification requirements for Calendar scopes are documented and approved.

Future server path:

- Web application OAuth client with authorized redirect URI, encrypted token storage, per-user consent, and audit log.
- `organizer` is derived from the OAuth principal/calendar owner. The API request body must not try to set an arbitrary organizer.
- Service account only if PatronPro has a Google Workspace domain-wide delegation model approved by an administrator; do not assume service accounts can write arbitrary consumer calendars.

## Live Execution Gates

Live mode is out of scope for this bead. If a later task enables it, the script must abort with non-zero exit unless all live gates pass:

- `--execute` is present.
- `--confirm-live` is present.
- `--credentials-path` points to a local OAuth credentials file outside committed artifacts.
- `--token-path` points to a local token file outside committed artifacts.
- `PATRONPRO_GOOGLE_MEET_LIVE_TOKEN` is present and non-empty in the local environment.
- If `--send-updates` is `all` or `externalOnly`, `--allow-send-updates` is present.
- The selected `sendUpdates` behavior is displayed before any network import or API call.
- The live request ID is freshly generated and passes placeholder/dry-run rejection.

## PII And Secret Guardrails

- Dry-run output must redact attendee email addresses by default.
- `--show-pii` may expose full attendee emails only to the local terminal for operator debugging.
- Committed artifacts, test fixtures, RLM stores, logs, and PR summaries must use redacted attendee email addresses.
- Never persist Google secrets in repo artifacts, tests, RLM, commits, or terminal transcripts intended for handoff.
- Do not log OAuth response headers, refresh tokens, cookies, localStorage, session headers, or provider credentials.

## Response Parsing Contract

When live execution is explicitly approved in a future task, capture only:

- Google event `id`
- `htmlLink`
- `hangoutLink` when present
- `conferenceData.createRequest.status.statusCode`
- `conferenceData.entryPoints[].entryPointType`
- `conferenceData.entryPoints[].uri`

Expected state handling:

- `success`: `statusCode` indicates success and at least one Meet web entry point is present.
- `pending`: event insert succeeded but Meet entry points are absent; schedule/read a follow-up event fetch.
- `failed`: Google returns an error, a non-success conference status, or missing required response fields after the allowed verification window.

External attendees may not have Google accounts. The adapter should treat the Meet web URI from `entryPoints` as the shareable join link after live approval, while the default PatronPro invite path remains the existing ICS/calendar-link generator.

## Operational Notes

- This PoC is low-volume and should not include a batch executor.
- A future batch/live executor must throttle writes, back off on Google `403 rateLimitExceeded` responses, and avoid retrying a conference create request with a stale `requestId`.
- Recurring onboarding sessions are out of scope. A future recurring-event design must create conference data on the parent recurring event, not ad hoc child instances.
- All-day events are out of scope because this adapter exists to create Meet links for timed onboarding sessions.

## Test Plan

Positive checks:

1. `python3 -m py_compile dev/agents/artifacts/script/onboarding-automation/google_meet_calendar_poc.py`
2. Run the dry-run fixture command from this PRD.
3. Parse stdout as JSON.
4. Assert:
   - `mode == "dry-run"`
   - `piiRedacted is true`
   - `request.method == "POST"`
   - `request.url` matches the Calendar events insert endpoint for the selected calendar.
   - `request.query.conferenceDataVersion == 1`
   - `request.query.sendUpdates in {"none", "all", "externalOnly"}`
   - `event.conferenceData.createRequest.conferenceSolutionKey.type == "hangoutsMeet"`
   - `event.conferenceData.createRequest.requestId` is not empty and is not a literal placeholder.
   - `event.start.dateTime` and `event.end.dateTime` are offset-aware.
   - `event.start.timeZone` and `event.end.timeZone` equal the requested IANA timezone.
   - `event.attendees[0].email == "***@***"` unless `--show-pii` is set.
   - `event.reminders.useDefault is false`
   - `event.extendedProperties.private.ghlAppointmentId` and `patronproOnboardingId` are present.

Negative checks:

1. `--execute` without `--confirm-live` exits non-zero before importing Google client libraries.
2. `--execute --confirm-live` without `--credentials-path` exits non-zero.
3. `--execute --confirm-live` without `--token-path` exits non-zero.
4. `--execute --confirm-live` without `PATRONPRO_GOOGLE_MEET_LIVE_TOKEN` exits non-zero.
5. `--send-updates all` or `--send-updates externalOnly` without `--allow-send-updates` exits non-zero.
6. A placeholder request ID such as `fresh-unique-request-id` or `REPLACE_BEFORE_LIVE_USE` exits non-zero in live mode.
7. A dry-run request ID prefix exits non-zero in live mode.
8. `conferenceDataVersion` omitted or set to anything other than integer `1` fails validation.
9. Timezone-naive start/end input exits non-zero.
10. Missing or invalid IANA timezone exits non-zero.
11. `useDefault: true` with reminder overrides fails local contract validation.

## Acceptance Criteria

- Research artifact documents official sources and exact Google Calendar API behavior for Meet creation.
- PRD clearly states that this bead permits dry-run artifact generation only and no live provider mutation.
- Script skeleton emits deterministic dry-run request JSON and has no live side effects.
- Dry-run output redacts attendee email addresses by default.
- Live-mode guardrails are explicit enough for implementation without guessing.
- Verification includes `python3 -m py_compile`, dry-run schema assertions, and negative safety cases.
- Bead is closed only after artifacts are reviewed, committed, pushed, and stored in RLM by a later implementation/checkpoint pass.

## Self-Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Completeness | 9/10 | Covers official sources, payload, OAuth, request ID lifecycle, response parsing, PII, time handling, correlation metadata, and scoped exclusions. |
| Clarity | 10/10 | Separates dry-run, future live behavior, product boundaries, and rejected idempotency assumptions. |
| Actionability | 9/10 | Provides command shape, function boundaries, output schema, payload contract, and exact guard conditions. |
| Testability | 10/10 | Adds positive and negative machine-checkable assertions, including unsafe live flags and timezone/request ID failures. |
| Safety | 10/10 | Preserves no-live-mutation scope, adds explicit live gates, redaction defaults, secret hygiene, and no reliance on `sendUpdates=none` as safety. |
| Total | 48/50 | Meets the >=46/50 quality-loop approval target. |

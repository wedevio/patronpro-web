# Onboarding Calendar Invite Generator PRD

Date: 2026-06-12
Bead: `ppweb-0ka.2`
Epic: `ppweb-0ka`
Repo: `/home/oz/projects/2026/onboarding-automation`
Branch: `feature/onboarding-automation`
Artifact role: quality-loop PRD for universal onboarding calendar invite generation
Artifact status: draft for Mini + CE review

## Goal

Create a deterministic onboarding meeting invite generator that takes a single PatronPro/GHL appointment-like payload and produces:

- RFC 5545-compatible `.ics` text.
- Data URL for direct `.ics` download/open behavior.
- Google Calendar prefill URL.
- Microsoft Outlook.com URL.
- Microsoft 365/Office URL.
- Apple/iOS fallback using the `.ics` output.
- Zoho/iCal fallback using the `.ics` output and documented user flow.

GHL remains the appointment source of truth. This generator creates client-facing add-to-calendar artifacts only; it must not create, mutate, reschedule, cancel, send, or sync GHL/Google/Microsoft/Zoho events.

## Source Evidence

- `ppweb-0ka.1` live read-only workflow evidence confirmed the current four GHL onboarding workflows but only at metadata level. Trigger/action internals are outside this slice.
- RLM main-account appointment pattern: onboarding appointments belong in PatronPro main GHL location `hHLZC7FaTtUINPf3cbHd`, calendar `D7x8ts5xcdNOWnd6Pjlq`, assignee `r2NA4HiIxWRvKwzuYpzv`.
- RLM add-to-calendar research recommends ICS first, provider-specific links second, and direct provider APIs only for advanced sync.
- Context7 Datebook docs for `/jshor/datebook` show Datebook can render iCalendar content and Google/Outlook/Yahoo URLs.
- Live package metadata checked 2026-06-12: `datebook` latest npm version `8.0.1`, MIT license, last publish about 3 years ago.

## Dependency Decision

Do not add `datebook` as a core dependency for this PoC slice.

Rationale:

- Datebook is MIT-friendly and remains a viable later candidate.
- The current slice needs explicit Zoho/iCal fallback and deterministic alarm/serialization tests.
- A small clean-room generator is easier to audit and avoids adding a stale dependency before Monday.
- `add-to-calendar-button` remains excluded as a core dependency because of Elastic License 2.0 restrictions.

## Input Contract

Add a library module under `src/lib/onboarding/calendar-invite.ts`.

Input:

- `id`: stable meeting/invite id.
- `title`: meeting title.
- `start`: timezone-aware ISO timestamp.
- `end`: timezone-aware ISO timestamp.
- `timeZone`: IANA timezone name for display and provider hints, defaulting to `America/Mexico_City`.
- `description`: client-facing event body.
- `location`: physical location or meeting URL.
- `joinUrl`: optional video/meeting URL.
- `organizerName` and `organizerEmail`: optional reply-to details.
- `attendeeName` and `attendeeEmail`: optional client attendee.
- `createdAt`: optional ISO timestamp for deterministic tests.
- `reminders`: defaults to 1 day, 1 hour, and 15 minutes.

Output:

- `icsText`
- `icsDataUrl`
- `fileName`
- `links.google`
- `links.outlook`
- `links.office365`
- `links.apple`
- `links.zoho`
- `links.ics`
- `providerNotes`

## ICS Requirements

- Use CRLF line endings.
- Include `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID`, `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`, one `VEVENT`, and `END:VCALENDAR`.
- Include `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION`, and `URL` when available.
- Include `ORGANIZER` and `ATTENDEE` when safe values are provided.
- Include three `VALARM` blocks by default:
  - `TRIGGER:-P1D`
  - `TRIGGER:-PT1H`
  - `TRIGGER:-PT15M`
- Escape ICS text values for comma, semicolon, backslash, and newlines.
- Fold lines at 75 octets or less where practical.
- Normalize event times to UTC `YYYYMMDDTHHMMSSZ` in the ICS. Preserve `timeZone` in provider links and notes.

## Provider URL Requirements

- Google Calendar URL uses `https://calendar.google.com/calendar/render?action=TEMPLATE`.
- Outlook.com URL uses `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent`.
- Office 365 URL uses `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent`.
- Apple/iOS returns the `icsDataUrl` fallback with a provider note explaining Apple Calendar consumes ICS rather than a stable public web prefill URL.
- Zoho returns the `icsDataUrl` fallback with a provider note explaining Zoho users should import/open the ICS unless a later Zoho-specific URL/API path is approved.
- Include description, location/join URL, and start/end times in all provider links that support them.

## Tests And Artifacts

Add focused tests under `tests/onboarding-calendar-invite.test.ts` using `bun test`.

Minimum assertions:

- ICS contains required calendar/event sections and CRLF endings.
- ICS includes all three reminder triggers.
- ICS escapes newline/comma/semicolon/backslash correctly.
- ICS has deterministic UID/DTSTAMP when `id` and `createdAt` are provided.
- Google, Outlook.com, and Office 365 URLs include expected host/path and encoded event values.
- Apple and Zoho fallback to the ICS data URL and include provider notes.
- Invalid start/end ordering throws a clear error.

Create one sample artifact:

- `dev/agents/artifacts/doc/test/onboarding-automation/onboarding-calendar-invite-sample-2026-06-12.json`

The sample should use non-secret, non-live demonstration data and include generated links plus a short ICS excerpt/checksum, not a real client appointment.

## Acceptance Criteria

- The generator is deterministic and does not require network, credentials, browser, GHL, Google, Microsoft, Apple, or Zoho access.
- Unit tests pass with `bun test tests/onboarding-calendar-invite.test.ts`.
- The sample artifact validates that one meeting payload produces ICS plus provider links.
- The license decision note is present in this PRD and later changelog/bead close note.
- No live calendar/provider/GHL mutation is performed.

## Failure Modes

- Invalid timestamps: throw `CalendarInviteValidationError`.
- End time not after start time: throw `CalendarInviteValidationError`.
- Missing title/id/start/end: throw `CalendarInviteValidationError`.
- Unsupported provider-specific behavior: keep provider fallback as ICS and record the limitation in `providerNotes`.
- If Datebook is later added, require a separate dependency/license review and keep current tests as regression fixtures.

## Score Target

This PRD should score at least 46/50:

- Completeness: ICS, provider links, fallbacks, tests, and sample artifact are covered.
- Clarity: no provider API mutation; clean-room dependency decision is explicit.
- Actionability: files, test command, and required fields are concrete.
- Testability: deterministic unit tests and sample artifact prove the behavior.
- Safety: no secrets, no live calendar writes, no GHL mutations.


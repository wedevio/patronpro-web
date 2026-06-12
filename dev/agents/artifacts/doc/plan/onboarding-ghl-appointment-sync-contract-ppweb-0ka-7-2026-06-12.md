# PRD: GHL source-of-truth appointment sync contract

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.7`
Date: 2026-06-12
Status: Draft for quality loop

## Goal

Define and implement a deterministic read/import contract for GoHighLevel onboarding appointments so the PoC can consume PatronPro meeting data without making Google Calendar, Postgres, or the local panel the scheduler.

GHL remains the source of truth. This slice must not create, update, delete, notify, or otherwise mutate GHL appointments.

## Source Evidence

Required RLM entries read:

- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/patronpro-main-account-onboarding-appoin--booking-pattern.md`
- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/gotchas/ghl-appointment-timezone-and-delete-readback-gotchas.md`
- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/highlevel-custom-appointment-date-api-pa-onboarding-tests.md`

Dependency beads read:

- `ppweb-9`: corrected main-account appointment proof and deleted-readback gotcha.
- `ppweb-an2`: rescheduled proof appointment `Cxa6iMN4am9r1XUdJWWS` to Friday 2026-06-12 11:00-12:00 CDMX.

Official HighLevel docs checked on 2026-06-12:

- `POST /calendars/events/appointments`: https://marketplace.gohighlevel.com/docs/ghl/calendars/create-appointment/
- `PUT /calendars/events/appointments/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/edit-appointment/
- `GET /calendars/events/appointments/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/get-appointment/
- `GET /calendars/events`: https://marketplace.gohighlevel.com/docs/ghl/calendars/get-calendar-events/
- `DELETE /calendars/events/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/delete-event/

## Fixed PatronPro Identifiers

- Main location: `hHLZC7FaTtUINPf3cbHd`
- Onboarding calendar: `D7x8ts5xcdNOWnd6Pjlq`
- Oscar assignee: `r2NA4HiIxWRvKwzuYpzv`
- Proof appointment: `Cxa6iMN4am9r1XUdJWWS`
- Proof contact: `rSBhh1nzHdjaRXOF3F0A`
- PoC timezone label: `America/Mexico_City`

## Contract

Create a TypeScript module:

`src/lib/onboarding/ghl-appointment-contract.ts`

It must export:

- constants for the fixed PatronPro GHL identifiers;
- a raw `GhlAppointmentReadback` shape with only fields this slice consumes;
- a normalized `OnboardingGhlAppointment` shape for PoC import;
- a validation error class;
- a function to normalize/read-validate a raw GHL appointment readback;
- a function to assert importability;
- an instant comparison helper for timezone-offset readbacks;
- a dry-run audit payload builder proving no mutation occurred.

Normalization rules:

1. Require a timezone-aware `startTime` and `endTime`.
2. Parse `startTime`/`endTime` as instants and require `endTime > startTime`.
3. Preserve raw strings and epoch milliseconds.
4. Validate `locationId`, `calendarId`, and `assignedUserId` against the fixed PatronPro main-account values.
5. Require `contactId` and appointment id.
6. Treat `deleted === true` as readable but not importable.
7. Return structured errors/warnings instead of silently accepting wrong-account or deleted appointments.
8. Never include API keys, request headers, cookies, browser state, or OAuth data in output payloads.

Dry-run audit rules:

- `mode` must be `dry-run`.
- `ghlMutation`, `googleCalendarMutation`, `emailSent`, and `databaseWrite` must all be `false`.
- Include `bead: "ppweb-0ka.7"`.
- Include enough IDs to trace the source appointment without exposing credentials.

## Tests

Add focused Bun tests:

`tests/onboarding-ghl-appointment-contract.test.ts`

Test cases:

- Accept the proof appointment shape when GHL returns `2026-06-12T10:00:00-07:00` for a slot expected as `2026-06-12T11:00:00-06:00`, because the instants match.
- Reject or mark non-importable wrong location/calendar/assignee IDs.
- Mark deleted readbacks non-importable even when the appointment payload is otherwise present.
- Reject timezone-naive timestamps and `endTime <= startTime`.
- Produce a dry-run audit payload with all mutation flags false.

## Research/Contract Artifact

Add a concise artifact:

`dev/agents/artifacts/doc/research/ghl-appointment-sync-contract-ppweb-0ka-7-2026-06-12.md`

It must document:

- GHL as source of truth.
- Endpoint family and official docs URLs.
- PatronPro fixed IDs.
- Field mapping from GHL readback to PoC appointment.
- Timezone instant comparison rule.
- Deleted appointment rule.
- Dry-run/no-mutation behavior.
- Known limitation: Google conference links may not be present in GHL appointment readback.

## Out of Scope

- Live GHL reads using credentials.
- Any GHL write/update/delete action.
- Google Calendar or Meet mutation.
- Email sending.
- Database persistence.
- Browser/Profile 9 UI automation.

## Acceptance Criteria

- Typed contract module exists and is deterministic.
- Focused tests pass with `bun test tests/onboarding-ghl-appointment-contract.test.ts`.
- The artifact documents the source-of-truth contract, IDs, endpoint docs, timezone/delete gotchas, and dry-run behavior.
- `ppweb-0ka.7` closes only after the tests and `git diff --check` pass.

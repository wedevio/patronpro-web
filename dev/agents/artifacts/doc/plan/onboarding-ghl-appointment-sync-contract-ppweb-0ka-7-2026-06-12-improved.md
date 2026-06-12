# PRD: GHL source-of-truth appointment sync contract

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.7`
Date: 2026-06-12
Status: Improved after Mini review; CE merge attempted but quota-blocked until 17:40 CST

## Goal

Implement a deterministic read/import contract for GoHighLevel onboarding appointments so the PoC can consume PatronPro meeting data without making Google Calendar, Postgres, or the local panel the scheduler.

GHL remains the source of truth. This slice is read-only: it must not create, update, delete, notify, email, persist, or mutate GHL appointments.

## Evidence

Required RLM entries read:

- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/patronpro-main-account-onboarding-appoin--booking-pattern.md`
- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/gotchas/ghl-appointment-timezone-and-delete-readback-gotchas.md`
- `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/highlevel-custom-appointment-date-api-pa-onboarding-tests.md`

Dependency beads read:

- `ppweb-9`: main-account appointment proof and deleted-readback gotcha.
- `ppweb-an2`: rescheduled proof appointment `Cxa6iMN4am9r1XUdJWWS` to Friday 2026-06-12 11:00-12:00 CDMX.

Official HighLevel docs checked on 2026-06-12:

- `POST /calendars/events/appointments`: https://marketplace.gohighlevel.com/docs/ghl/calendars/create-appointment/
- `PUT /calendars/events/appointments/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/edit-appointment/
- `GET /calendars/events/appointments/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/get-appointment/
- `GET /calendars/events`: https://marketplace.gohighlevel.com/docs/ghl/calendars/get-calendar-events/
- `DELETE /calendars/events/:eventId`: https://marketplace.gohighlevel.com/docs/ghl/calendars/delete-event/

Sibling contract context:

- `ppweb-0ka.4`: Google Meet/Calendar API remains a separate dry-run prototype track.
- `ppweb-0ka.5`: Postgres persistence is a later adapter target; this slice only emits deterministic import/audit payloads.

## Fixed PatronPro Identifiers

```ts
export const PATRONPRO_ONBOARDING_GHL = {
  locationId: "hHLZC7FaTtUINPf3cbHd",
  calendarId: "D7x8ts5xcdNOWnd6Pjlq",
  assignedUserId: "r2NA4HiIxWRvKwzuYpzv",
  proofAppointmentId: "Cxa6iMN4am9r1XUdJWWS",
  proofContactId: "rSBhh1nzHdjaRXOF3F0A",
  timeZone: "America/Mexico_City",
} as const;
```

## Type Contract

Create:

`src/lib/onboarding/ghl-appointment-contract.ts`

### Raw Readback

```ts
export interface GhlAppointmentReadback {
  id?: string;
  _id?: string;
  locationId?: string;
  calendarId?: string;
  contactId?: string;
  assignedUserId?: string;
  title?: string;
  appointmentStatus?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  source?: string;
  deleted?: boolean;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}
```

The index signature is intentional because GHL payloads can contain extra fields. The contract must whitelist output fields so credentials or headers cannot leak.

### Normalized Appointment

```ts
export interface OnboardingGhlAppointment {
  provider: "ghl";
  mode: "read-only-import";
  sourceOfTruth: "ghl-main-account";
  appointmentId: string;
  locationId: string;
  calendarId: string;
  contactId: string;
  assignedUserId: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  startEpochMs: number;
  endEpochMs: number;
  timeZone: "America/Mexico_City";
  joinUrl: string | null;
  deleted: boolean;
  importable: boolean;
  nonImportableReason: "deleted" | null;
  source: string | null;
  dateAdded: string | null;
  dateUpdated: string | null;
  readbackHash: string;
  warnings: string[];
}
```

### Error Codes

```ts
export type OnboardingGhlAppointmentErrorCode =
  | "wrong-account"
  | "deleted"
  | "naive-timestamp"
  | "inverted-range"
  | "missing-id"
  | "missing-contact"
  | "invalid-date";

export class OnboardingGhlAppointmentContractError extends Error {
  readonly code: OnboardingGhlAppointmentErrorCode;
}
```

Hard errors:

- missing appointment id;
- missing contact id;
- missing or mismatched `locationId`;
- missing or mismatched `calendarId`;
- missing or mismatched `assignedUserId`;
- timezone-naive or invalid `startTime`/`endTime`;
- `endTime <= startTime`;
- attempting to assert importability on a deleted appointment.

Warnings:

- missing `title`;
- missing `appointmentStatus`;
- missing `address`/join URL, because GHL may not expose Google conference links in readback.

## Function Signatures

```ts
export function sameInstant(leftIso: string, rightIso: string): boolean;

export function normalizeGhlOnboardingAppointment(
  readback: GhlAppointmentReadback,
  options?: { expectedStartTime?: string; expectedEndTime?: string }
): OnboardingGhlAppointment;

export function assertGhlOnboardingAppointmentImportable(
  appointment: OnboardingGhlAppointment
): OnboardingGhlAppointment;

export function buildGhlAppointmentImportAudit(
  appointment: OnboardingGhlAppointment,
  options?: { createdAt?: string }
): OnboardingGhlAppointmentImportAudit;
```

## Deleted Semantics

- `deleted === undefined`: active/readable and importable unless another hard error exists.
- `deleted === false`: active/readable and importable unless another hard error exists.
- `deleted === true`: readable but not importable. Normalization returns `importable: false` and `nonImportableReason: "deleted"`. `assertGhlOnboardingAppointmentImportable` throws `code: "deleted"`.

This reflects the observed GHL behavior where a deleted appointment can still read back with HTTP 200.

## Instant Comparison

The contract must compare instants, not raw timestamp strings.

Canonical proof:

- Expected CDMX: `2026-06-12T11:00:00-06:00` to `2026-06-12T12:00:00-06:00`
- GHL readback: `2026-06-12T10:00:00-07:00` to `2026-06-12T11:00:00-07:00`

Those are equal instants. Tests must prove `sameInstant` returns true for that pair and must prove raw string equality is false.

## Dry-Run Audit Payload

```ts
export interface OnboardingGhlAppointmentImportAudit {
  bead: "ppweb-0ka.7";
  mode: "dry-run";
  createdAt: string;
  source: {
    provider: "ghl";
    sourceOfTruth: "ghl-main-account";
    appointmentId: string;
    contactId: string;
    calendarId: string;
    locationId: string;
    assignedUserId: string;
    readbackHash: string;
  };
  status: {
    importable: boolean;
    nonImportableReason: "deleted" | null;
    ghlMutation: false;
    googleCalendarMutation: false;
    emailSent: false;
    databaseWrite: false;
  };
}
```

The audit payload must never include raw headers, API keys, cookies, bearer tokens, OAuth tokens, localStorage, or browser/session state.

## Tests

Create:

`tests/onboarding-ghl-appointment-contract.test.ts`

Required cases:

1. Normalizes the proof appointment fixture with GHL `-07:00` readback and expected CDMX `-06:00` times.
2. Proves offset-string divergence does not break instant equality.
3. Throws `wrong-account` for wrong `locationId`.
4. Throws `wrong-account` for wrong `calendarId`.
5. Throws `wrong-account` for wrong `assignedUserId`.
6. Treats `deleted === undefined` as importable.
7. Treats `deleted === true` as non-importable and throws `deleted` from `assertGhlOnboardingAppointmentImportable`.
8. Throws `naive-timestamp` for timezone-naive `startTime` or `endTime`.
9. Throws `inverted-range` when `endTime <= startTime`.
10. Throws `missing-id` and `missing-contact` for missing required IDs.
11. Produces a dry-run audit payload with all mutation flags false and `bead: "ppweb-0ka.7"`.
12. Scrubs untrusted raw fields such as `apiKey`, `authorization`, `cookie`, and `bearer` from normalized output and audit payload.

Use plain TypeScript guards and deterministic hashing instead of adding a new validation dependency.

## Research/Contract Artifact

Create:

`dev/agents/artifacts/doc/research/ghl-appointment-sync-contract-ppweb-0ka-7-2026-06-12.md`

It must document:

- GHL as source of truth.
- Official endpoint docs URLs.
- PatronPro fixed IDs.
- Field mapping from GHL readback to PoC appointment.
- Timezone instant comparison rule.
- Deleted appointment readback rule.
- Dry-run/no-mutation behavior.
- Known limitation: Google conference links may be missing from appointment readback.

## Out of Scope

- Live GHL reads using credentials.
- Any GHL create/update/delete action.
- Google Calendar or Meet mutation.
- Email sending.
- Database persistence.
- Browser/Profile 9 UI automation.

## Acceptance Criteria

- Typed contract module exists and exports the constants, shapes, error class, and functions above.
- Focused tests pass with `bun test tests/onboarding-ghl-appointment-contract.test.ts`.
- The research artifact documents the source-of-truth contract, IDs, endpoint docs, timezone/delete gotchas, and dry-run behavior.
- `git diff --check` passes.
- `ppweb-0ka.7` closes only after the above gates pass.

## Final Self-Assessment

| Dimension | Score | Rationale |
| --- | ---: | --- |
| Completeness | 10 | Covers source docs, dependency beads, fixed IDs, interfaces, errors, delete semantics, instant comparison, audit payload, tests, and artifact. |
| Clarity | 9 | Separates raw readback, normalized output, hard errors, warnings, and dry-run audit behavior. |
| Actionability | 10 | Provides exact file paths, interfaces, function signatures, and numbered test cases. |
| Testability | 10 | Every Mini blocker is mapped to a concrete Bun test. |
| Safety | 10 | Enforces wrong-account hard rejection, no-mutation audit flags, credential scrubbing, and deleted-readback handling. |
| Total | 49/50 | Approved target met despite CE quota block; Mini findings were applied manually. |

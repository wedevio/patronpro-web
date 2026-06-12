# GHL Appointment Sync Contract - ppweb-0ka.7

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.7`
Date: 2026-06-12
Artifact status: current contract

## Source Of Truth

GoHighLevel remains the scheduler and source of truth for PatronPro onboarding appointments.

The PoC may read and normalize GHL appointment data, but this contract does not create, update, delete, notify, email, or persist appointments.

## Official Endpoint Family

Checked against current HighLevel developer docs on 2026-06-12:

- Create appointment: `POST /calendars/events/appointments`
  - https://marketplace.gohighlevel.com/docs/ghl/calendars/create-appointment/
- Update appointment: `PUT /calendars/events/appointments/:eventId`
  - https://marketplace.gohighlevel.com/docs/ghl/calendars/edit-appointment/
- Get appointment: `GET /calendars/events/appointments/:eventId`
  - https://marketplace.gohighlevel.com/docs/ghl/calendars/get-appointment/
- List calendar events: `GET /calendars/events`
  - https://marketplace.gohighlevel.com/docs/ghl/calendars/get-calendar-events/
- Delete event: `DELETE /calendars/events/:eventId`
  - https://marketplace.gohighlevel.com/docs/ghl/calendars/delete-event/

## PatronPro Fixed IDs

| Field | Value |
| --- | --- |
| Main location | `hHLZC7FaTtUINPf3cbHd` |
| Onboarding calendar | `D7x8ts5xcdNOWnd6Pjlq` |
| Oscar assignee | `r2NA4HiIxWRvKwzuYpzv` |
| Proof appointment | `Cxa6iMN4am9r1XUdJWWS` |
| Proof contact | `rSBhh1nzHdjaRXOF3F0A` |
| PoC timezone label | `America/Mexico_City` |

## Field Mapping

| GHL readback | PoC normalized field | Rule |
| --- | --- | --- |
| `id` or `_id` | `appointmentId` | Required. Missing value is a hard error. |
| `locationId` | `locationId` | Must equal PatronPro main location. Wrong value is `wrong-account`. |
| `calendarId` | `calendarId` | Must equal Onboarding PatronPro calendar. Wrong value is `wrong-account`. |
| `assignedUserId` | `assignedUserId` | Must equal Oscar assignee. Wrong value is `wrong-account`. |
| `contactId` | `contactId` | Required. Missing value is a hard error. |
| `title` | `title` | Defaults to `PatronPro Onboarding` with warning if absent. |
| `appointmentStatus` | `status` | Defaults to `unknown` with warning if absent. |
| `startTime` / `endTime` | raw strings plus epoch milliseconds | Must include `Z` or an explicit offset and `endTime` must be after `startTime`. |
| `address` | `joinUrl` | HTTP(S) values are preserved; missing/non-URL values normalize to `null`. |
| `deleted` | `deleted`, `importable`, `nonImportableReason` | `true` is readable but not importable. `false` or `undefined` is importable unless another hard error exists. |

## Timezone Rule

Compare appointment times as instants, not as raw strings.

Canonical proof from `ppweb-an2`:

```text
Expected CDMX: 2026-06-12T11:00:00-06:00 to 2026-06-12T12:00:00-06:00
GHL readback: 2026-06-12T10:00:00-07:00 to 2026-06-12T11:00:00-07:00
```

These are the same instants. The contract exposes `sameInstant(leftIso, rightIso)` and stores epoch milliseconds for deterministic comparison.

## Deleted Readback Rule

RLM records that deleting a GHL appointment can return success while a later `GET /calendars/events/appointments/:eventId` still returns HTTP 200. The deletion state must be verified through `appointment.deleted === true`.

The contract therefore:

- normalizes deleted readbacks;
- sets `importable: false`;
- sets `nonImportableReason: "deleted"`;
- throws `code: "deleted"` if downstream code tries to assert importability.

## Dry-Run Behavior

`buildGhlAppointmentImportAudit` emits:

- `bead: "ppweb-0ka.7"`;
- `mode: "dry-run"`;
- source trace fields: appointment, contact, calendar, location, assignee, readback hash;
- mutation flags:
  - `ghlMutation: false`;
  - `googleCalendarMutation: false`;
  - `emailSent: false`;
  - `databaseWrite: false`.

The normalized appointment and audit payload whitelist fields. They must not include API keys, request headers, cookies, bearer tokens, OAuth tokens, browser localStorage, or session data from a raw readback object.

## Known Limits

- Google conference links may not appear in GHL appointment readback even when the calendar uses `google_conference_0`. The normalized `joinUrl` is therefore `string | null`.
- This contract does not poll GHL, subscribe to webhooks, or persist sync state. It only defines the deterministic read/import shape for later adapters.
- `ppweb-0ka.4` owns Google Meet creation research; `ppweb-0ka.5` owns Postgres persistence. This bead only bridges GHL readback into those later surfaces safely.

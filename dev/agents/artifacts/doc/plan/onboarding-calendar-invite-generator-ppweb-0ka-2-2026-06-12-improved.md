# Onboarding Calendar Invite Generator PRD (Improved)

Date: 2026-06-12
Bead: `ppweb-0ka.2`
Epic: `ppweb-0ka`
Repo: `/home/oz/projects/2026/onboarding-automation`
Branch: `feature/onboarding-automation`
Artifact role: quality-loop PRD for universal onboarding calendar invite generation
Artifact status: improved PRD after Mini blocking review and CE merge pass

## Goal

Create a deterministic onboarding meeting invite generator that takes one PatronPro/GHL appointment-like payload and produces client-facing add-to-calendar artifacts:

- RFC 5545-compatible `.ics` text.
- Base64 `text/calendar` data URL for direct `.ics` download/open behavior.
- Google Calendar prefill URL.
- Microsoft Outlook.com prefill URL.
- Microsoft 365/Office prefill URL.
- Apple/iOS fallback using the `.ics` output.
- Zoho/iCal fallback using the `.ics` output and documented user flow.

GHL remains the appointment source of truth. This generator creates portable invite artifacts only. It must not create, mutate, reschedule, cancel, send, sync, probe, or read live events in GHL, Google, Microsoft, Apple, Zoho, or any other provider.

## Clean-Room Scope

This slice is offline and deterministic.

Allowed:

- Pure TypeScript serialization and URL construction.
- Unit tests run with `bun test`.
- A non-secret sample artifact generated from fake demonstration data.

Not allowed:

- Live GHL, browser, Google, Microsoft, Apple, Zoho, or provider API probes.
- Calendar event creation, update, cancellation, rescheduling, invitations, or sync.
- Browser automation or authenticated sessions.
- Secrets, cookies, localStorage, API tokens, provider credentials, or real client PII.
- New runtime dependencies without a separate dependency/license/security review.

## Source Evidence

- `ppweb-0ka.1` live read-only workflow evidence confirmed the current four GHL onboarding workflows at metadata level only. Trigger/action internals are outside this slice.
- RLM main-account appointment pattern: onboarding appointments belong in PatronPro main GHL location `hHLZC7FaTtUINPf3cbHd`, calendar `D7x8ts5xcdNOWnd6Pjlq`, assignee `r2NA4HiIxWRvKwzuYpzv`.
- RLM add-to-calendar research recommends ICS first, provider-specific links second, and direct provider APIs only for advanced sync.
- Context7 Datebook docs for `/jshor/datebook` show Datebook can render iCalendar content and Google/Outlook/Yahoo URLs.
- Live package metadata checked 2026-06-12: `datebook` latest npm version `8.0.1`, MIT license, last publish about 3 years ago.
- Mini review on 2026-06-12 scored the draft PRD 36/50 and blocked implementation until ICS encoding, provider notes, deterministic UID/DTSTAMP, PRODID, fallback semantics, Datebook triggers, typing, encoding, validation, and tests were pinned.

## Dependency Decision

Do not add `datebook` as a core dependency for this PoC slice.

Do not add `add-to-calendar-button` as a core dependency for this PoC slice because Elastic License 2.0 is not acceptable for reusable PatronPro web or downstream client-facing surfaces without a separate legal/product review.

Rationale:

- The required first slice is narrow: one event, deterministic ICS, three web prefill URLs, and ICS fallback for Apple/Zoho.
- A small clean-room generator is easier to audit and keeps the no-live-mutation safety boundary explicit.
- The implementation must still acknowledge the cost of custom ICS work: escaping, line folding, UTC normalization, VALARM blocks, and provider URL templates require precise tests.
- Datebook is MIT-friendly and remains a possible future candidate, but its stale publish history and broader abstraction are not needed before this slice proves the contract.

Revisit Datebook or another vetted calendar library only when one of these concrete triggers occurs:

- A product requirement needs provider-specific non-ICS URLs beyond Google, Outlook.com, and Office 365, such as Yahoo, Yandex, or a confirmed Zoho compose URL.
- Requirements expand to recurrence rules, cancellations, VTIMEZONE blocks, multi-day events, localization, or provider-specific timezone behavior that exceeds the clean-room test surface.
- ICS conformance failures appear in real-world QA and cannot be covered safely with focused serializer tests.
- The clean-room serializer grows beyond a small auditable module or duplicates behavior already handled better by a vetted MIT-compatible package.

Any revisit must be a separate bead with dependency/license/security review, regression comparison against this PRD's fixtures, and explicit approval before adding the dependency.

## Implementation Targets

Add a library module:

- `src/lib/onboarding/calendar-invite.ts`

Add focused tests:

- `tests/onboarding-calendar-invite.test.ts`

Add one sample artifact:

- `dev/agents/artifacts/doc/test/onboarding-automation/onboarding-calendar-invite-sample-2026-06-12.json`

Do not touch live integration code in this slice.

## TypeScript Contract

Use explicit interfaces in `src/lib/onboarding/calendar-invite.ts`.

```ts
export type CalendarProvider =
  | "google"
  | "outlook"
  | "office365"
  | "apple"
  | "zoho"
  | "ics";

export interface CalendarReminder {
  trigger: "-P1D" | "-PT1H" | "-PT15M";
  description?: string;
}

export interface CalendarInviteInput {
  id: string;
  title: string;
  start: string;
  end: string;
  timeZone?: string;
  description?: string;
  location?: string;
  joinUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  createdAt?: string;
  reminders?: CalendarReminder[];
}

export interface CalendarInviteOutput {
  icsText: string;
  icsDataUrl: string;
  fileName: string;
  links: Record<CalendarProvider, string>;
  providerNotes: Record<CalendarProvider, string>;
}

export class CalendarInviteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarInviteValidationError";
  }
}
```

Input rules:

- `id`, `title`, `start`, and `end` are required and must be non-empty after trimming.
- `start` and `end` must be timezone-aware ISO timestamps containing either `Z` or an explicit numeric offset, for example `2026-06-15T10:00:00-06:00`.
- Naive timestamps such as `2026-06-15T10:00:00` are invalid.
- `end` must be strictly after `start`.
- `timeZone` defaults to `America/Mexico_City` and must be an IANA timezone name accepted by `Intl.DateTimeFormat`.
- `timeZone` is used for provider hints and notes. It is not used to infer an offset from naive timestamps.
- `organizerEmail` and `attendeeEmail`, when provided, must pass a basic safe email check before being emitted into ICS. Use a conservative pattern such as `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`.
- Invalid input throws `CalendarInviteValidationError` with a clear message.

Default reminders:

- `TRIGGER:-P1D`
- `TRIGGER:-PT1H`
- `TRIGGER:-PT15M`

For this slice, custom reminders may only use the three supported triggers above. Unsupported reminder triggers throw `CalendarInviteValidationError` rather than being silently serialized.

## Deterministic Output Rules

Use these exact deterministic values and fallback rules:

- `UID:${id}@patronpro.com`
- `PRODID:-//PatronPro//Onboarding Calendar Invite//EN`
- `DTSTAMP` is derived from `createdAt` when provided.
- If `createdAt` is missing, `DTSTAMP` is derived from `start`.
- `DTSTAMP`, `DTSTART`, and `DTEND` are always UTC values formatted as `YYYYMMDDTHHMMSSZ`.
- `fileName` is derived from the sanitized `id`, for example `${safeId}.ics`.
- `icsDataUrl` uses base64 encoding exactly:
  - Prefix: `data:text/calendar;charset=utf-8;base64,`
  - Payload: base64 UTF-8 bytes of `icsText`.
- `links.ics`, `links.apple`, and `links.zoho` all equal `icsDataUrl`.
- `providerNotes` is a per-provider record, not a free-form string array.

Example provider notes:

```ts
{
  google: "Google Calendar opens a web prefill URL. User must save the event.",
  outlook: "Outlook.com opens a web prefill URL. User must save the event.",
  office365: "Microsoft 365 opens a web prefill URL. Tenant rendering may vary; user must save the event.",
  apple: "Apple Calendar does not have a stable public web compose URL for this scope. Open or import the ICS file.",
  zoho: "Zoho uses the ICS fallback in this scope. Open or import the ICS file unless a Zoho-specific URL/API path is approved later.",
  ics: "Portable RFC 5545 ICS fallback for calendar clients that support importing or opening .ics files."
}
```

## ICS Requirements

Generate a single-event RFC 5545-style calendar using CRLF line endings.

Required structure:

- `BEGIN:VCALENDAR`
- `VERSION:2.0`
- `PRODID:-//PatronPro//Onboarding Calendar Invite//EN`
- `CALSCALE:GREGORIAN`
- `METHOD:PUBLISH`
- `BEGIN:VEVENT`
- `UID:${id}@patronpro.com`
- `DTSTAMP`
- `DTSTART`
- `DTEND`
- `SUMMARY`
- `DESCRIPTION`
- `LOCATION`
- `URL` when `joinUrl` is available
- `ORGANIZER` when safe organizer values are provided
- `ATTENDEE` when safe attendee values are provided
- One `VALARM` block for each supported reminder
- `END:VEVENT`
- `END:VCALENDAR`

Time rules:

- Normalize `start`, `end`, and `createdAt`/fallback timestamp to UTC.
- Emit UTC timestamps only in the ICS.
- Preserve the submitted `timeZone` in provider URL parameters where supported and in `providerNotes`/sample metadata.

Escaping rules for ICS text values:

- Backslash becomes `\\`.
- Newline becomes `\n`.
- Comma becomes `\,`.
- Semicolon becomes `\;`.
- Do not escape the `mailto:` URI value itself; escape only parameter text such as `CN`.

Line folding:

- Fold every emitted ICS content line to 75 octets or less.
- Use UTF-8 byte length, not JavaScript string length, for the 75-octet limit.
- Continuation lines must start with one space.
- Folding inserts `\r\n ` (CRLF plus one space).
- The final `icsText` must use CRLF endings throughout and should end with a final CRLF.

VALARM blocks:

Each default reminder must serialize as a display alarm:

```ics
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-P1D
END:VALARM
```

Repeat for `-PT1H` and `-PT15M`.

## Provider URL Requirements

Build web prefill URLs with `URL` and `URLSearchParams`, not manual string concatenation.

Google Calendar:

- Base: `https://calendar.google.com/calendar/render`
- Parameters:
  - `action=TEMPLATE`
  - `text=<title>`
  - `dates=<UTC start>/<UTC end>` using `YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ`
  - `details=<description plus joinUrl when available>`
  - `location=<location or joinUrl fallback>`
  - `ctz=<timeZone>`

Outlook.com:

- Base: `https://outlook.live.com/calendar/0/deeplink/compose`
- Parameters:
  - `path=/calendar/action/compose`
  - `rru=addevent`
  - `subject=<title>`
  - `startdt=<start ISO string>`
  - `enddt=<end ISO string>`
  - `body=<description plus joinUrl when available>`
  - `location=<location or joinUrl fallback>`

Office 365:

- Base: `https://outlook.office.com/calendar/0/deeplink/compose`
- Parameters are the same as Outlook.com.

Apple/iOS:

- No provider-specific compose URL is generated in this slice.
- `links.apple` must equal `icsDataUrl`.
- `providerNotes.apple` must explain that Apple Calendar consumes/imports ICS for this scope.

Zoho/iCal:

- No provider-specific Zoho compose URL is generated in this slice.
- `links.zoho` must equal `icsDataUrl`.
- `providerNotes.zoho` must explain that Zoho users should import/open ICS unless a later Zoho-specific URL/API path is approved.

ICS fallback:

- `links.ics` must equal `icsDataUrl`.
- Provider notes must make clear that opening provider URLs does not save an event automatically; the user must confirm/save in the provider UI.

URL length ceiling:

- If any generated Google, Outlook.com, or Office 365 URL exceeds 8,000 characters, throw `CalendarInviteValidationError` in this PoC slice.
- Do not silently truncate event descriptions.
- A later enhancement may add explicit truncation with a visible provider note, but that is out of scope for this bead.

## Sample Artifact Requirements

Create:

- `dev/agents/artifacts/doc/test/onboarding-automation/onboarding-calendar-invite-sample-2026-06-12.json`

The sample must contain only fake, non-secret, non-live data. Use `example.com` email domains and non-real client identifiers.

Required JSON shape:

```json
{
  "generatedAt": "2026-06-12T00:00:00.000Z",
  "artifactRole": "onboarding-calendar-invite-sample",
  "bead": "ppweb-0ka.2",
  "payload": {},
  "output": {
    "fileName": "demo-onboarding.ics",
    "links": {},
    "providerNotes": {},
    "icsDataUrlPrefix": "data:text/calendar;charset=utf-8;base64,",
    "icsTextExcerpt": "BEGIN:VCALENDAR...",
    "checksums": {
      "icsTextSha256": "<sha256>"
    }
  },
  "safety": {
    "usesFakeDataOnly": true,
    "containsSecrets": false,
    "performedLiveProviderProbe": false,
    "performedGhlMutation": false
  }
}
```

The artifact may include additional fields, but it must not include real appointment data, real client email, live provider URLs from authenticated sessions, cookies, tokens, or secrets.

## Tests

Use:

```bash
bun test tests/onboarding-calendar-invite.test.ts
```

Minimum unit assertions:

- ICS contains required calendar/event sections and uses CRLF endings.
- ICS includes exact `PRODID:-//PatronPro//Onboarding Calendar Invite//EN`.
- ICS includes deterministic `UID:demo-onboarding@patronpro.com` for `id: "demo-onboarding"` and does not emit placeholder UID domains.
- `DTSTAMP` is derived from `createdAt` when provided.
- `DTSTAMP` falls back to `start` when `createdAt` is omitted.
- `DTSTART` and `DTEND` are UTC `YYYYMMDDTHHMMSSZ`.
- ICS includes all three default reminder triggers and `ACTION:DISPLAY` in each `VALARM`.
- ICS escapes comma, semicolon, backslash, and newline using an explicit vector:
  - Input: `Line 1, with semicolon; and backslash \\ plus\nLine 2`
  - Expected ICS text value fragment: `Line 1\, with semicolon\; and backslash \\ plus\nLine 2`
- Every folded ICS line is 75 UTF-8 octets or less, with continuation lines beginning with one space.
- `icsDataUrl` starts with `data:text/calendar;charset=utf-8;base64,`.
- Decoding the base64 payload returns exact `icsText`.
- Google URL uses `https://calendar.google.com/calendar/render?action=TEMPLATE` and includes encoded `text`, `dates`, `details`, `location`, and `ctz`.
- Outlook.com URL uses `https://outlook.live.com/calendar/0/deeplink/compose` and includes `path`, `rru`, `subject`, `startdt`, `enddt`, `body`, and `location`.
- Office 365 URL uses `https://outlook.office.com/calendar/0/deeplink/compose` and includes the same required parameters as Outlook.com.
- Provider URLs are built via parseable URL semantics; tests should parse with `new URL(...)` and assert `searchParams`, not rely on brittle substring order.
- Apple, Zoho, and ICS fallback links equal `icsDataUrl`.
- `providerNotes` is a complete `Record<CalendarProvider, string>` with entries for `google`, `outlook`, `office365`, `apple`, `zoho`, and `ics`.
- Invalid timestamps throw `CalendarInviteValidationError`.
- Naive ISO timestamps throw `CalendarInviteValidationError`.
- End time not after start time throws `CalendarInviteValidationError`.
- Invalid organizer/attendee emails throw `CalendarInviteValidationError`.
- URL length over 8,000 characters throws `CalendarInviteValidationError`.
- Sample artifact uses only `example.com` emails and reports `performedLiveProviderProbe: false` and `performedGhlMutation: false`.
- `package.json` does not include `datebook` or `add-to-calendar-button` in `dependencies` or `devDependencies` for this slice.

Regression guard:

- Add a focused test or assertion that fails if `datebook` or `add-to-calendar-button` are added during this bead without the required dependency review.

Follow-up test recommendation, not required for this slice:

- Add an ICS parser test dependency such as `ical.js` or `node-ical` in a later bead only after dependency review, then round-trip the generated ICS.

## Acceptance Criteria

- `src/lib/onboarding/calendar-invite.ts` exports the interfaces, error class, and generator function.
- The generator is deterministic and requires no network, credentials, browser, GHL, Google, Microsoft, Apple, or Zoho access.
- `icsText` follows the pinned ICS, escaping, folding, VALARM, UID, PRODID, DTSTAMP, and UTC normalization rules above.
- `icsDataUrl` uses the exact base64 `text/calendar` prefix.
- Google, Outlook.com, and Office 365 URLs are constructed with `URL` and `URLSearchParams`.
- Apple, Zoho, and generic ICS outputs are explicitly ICS fallbacks, not provider compose endpoints.
- `providerNotes` is a typed per-provider record.
- The sample artifact validates that one fake meeting payload produces ICS plus provider links and safety metadata.
- Unit tests pass with `bun test tests/onboarding-calendar-invite.test.ts`.
- No live provider/GHL/browser probe or mutation is performed.
- The dependency decision note is present in this PRD and later bead close note/changelog if implementation proceeds.

## Failure Modes

- Missing `id`, `title`, `start`, or `end`: throw `CalendarInviteValidationError`.
- Invalid timestamp: throw `CalendarInviteValidationError`.
- Naive timestamp without `Z` or numeric offset: throw `CalendarInviteValidationError`.
- Invalid IANA `timeZone`: throw `CalendarInviteValidationError`.
- End time not after start time: throw `CalendarInviteValidationError`.
- Invalid organizer or attendee email: throw `CalendarInviteValidationError`.
- Unsupported custom reminder trigger: throw `CalendarInviteValidationError`.
- Provider URL longer than 8,000 characters: throw `CalendarInviteValidationError`.
- Unsupported provider-specific behavior: keep provider fallback as ICS and record the limitation in `providerNotes`.
- If Datebook or another library is later added, require a separate dependency/license/security review and keep this PRD's tests as regression fixtures.

## Implementation Notes

- Prefer small pure helper functions for validation, UTC formatting, ICS escaping, line folding, base64 data URL generation, and provider URL generation.
- Keep browser-specific APIs out of the core generator. Use `Buffer.from(icsText, "utf8").toString("base64")` or an existing repo-safe equivalent for base64 in the test/runtime environment.
- Do not read from `window`, `document`, cookies, localStorage, or process env.
- Do not log full invite bodies in tests if they might later include PII. Current sample data must remain fake.
- Keep descriptions and notes user-facing but neutral; provider URLs only prefill forms and do not save events automatically.

## Out Of Scope

- Recurring events.
- Event cancellation or update semantics.
- Calendar sync APIs.
- Sending invite emails.
- GHL workflow mutation.
- Provider availability checks.
- Browser-based QA.
- Real client appointment payloads.
- Non-ICS Zoho compose support.
- Apple EventKit or native app integrations.

## Self-Assessment

- Completeness: 10/10 - Covers clean-room scope, typed contract, deterministic ICS serialization, provider URLs, fallbacks, validation, sample artifact, dependency decision, and explicit out-of-scope boundaries.
- Clarity: 9/10 - Resolves Mini's contradictions around provider fallbacks and pins exact data URL, PRODID, UID, DTSTAMP, VALARM, and Datebook revisit triggers.
- Actionability: 9/10 - Provides concrete files, TypeScript interfaces, URL parameters, validation rules, test vectors, and acceptance criteria without requiring implementation guesswork.
- Testability: 9/10 - Defines machine-checkable unit assertions for serialization, decoding, provider URLs, validation, dependency guards, and sample safety metadata.
- Safety: 10/10 - Preserves no-live-mutation/no-secret scope, excludes live probes, blocks silent dependency drift, and keeps samples fake.

Total: 47/50

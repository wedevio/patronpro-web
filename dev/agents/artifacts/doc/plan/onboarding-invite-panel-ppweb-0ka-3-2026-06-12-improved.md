# Improved PRD: Monday PoC Panel for Onboarding Meeting Invites

## Metadata

- Project: PatronPro onboarding automation
- Worktree: `/home/oz/projects/2026/onboarding-automation`
- Branch: `feature/onboarding-automation`
- Bead: `ppweb-0ka.3`
- Status: Approved for implementation after Mini sage merge
- Date: 2026-06-12
- Owner: Codex
- Source PRD: `dev/agents/artifacts/doc/plan/onboarding-invite-panel-ppweb-0ka-3-2026-06-12.md`
- Sage review: `dev/agents/artifacts/doc/sages/onboarding-invite-panel-ppweb-0ka-3-20260612/sage-mini.md`
- Merge notes: `dev/agents/artifacts/doc/sages/onboarding-invite-panel-ppweb-0ka-3-20260612/merge.md`

## Objective

Build a locally runnable PatronPro operator panel slice for Monday that lets an internal operator enter onboarding meeting details, preview the outgoing client email, generate universal calendar outputs using the `ppweb-0ka.2` generator, and record a dry-run audit event without sending email or mutating GHL, Supabase, or any provider API.

This is an internal operations surface, not a marketing page. The first screen must be the usable panel itself.

## Current Evidence

- The app is Next.js 16.2.6 with App Router under `src/app`.
- Existing panel routes live under `src/app/panel/*` and share `src/app/panel/layout.tsx` plus `src/app/panel/_components/PanelHeader.tsx`.
- `PanelHeader` currently orders nav as `Onboarding`, `Roadmap`, `Soporte`, `Documentacion`.
- Existing panel UI is dense, operational, and Tailwind-based.
- `ppweb-0ka.2` added `src/lib/onboarding/calendar-invite.ts`.
- Existing generator tests live at `tests/onboarding-calendar-invite.test.ts`.
- `package.json` currently has no `test` script; existing tests use `bun:test`.
- No direct Postgres adapter or `pg` dependency exists in the app.
- Existing panel persistence is Supabase-backed, but this bead must not write Supabase.

## Scope

### In Scope

1. Add route `src/app/panel/onboarding-invites/page.tsx`.
2. Add client component `src/app/panel/onboarding-invites/_components/OnboardingInvitePanel.tsx`.
3. Add deterministic preview/audit helpers under `src/lib/onboarding/invite-preview.ts`.
4. Reuse `buildCalendarInvite` from `src/lib/onboarding/calendar-invite.ts`.
5. Update `src/app/panel/_components/PanelHeader.tsx` with:
   - route: `/panel/onboarding-invites`
   - label: `Invites`
   - icon: `CalendarPlus`
   - order: immediately after `Onboarding`
6. Add `"test": "bun test"` to `package.json`.
7. Add API route `src/app/api/panel/onboarding-invites/route.ts`.
8. Add migration contract artifact:
   - `dev/agents/artifacts/config/onboarding-automation/postgres/001_onboarding_invite_audit.sql`
9. Add focused tests for helper output, audit payload safety, API dry-run behavior, and generator integration.

### Out of Scope

- Live email sending.
- Live GHL writes.
- Supabase writes or migration execution.
- Adding `pg`, `postgres`, Prisma, Drizzle, or any new DB dependency.
- Google Calendar API, Meet creation, or provider writes.
- Carlos panel fork/copy work.
- Authentication redesign.
- Playwright viewport tests unless implementation creates obvious layout risk.

## Safety Boundary

This bead is dry-run only.

- `mode` must always be `"dry-run"`.
- `status.sent` must always be `false`.
- `status.ghlMutation` must always be `false`.
- `status.persisted` may be `"dry-run-no-database"` or `"dry-run-adapter-deferred"` only.
- If `POSTGRES_URL` or `DATABASE_URL` is unset, API returns HTTP 200 with `dry-run-no-database`.
- If `POSTGRES_URL` or `DATABASE_URL` is set, API still returns HTTP 200 with `dry-run-adapter-deferred` because the adapter is intentionally deferred to `ppweb-0ka.5`.
- The API must reject any payload where `mode !== "dry-run"`, `status.sent !== false`, or `status.ghlMutation !== false`.
- No API path in this bead may call GHL, Supabase, email providers, or calendar provider APIs.

## UX Requirements

- Use the existing panel layout; do not build a hero, landing page, or explanatory marketing section.
- The page must feel like a dense internal operations tool: compact form, preview, calendar actions, and status rail visible without decorative cards inside cards.
- Show an always-visible dry-run banner near the primary actions.
- Status rail states:
  - Initial/default: `Generated: not yet`, `Preview: seeded demo`, `Persistence: dry-run only`, `Sent: false`, `GHL mutation: false`.
  - After generate: `Generated: true`, `Previewed: true`, `Persistence: not recorded`.
  - After record: `Persisted: dry-run-no-database` or `dry-run-adapter-deferred`.
- Render `CalendarInviteValidationError` and form validation messages inline at the form level.
- Mobile text must not overflow action buttons or compact rail items.
- Refreshing or reloading the route resets the form to the default seeded demo state; no localStorage/session persistence in this bead.

## Safe Default Payload

`page.tsx` must pass a seeded fake default to the client component, not a blank ambiguous state.

```ts
const DEFAULT_FORM: OnboardingInviteFormState = {
  clientName: "Demo Client",
  businessName: "Demo Auto Shop",
  clientEmail: "client@example.com",
  meetingTitle: "PatronPro Onboarding",
  start: "2026-06-15T10:00:00-06:00",
  end: "2026-06-15T11:00:00-06:00",
  timeZone: "America/Mexico_City",
  description: "We will review your PatronPro setup, calendars, website, phone, and launch checklist.",
  location: "Google Meet",
  joinUrl: "https://meet.google.com/demo-demo-demo",
  organizerName: "PatronPro",
  organizerEmail: "support@example.com",
};
```

## Form-To-CalendarInviteInput Mapping

| Form field | `CalendarInviteInput` field | Rule |
|---|---|---|
| `meetingTitle` | `title` | Required trimmed text. |
| generated slug | `id` | Deterministic slug from `${businessName}-${meetingTitle}-${start}`; must use only lowercase letters, numbers, and hyphens. |
| `start` | `start` | Required timezone-aware ISO string with `Z` or explicit offset. |
| `end` | `end` | Required timezone-aware ISO string with `Z` or explicit offset; must be after start. |
| `timeZone` | `timeZone` | Required IANA timezone, default `America/Mexico_City`. |
| `description` | `description` | Optional trimmed text used in email and ICS body. |
| `location` | `location` | Optional trimmed text; defaults to `joinUrl` label fallback when empty. |
| `joinUrl` | `joinUrl` | Optional URL string; if present, included in email, provider descriptions, and ICS `URL`. |
| `organizerName` | `organizerName` | Required trimmed text for this panel default. |
| `organizerEmail` | `organizerEmail` | Required valid email; also acts as reply-to display source. |
| `clientName` | `attendeeName` | Required trimmed text. |
| `clientEmail` | `attendeeEmail` | Required valid email. |
| generated timestamp | `createdAt` | ISO timestamp generated when preview/audit is built. Tests may inject fixed `createdAt` for determinism. |

Validation may use existing `zod` plus `CalendarInviteValidationError`. Empty or invalid client/organizer email must be rejected before an audit payload can be recorded.

## Preview Helper Contract

Create `src/lib/onboarding/invite-preview.ts`.

```ts
import type { CalendarInviteInput, CalendarInviteOutput, CalendarProvider } from "./calendar-invite";

export interface OnboardingInviteFormState {
  clientName: string;
  businessName: string;
  clientEmail: string;
  meetingTitle: string;
  start: string;
  end: string;
  timeZone: string;
  description: string;
  location: string;
  joinUrl: string;
  organizerName: string;
  organizerEmail: string;
}

export interface OnboardingInviteAuditPayload {
  id: string;
  bead: "ppweb-0ka.3";
  createdAt: string;
  mode: "dry-run";
  client: {
    name: string;
    businessName: string;
    email: string;
  };
  meeting: CalendarInviteInput;
  emailPreview: {
    subject: string;
    bodyText: string;
  };
  calendar: {
    fileName: string;
    providerLinks: Record<CalendarProvider, string>;
    icsTextSha256: string;
  };
  status: {
    generated: true;
    previewed: true;
    persisted: "not-recorded" | "dry-run-no-database" | "dry-run-adapter-deferred";
    sent: false;
    ghlMutation: false;
  };
}

export interface OnboardingInvitePreviewResult {
  input: CalendarInviteInput;
  calendar: CalendarInviteOutput;
  subject: string;
  bodyText: string;
  auditPayload: OnboardingInviteAuditPayload;
}

export function buildOnboardingInvitePreview(
  form: OnboardingInviteFormState,
  options?: { createdAt?: string }
): OnboardingInvitePreviewResult;
```

### Email Template

Subject:

```text
PatronPro onboarding: {businessName}
```

Body text:

```text
Hi {clientName},

Your PatronPro onboarding meeting is scheduled for {localizedStart} - {localizedEnd} ({timeZone}).

Meeting: {meetingTitle}
Business: {businessName}
Join link: {joinUrl or "Provided separately"}

Add this meeting to your calendar using one of the links below:
- Google Calendar
- Outlook.com
- Microsoft 365
- Apple/iOS or other calendar app via .ics

Reply to {organizerEmail} if anything needs to change.
```

`localizedStart` and `localizedEnd` must be deterministic with `Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium", timeStyle: "short" })` in tests by injecting fixed timestamps.

## Checksum Algorithm

`calendar.icsTextSha256` must be SHA-256 over the final generated `icsText` string returned by `buildCalendarInvite`, encoded as UTF-8 bytes after ICS line folding and CRLF normalization. Output must be lowercase hex and match `/^[a-f0-9]{64}$/`.

Use Node crypto in server/test contexts:

```ts
createHash("sha256").update(calendar.icsText, "utf8").digest("hex");
```

## API Contract

Create `src/app/api/panel/onboarding-invites/route.ts`.

### `POST /api/panel/onboarding-invites`

Input: `OnboardingInviteAuditPayload`.

Required runtime checks:

- Parse JSON safely.
- Validate `mode === "dry-run"`.
- Validate `status.sent === false`.
- Validate `status.ghlMutation === false`.
- Validate `calendar.icsTextSha256` is lowercase 64-char hex.
- Rebuild the calendar from `payload.meeting` and verify the checksum matches the submitted `calendar.icsTextSha256`.
- Reject malformed payloads with HTTP 400 and a short error code/message.

Response when no DB URL exists:

```json
{
  "ok": true,
  "mode": "dry-run",
  "persisted": "dry-run-no-database",
  "sent": false,
  "ghlMutation": false
}
```

Response when `POSTGRES_URL` or `DATABASE_URL` exists:

```json
{
  "ok": true,
  "mode": "dry-run",
  "persisted": "dry-run-adapter-deferred",
  "sent": false,
  "ghlMutation": false
}
```

Do not import Supabase clients, GHL clients, email clients, or a Postgres client in this route for `ppweb-0ka.3`.

## Migration Contract

Add the SQL artifact only. Do not execute it in this bead.

```sql
create table if not exists onboarding_invite_audit (
  id text primary key,
  created_at timestamptz not null,
  mode text not null check (mode in ('dry-run')),
  client_name text not null,
  business_name text not null,
  client_email text not null,
  meeting_title text not null,
  meeting_start timestamptz not null,
  meeting_end timestamptz not null,
  meeting_timezone text not null,
  join_url text,
  ics_sha256 text not null,
  payload jsonb not null
);
```

`ppweb-0ka.5` owns adapter implementation and any Supabase/Postgres rollout.

## Implementation Plan

1. Add `"test": "bun test"` to `package.json`.
2. Create `src/lib/onboarding/invite-preview.ts`.
   - Implement form validation, mapping, subject/body generation, calendar generation, SHA-256 checksum, and audit payload creation.
   - Keep helper deterministic with injectable `createdAt`.
3. Create `src/app/panel/onboarding-invites/page.tsx`.
   - Server Component shell.
   - `export const dynamic = "force-dynamic";`
   - Pass `DEFAULT_FORM` to `OnboardingInvitePanel`.
4. Create `src/app/panel/onboarding-invites/_components/OnboardingInvitePanel.tsx`.
   - `"use client"`.
   - Manage form state locally only.
   - Generate preview without network requests.
   - Render calendar provider links and `.ics` download/open action from `CalendarInviteOutput`.
   - POST audit payload only when the operator clicks `Record dry-run`.
5. Create `src/app/api/panel/onboarding-invites/route.ts`.
   - Implement runtime invariants and checksum verification.
   - Return safe dry-run statuses only.
6. Add migration artifact under `dev/agents/artifacts/config/onboarding-automation/postgres/`.
7. Update `PanelHeader` nav after `Onboarding`.
8. Add tests listed below.

## Required Tests

Add focused Bun tests, preferably:

- `tests/onboarding-invite-preview.test.ts`
- `tests/onboarding-invite-api.test.ts`

Named cases:

1. `preview subject includes business name`
   - Asserts subject is `PatronPro onboarding: Demo Auto Shop`.
2. `preview body includes meeting time timezone join link and organizer email`
   - Asserts body includes localized time, `America/Mexico_City`, `https://meet.google.com/demo-demo-demo`, and `support@example.com`.
3. `form maps to CalendarInviteInput without losing attendee organizer or location fields`
   - Asserts `attendeeName`, `attendeeEmail`, `organizerName`, `organizerEmail`, `location`, `joinUrl`, `timeZone`, `start`, and `end`.
4. `audit payload is dry-run safe`
   - Asserts `mode === "dry-run"`, `status.sent === false`, `status.ghlMutation === false`, and `status.persisted === "not-recorded"`.
5. `audit payload icsTextSha256 is lowercase sha256 of final icsText`
   - Recomputes checksum from returned `calendar.icsText`.
6. `generator integration exposes google outlook office365 apple zoho and ics keys`
   - Asserts all six provider keys exist.
7. `ics filename uses generator safe filename`
   - Asserts file name equals the generator output, e.g. `demo-auto-shop-patronpro-onboarding-2026-06-15t10-00-00-06-00.ics` or the exact implementation slug.
8. `invalid client email is rejected before audit creation`
   - Uses zod/helper validation and expects a thrown validation error.
9. `api returns dry-run-no-database when database env is unset`
   - Clears `POSTGRES_URL` and `DATABASE_URL` for the test process.
10. `api returns dry-run-adapter-deferred when database env is set`
   - Sets a fake DB URL and asserts HTTP 200, not 500.
11. `api rejects non dry-run mode`
   - Sends `mode: "live"` and expects HTTP 400.
12. `api rejects sent or ghlMutation true`
   - Sends `status.sent: true` and `status.ghlMutation: true` in separate assertions.

Keep existing generator coverage in `tests/onboarding-calendar-invite.test.ts`.

## Acceptance Criteria

- `/panel/onboarding-invites` renders a usable operator panel.
- The dry-run boundary is visible at all times.
- The operator can edit seeded meeting fields and generate a preview without a network request.
- Invalid or empty emails render inline form errors.
- `CalendarInviteValidationError` messages render inline after invalid calendar input.
- Calendar actions are produced for Google, Outlook.com, Office365, Apple/iOS ICS, Zoho/iCal fallback, and raw ICS.
- `.ics` download/open uses the exact `fileName` returned by `buildCalendarInvite`.
- Email preview is deterministic and includes meeting time, timezone, join URL, and add-to-calendar guidance.
- Status rail shows generated, previewed, dry-run persistence state, `sent=false`, and `ghlMutation=false`.
- Clicking `Record dry-run` calls only `/api/panel/onboarding-invites`.
- API never sends email, mutates GHL, writes Supabase, or imports provider write clients.
- If DB env vars are absent, API returns `dry-run-no-database`.
- If DB env vars are present but no adapter exists, API returns `dry-run-adapter-deferred` rather than throwing.
- Reloading the route resets form state to `DEFAULT_FORM`.
- Tests cover preview/audit behavior, runtime safety invariants, API dry-run statuses, and generator integration.
- Verification runs:
  - `bun test tests/onboarding-calendar-invite.test.ts tests/onboarding-invite-preview.test.ts tests/onboarding-invite-api.test.ts`
  - `bun run lint -- src/lib/onboarding/invite-preview.ts src/app/panel/onboarding-invites/page.tsx src/app/panel/onboarding-invites/_components/OnboardingInvitePanel.tsx src/app/api/panel/onboarding-invites/route.ts src/app/panel/_components/PanelHeader.tsx`
  - `git diff --check`
- Repo-wide lint failure, if still present, is documented as unrelated baseline debt and not hidden.

## Rollback

Revert the checkpoint commit for `ppweb-0ka.3`. The new route is isolated under `/panel/onboarding-invites`, the nav change is limited to `PanelHeader`, helper/API files are under onboarding-specific paths, and the `ppweb-0ka.2` calendar generator remains untouched unless implementation uncovers a shared bug.

## Not Fixing In This Bead

- No Postgres adapter or DB dependency.
- No live Postgres/Supabase execution.
- No email send.
- No GHL mutation.
- No calendar provider write.
- No Playwright viewport test unless implementation creates layout risk.

## Self-Assessment

- Completeness: 9/10
  - Covers source panel, helper, API, migration artifact, nav, package script, tests, acceptance, and dry-run edge cases.
- Clarity: 9/10
  - Resolves the adapter fork, maps every form field to `CalendarInviteInput`, and pins exact route/file responsibilities.
- Actionability: 9/10
  - Provides file paths, type contracts, API responses, test names, and verification commands.
- Testability: 9/10
  - Converts broad bullets into named tests with concrete assertions and env-branch coverage.
- Safety: 10/10
  - Preserves no live email, no GHL mutation, no Supabase write, no DB dependency, and runtime invariants.

Total: 46/50

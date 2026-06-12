# PRD: Monday PoC Panel for Onboarding Meeting Invites

## Metadata

- Project: PatronPro onboarding automation
- Worktree: `/home/oz/projects/2026/onboarding-automation`
- Branch: `feature/onboarding-automation`
- Bead: `ppweb-0ka.3`
- Status: Draft for quality-loop
- Date: 2026-06-12
- Owner: Codex

## Objective

Build a locally runnable PatronPro operator panel slice for Monday that lets an internal operator enter onboarding meeting details, preview the outgoing client email, generate universal calendar outputs using the `ppweb-0ka.2` generator, and record a dry-run audit event without sending email or mutating GHL.

This is an internal tool surface, not a marketing page. The first screen should be the usable panel itself.

## Current Evidence

- The app is Next.js 16.2.6 with App Router under `src/app`.
- Local Next docs confirm pages/layouts are filesystem routes and pages/layouts are Server Components by default.
- Local Next docs and Context7 confirm interactive state/forms should live behind a focused `"use client"` boundary.
- Existing panel routes live under `src/app/panel/*` and share `src/app/panel/layout.tsx` plus `PanelHeader`.
- Existing panel UI is dense, operational, and Tailwind-based.
- `ppweb-0ka.2` added `src/lib/onboarding/calendar-invite.ts` with deterministic ICS/provider links and passing tests.
- No direct Postgres adapter exists in the current app; existing panel persistence is Supabase-backed.

## Scope

### In Scope

1. Add a new route: `src/app/panel/onboarding-invites/page.tsx`.
2. Add a focused client component: `src/app/panel/onboarding-invites/_components/OnboardingInvitePanel.tsx`.
3. Add reusable deterministic invite-preview helpers if needed under `src/lib/onboarding/`.
4. Reuse `buildCalendarInvite` from `src/lib/onboarding/calendar-invite.ts`.
5. Update `PanelHeader` navigation so the new panel is discoverable.
6. Provide fields for:
   - client name
   - business name
   - client email
   - meeting title
   - start/end timezone-aware timestamps
   - timezone
   - description
   - join URL
   - organizer/reply-to
7. Render:
   - outgoing email subject/body preview
   - Google Calendar link
   - Outlook.com link
   - Office365 link
   - Apple/iOS ICS link
   - Zoho/iCal ICS fallback link
   - `.ics` download/open action
   - status/audit rail with generated, previewed, persisted/dry-run, and send-state indicators
8. Add a persistence API shape that is Postgres-first:
   - `src/app/api/panel/onboarding-invites/route.ts`
   - accepts a generated invite/audit payload
   - if `POSTGRES_URL` or `DATABASE_URL` is configured, writes through a Postgres adapter
   - if no Postgres URL is configured, returns an explicit dry-run persistence status and never pretends to save
9. Add a migration artifact for the future Postgres/Supabase-compatible table:
   - `dev/agents/artifacts/config/onboarding-automation/postgres/001_onboarding_invite_audit.sql`
10. Add focused tests for deterministic preview/audit payload behavior and the generator integration boundary.

### Out of Scope

- Live email sending.
- Live GHL writes.
- Google Calendar API/Meet creation.
- Supabase migration execution.
- Carlos panel fork/copy work.
- Authentication redesign.

## UX Requirements

- The page must look like an internal operations panel: dense, scannable, restrained.
- Do not use a landing-page hero or marketing copy.
- Use existing PatronPro panel layout and colors.
- Use lucide icons for actions/status indicators where useful.
- Use clear controls:
  - text inputs/textareas for meeting data
  - select/menu for timezone presets
  - buttons for generate/copy/download/open calendar links
  - badges for dry-run/live-state clarity
- The dry-run boundary must be visible in the status rail and near any send/persist controls.
- No text should overflow buttons or compact panels on mobile.

## Data Model

### Invite Input

Use the `CalendarInviteInput` shape from `src/lib/onboarding/calendar-invite.ts`.

### Audit Payload

```ts
interface OnboardingInviteAuditPayload {
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
    persisted: "postgres" | "dry-run-no-database";
    sent: false;
    ghlMutation: false;
  };
}
```

## Postgres Persistence Contract

Migration table:

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

For this bead, the API may remain uncalled by tests when no `POSTGRES_URL` exists, but the UI/API must clearly report `dry-run-no-database`. The follow-up `ppweb-0ka.5` can formalize migrations and Supabase rollout.

## Implementation Plan

1. Create `src/lib/onboarding/invite-preview.ts`.
   - `buildOnboardingInvitePreview(input)` returns subject/body text and audit payload.
   - Keep it deterministic and testable outside React.
2. Create `src/app/panel/onboarding-invites/page.tsx`.
   - Server Component shell.
   - `export const dynamic = "force-dynamic";`
   - Render the client component with a safe default payload.
3. Create `src/app/panel/onboarding-invites/_components/OnboardingInvitePanel.tsx`.
   - `"use client"`.
   - Manage form state locally.
   - Call `buildCalendarInvite` and preview helpers on generate.
   - Show validation errors from `CalendarInviteValidationError`.
   - Provide copy/download/open actions.
   - POST audit payload to `/api/panel/onboarding-invites` only when the operator clicks "Record dry-run".
4. Create `src/app/api/panel/onboarding-invites/route.ts`.
   - Default safe behavior: validate shape, compute/verify checksum, return `dry-run-no-database` if no database URL.
   - If database URL exists and a Postgres adapter is present, persist.
   - Never send email or call GHL.
5. Create migration artifact under `dev/agents/artifacts/config/onboarding-automation/postgres/`.
6. Update panel nav with a `CalendarPlus` item.
7. Add tests:
   - preview subject/body interpolation
   - audit payload fields and safety status
   - checksum shape
   - generator integration produces expected provider keys
   - no live send/GHL flags can be true in this slice

## Acceptance Criteria

- `/panel/onboarding-invites` renders a usable operator surface.
- The operator can fill/edit meeting fields and generate a preview without a network request.
- Calendar buttons/links are produced for Google, Outlook.com, Office365, Apple/iOS ICS, Zoho/iCal fallback, and raw ICS.
- The `.ics` output can be opened/downloaded from the panel.
- The email preview is deterministic and includes the meeting time, join URL, and add-to-calendar guidance.
- The audit rail shows generated, previewed, dry-run persistence state, `sent=false`, and `ghlMutation=false`.
- The API route never sends email or mutates GHL.
- Tests cover preview/audit behavior and the calendar generator integration.
- Verification runs:
  - focused Bun tests for new helper/tests
  - targeted ESLint for touched files
  - `git diff --check`
- Repo-wide lint failure, if still present, is documented as unrelated baseline debt and not hidden.

## Safety

- Default mode is dry-run.
- No provider API writes.
- No GHL writes.
- No Supabase writes.
- No live email sends.
- No secrets in sample artifacts or RLM summaries.
- If database configuration is missing, the UI/API must say so explicitly.

## Rollback

Revert the checkpoint commit for this bead. The new panel route is isolated under `/panel/onboarding-invites`, the nav entry is a small header change, and the calendar generator from `ppweb-0ka.2` remains untouched unless tests reveal a shared bug.

## Initial Score

- Completeness: 8/10
- Clarity: 8/10
- Actionability: 8/10
- Testability: 8/10
- Safety: 10/10
- Total: 42/50

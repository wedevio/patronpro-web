# Merge Notes: ppweb-0ka.3 Onboarding Invite Panel PRD

## Inputs

- PRD: `dev/agents/artifacts/doc/plan/onboarding-invite-panel-ppweb-0ka-3-2026-06-12.md`
- Mini review: `dev/agents/artifacts/doc/sages/onboarding-invite-panel-ppweb-0ka-3-20260612/sage-mini.md`

## Mini Score

- Total: 37/50
- Result: Blocking, CE merge required

## Must Fix

1. Resolve the persistence adapter decision.
   - For this bead, avoid adding a Postgres dependency.
   - API should always be safe without DB config.
   - If `POSTGRES_URL`/`DATABASE_URL` is missing, return `dry-run-no-database`.
   - If a DB URL is present but no adapter is implemented in this bead, still return a safe dry-run status and defer true Postgres execution to `ppweb-0ka.5`.
   - Keep the migration artifact as the Postgres/Supabase-compatible contract.
2. Add a form-to-`CalendarInviteInput` mapping table.
   - Pin `id`, `attendeeName`, `attendeeEmail`, `organizerName`, `organizerEmail`, `location`, `joinUrl`, and timestamp handling.
3. Add a `bun test` script to `package.json` or explicitly state direct `bun test <file>` invocation.
   - Preferred implementation: add `"test": "bun test"` because existing tests already use `bun:test`.
4. Cite existing calendar-generator test path.
   - Use `tests/onboarding-calendar-invite.test.ts`.
5. Pin checksum algorithm.
   - SHA-256 over UTF-8 bytes of final generated `icsText`, lowercase hex.
6. Specify `buildOnboardingInvitePreview` return type and subject/body template.
7. Define safe default payload.
   - Use seeded fake demo data with `example.com` email and `demo-demo-demo` Meet URL.
8. Add runtime invariants in API route.
   - Reject any payload where `mode !== "dry-run"`, `status.sent !== false`, or `status.ghlMutation !== false`.

## Should Fix

- Pin nav label and order: route `/panel/onboarding-invites`, label `Invites`, icon `CalendarPlus`, placed after `Onboarding`.
- Define status rail empty state and generated state.
- Convert test bullets to named tests with concrete assertions.
- Add acceptance criteria for always-visible dry-run banner, inline validation errors, deterministic ICS filename, invalid email handling, and no form-state persistence across reload.

## Not Fixing In This Bead

- Do not add `pg`, `postgres`, or any other DB dependency in this bead.
- Do not run a live Postgres instance.
- Do not send email, mutate GHL, or write Supabase.
- Do not add Playwright viewport tests unless implementation creates layout risk; targeted lint/tests are sufficient for this bead.

## Target CE Score

- Completeness: 9/10
- Clarity: 9/10
- Actionability: 9/10
- Testability: 9/10
- Safety: 10/10
- Total target: 46+/50

# Mini Sage Review — ppweb-0ka.3 Onboarding Invite Panel

## Score: 37/50 — BLOCKING (≥ 46 needed)

| Dimension | Score | Δ vs self |
|---|---|---|
| Completeness | 7 | −1 |
| Clarity | 8 | 0 |
| Actionability | 7 | −1 |
| Testability | 6 | −2 |
| Safety | 9 | −1 |

PRD is well-structured but has unresolved structural decisions and under-specified test contracts. Below threshold → /ce merge pass required, possibly another /sages round.

---

## Blocking Issues

### 1. Postgres adapter fork is unresolved — `src/app/api/panel/onboarding-invites/route.ts`
- Line 60: "writes through a Postgres adapter" — no adapter file listed anywhere in the plan.
- Repo is Supabase-backed; no `pg`, no raw Postgres adapter exists. The conditional branch is dead code at merge time.
- **Pick one**:
  - (a) Add `src/lib/onboarding/persistence/postgres.ts` (using `pg` — new dep)
  - (b) Add a Supabase adapter at the same path (use existing `@supabase/supabase-js`)
  - (c) Remove the conditional; API always returns `dry-run-no-database` in this bead; defer to `ppweb-0ka.5`
- Whichever is picked, pin the file path and dep in the implementation plan.

### 2. Form-to-`CalendarInviteInput` mapping undefined
- Form fields (PRD §6): client name, business name, client email, meeting title, start/end, timezone, description, join URL, organizer/reply-to.
- `CalendarInviteInput` (calendar-invite.ts:10): `id, title, start, end, timeZone, description, location, joinUrl, organizerName, organizerEmail, attendeeName, attendeeEmail`.
- **Unanswered**: form has `organizer/reply-to` (one field or two?). Generator has `location` — form doesn't. Which form field → `attendeeName`? `id` source? Add a mapping table to the PRD.

### 3. `bun test` runner not wired
- `package.json` scripts: `dev, build, start, lint` only. No `test` script.
- PRD verification line 192 says "focused Bun tests" but nothing invokes them.
- Add `"test": "bun test"` to `package.json` scripts (or `bunx vitest` if vitest is preferred).

### 4. `calendar-invite.ts` "with passing tests" claim unverified
- Line 26: "ppweb-0ka.2 added ... with passing tests."
- `find src/lib/onboarding -name '*.test.ts'` returned nothing. Tests may live in a non-co-located path (`__tests__/`, `*.test.tsx`, `*.spec.ts`) but PRD does not cite a path.
- Locate the existing tests, cite the path, or remove the claim.

### 5. `icsTextSha256` algorithm unspecified
- Audit payload field (PRD §Audit Payload) and test bullet "checksum shape" — no algorithm.
- API step 4 says "compute/verify checksum" — impossible without pinning.
- **Pin**: SHA-256 over the post-fold raw `icsText` (the `buildIcs` output, UTF-8 bytes), lowercase hex.

### 6. `buildOnboardingInvitePreview` return type + email template undefined
- Plan step 1: file + signature only. No return type. No subject/body format.
- Need: subject format (e.g. `Onboarding: {title}`), body text skeleton (greeting, time + tz, join URL, calendar links list), and explicit return type (e.g. `{ subject: string; bodyText: string; auditPayload: OnboardingInviteAuditPayload }`).

### 7. "Safe default payload" for server shell undefined
- Plan step 2: "Render the client component with a safe default payload" — what is it?
- Pin: empty form with placeholder text, or seeded fake-data example, or read-only "no input yet" state. Affects acceptance criterion for empty-state UX.

### 8. `sent: false` / `ghlMutation: false` are type-literal only
- Audit payload uses literal types. Compile-time only.
- Add a runtime assertion in the API route: `if (payload.sent || payload.ghlMutation) return 400` so a future refactor can't silently flip the flag.

---

## Non-blocking improvements

- **Hedge removal**: line 36 "if needed" — drop, helpers are listed in the implementation plan, they ARE needed.
- **Nav spec**: "Update panel nav with a `CalendarPlus` item" — pin label (e.g. "Onboarding Invites") and route order.
- **Status rail empty state**: define what shows when no input is entered yet (vs. after generate).
- **Test list → test cases**: replace bullets with named tests + assertions, e.g.:
  - `preview subject includes meeting title`
  - `audit payload ics_sha256 is 64 lowercase hex chars`
  - `generator integration exposes google/outlook/office365/apple/zoho/ics keys`
  - `api route returns dry-run-no-database when POSTGRES_URL is unset`
  - `api route refuses non-dry-run mode at runtime`
- **Mobile overflow rule** (UX §5) is untestable without a viewport test — either add Playwright assertion or drop the rule.

---

## Missing acceptance criteria to add

- Operator sees dry-run boundary indicator at all times (not just after persistence).
- `CalendarInviteValidationError` messages render inline at the form level, not only after generate.
- Downloaded `.ics` filename equals `safeFileName(id).ics` from the generator.
- Empty / invalid email rejected at form level (zod schema is already in deps).
- Refresh / route reload resets form to default (no form-state persistence in this bead).
- If `POSTGRES_URL` is set but adapter is missing, API must still return 200 with `dry-run-no-database` rather than 500.

---

## Recommended next step

Run /ce with brief:
1. Resolve adapter decision (a/b/c above) and pin the file path.
2. Add the form-to-`CalendarInviteInput` mapping table.
3. Pin SHA-256 algorithm.
4. Add `bun test` script to `package.json`.
5. Convert test bullets to named cases with assertions.
6. Specify the email subject/body template + `buildOnboardingInvitePreview` return type.
7. Add runtime invariant for `sent: false` / `ghlMutation: false`.
8. Add the missing acceptance criteria above.

Target: Testability ≥ 8, Actionability ≥ 8, Completeness ≥ 8. Then re-score. If still < 46, run /sages again.

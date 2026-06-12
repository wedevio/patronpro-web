# Merge: ppweb-0ka.7 GHL appointment sync contract

Input PRD: `dev/agents/artifacts/doc/plan/onboarding-ghl-appointment-sync-contract-ppweb-0ka-7-2026-06-12.md`
Mini review: `dev/agents/artifacts/doc/sages/onboarding-ghl-appointment-sync-contract-ppweb-0ka-7-20260612/sage-mini.md`
Mini score: 33/50

## MUST FIX

1. Specify concrete TypeScript shapes:
   - `GhlAppointmentReadback`
   - `OnboardingGhlAppointment`
   - `OnboardingGhlAppointmentValidation`
   - dry-run audit payload

2. Define validation error class and code enum:
   - `wrong-account`
   - `deleted`
   - `naive-timestamp`
   - `inverted-range`
   - `missing-id`
   - `missing-contact`
   - `invalid-date`

3. Define deleted semantics:
   - `deleted === undefined` means active/readable and importable unless another hard error exists.
   - `deleted === false` means active/readable and importable unless another hard error exists.
   - `deleted === true` means readable but not importable, with `reason: "deleted"`.

4. Make wrong-account identities hard errors:
   - mismatched `locationId`, `calendarId`, or `assignedUserId` must throw `wrong-account`.
   - do not downgrade these to warnings.

5. Add credential-scrubbing invariant:
   - raw readback may contain extra properties such as `apiKey`, `authorization`, `cookie`, or `bearer`;
   - normalized output and audit payload must not contain those keys or values.

6. Define function signatures:
   - `normalizeGhlOnboardingAppointment(readback, options?)`
   - `assertGhlOnboardingAppointmentImportable(appointment)`
   - `sameInstant(a, b)`
   - `buildGhlAppointmentImportAudit(appointment, options?)`

## SHOULD FIX

1. Split timezone-naive and inverted-range tests into separate cases.
2. Add a canonical proof fixture for appointment `Cxa6iMN4am9r1XUdJWWS`.
3. Use plain guards instead of adding a validation dependency; this keeps the slice deterministic and dependency-free.
4. Include traceability fields in audit payload: `appointmentId`, `contactId`, `calendarId`, `locationId`, `readbackHash`.
5. Assert `bead: "ppweb-0ka.7"` in tests.
6. Cross-link 0ka.4 Google Meet and 0ka.5 persistence contracts in the research artifact.
7. Model possible missing Google conference links as `joinUrl: string | null`.
8. Test instant equality despite offset-string divergence.

## NOT FIXING

1. No live GHL read in this bead; this is a deterministic contract and fixture-driven test slice.
2. No GHL write/update/delete path.
3. No Google Calendar/Meet mutation.
4. No database persistence implementation in this bead.

## Approval Target

CE merge must produce an improved PRD scored at least 46/50 and ready for implementation.

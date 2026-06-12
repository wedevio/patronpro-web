# PRD Review — `ppweb-0ka.7` GHL appointment sync contract

**Lane context**: `feature/onboarding-automation` @ `8966dea`. Sibling PRDs in this epic (0ka.3, 0ka.4, 0ka.5) all produced `*-improved.md` versions after CE merge — this is the **original draft** (126 lines vs. improved siblings at 412–464 lines), so a gap is expected.

---

## Rubric Scores

| Dimension | Score | Notes |
|---|---|---|
| **Completeness** | **7/10** | Out-of-scope + acceptance + IDs + endpoints all present. Missing: validation error shape, deletion-vs-undefined behavior, audit traceability keys, fixture payload. |
| **Clarity** | **6/10** | Section structure clean; test case #1 mirrors the canonical ppweb-9 scenario. "Raw / normalized shapes" referenced but no field list — contract is intents, not fields. |
| **Actionability** | **6/10** | File paths + export list + bun test cmd are concrete. No TS interface snippets, no validation lib choice, no example readback payload to model. |
| **Testability** | **6/10** | 5 cases listed, 1 fully specified. Bundled TZ+ordering case, no `deleted===undefined` case, no credential-leak case, no fixture. |
| **Safety** | **8/10** | GHL = source-of-truth repeated, 4 mutation flags enumerated, credential rule explicit, bead ID in audit. Missing: wrong-account hard-error semantics, undefined-`deleted` policy, rollback/importable-only-after-validate story. |
| **TOTAL** | **33 / 50 (66%)** | Below 92% implementation gate; aligned with pre-improved-draft norms. |

---

## MUST FIX (blockers before /ce merge)

1. **Specify the two type shapes**. Rule "raw `GhlAppointmentReadback`" and "normalized `OnboardingGhlAppointment`" must list fields with types (`id`, `calendarId`, `locationId`, `assignedUserId`, `contactId`, `startTime`, `endTime`, `deleted`, …) — or include a TS interface block. Today an implementer can satisfy the contract by exporting any shape.
2. **Define the validation error class**. "Structured errors/warnings" is a placeholder. Spell out: `class OnboardingContractError extends Error` w/ `code: 'wrong-account' | 'deleted' | 'naive-timestamp' | 'inverted-range' | 'missing-id'` + a `warnings: string[]` field. Without a code enum, downstream test assertions are guesswork.
3. **Disambiguate `deleted` semantics**. Rule 6 handles `deleted === true` only. State explicitly: `deleted === undefined` ⇒ **importable with `deletedAt: null`**; `deleted === true` ⇒ `importable: false, reason: 'deleted'`. Add this as test case #6.
4. **Make wrong-account a hard reject, not a warning**. Rule 4 + Rule 7 currently overlap. Pick one: wrong `locationId`/`calendarId`/`assignedUserId` ⇒ throw `OnboardingContractError('wrong-account')`. Warnings are for soft signals; identity mismatch is a hard stop. Update test case #2 to assert a thrown error (not "or mark non-importable").
5. **Add a credential-leak test case**. Rule 8 is asserted in prose only. Add test #7: feed a readback containing `apiKey`, `authorization`, `cookie`, `bearer` fields ⇒ contract output must not contain any of them. This is the load-bearing safety invariant; the test list omits it.
6. **Define function signatures**. `normalizeReadback(raw)` / `assertImportable(appointment)` / `instantsMatch(a, b)` / `buildDryRunAudit(input)` need at least `(name, input, output, error mode)` — one line each. Implementer cannot copy-paste the API surface otherwise.

## SHOULD FIX (post-merge polish)

1. **Split bundled test case**: "Reject timezone-naive timestamps AND `endTime <= startTime`" → two cases; otherwise the test could pass on either dimension.
2. **Add fixture readback** mirroring the canonical `Cxa6iMN4am9r1XUdJWWS` reschedule from ppweb-9 (`2026-06-12T10:00:00-07:00` → expected `2026-06-12T11:00:00-06:00`). Today test #1 has the timestamps but not the surrounding JSON shape.
3. **Pick a validation approach** (Zod / Valibot / plain guards) or justify the no-library choice. The persistence-schema sibling (0ka.5) used SQL-side guards; this lane should at least declare the equivalent on the TS side.
4. **Audit payload traceability** — Rule 9 says "enough IDs" (loose). Tighten: include `appointmentId`, `contactId`, `calendarId`, `locationId` explicitly, plus a `readbackHash` derived from the canonical readback fields (deterministic, no credentials). Lets any future log line trace one specific readback.
5. **Add `bead: "ppweb-0ka.7"` as an asserted test**, not just an audit-payload field. Otherwise a typo in the literal still passes the dry-run test.
6. **Cross-link sibling PRDs** in Source Evidence: 0ka.4 (Google Meet dry-run prototype) and 0ka.5 (persistence schema contract) so the type system doesn't drift across the epic.
7. **Note `googleConferenceLink` may be absent** in the readback as an explicit `link: null | string` field on the normalized shape (Rule under "Known limitation" — currently a doc bullet but not a type consequence).
8. **Reject the proof appointment's exact test scenario twice** — once for instant equality (`10:00-07:00` == `11:00-06:00`) and once for offset string divergence. Catches implementations that string-compare instead of `.getTime()`-compare.

## Final Score

**33 / 50 (66%)** — **NOT READY** for implementation. CE merge pass needed; with the 6 MUST FIX applied and 2–3 SHOULD FIX cherry-picked, the improved version should land in the 44–47 range consistent with 0ka.3/0ka.4/0ka.5 improved siblings.

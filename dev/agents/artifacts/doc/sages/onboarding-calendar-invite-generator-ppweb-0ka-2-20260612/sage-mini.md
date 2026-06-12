# Mini Sage Review — `ppweb-0ka.2` Onboarding Calendar Invite Generator PRD

## Score: 36 / 50 (72%) — **BLOCKING**

| Dimension | Score | Δ vs 46/50 target |
|---|---|---|
| Completeness | 8 | -2 |
| Clarity | 7 | -3 |
| Actionability | 7 | -3 |
| Testability | 7 | -3 |
| Safety | 7 | -3 |

Below the 46/50 (92%) self-target by 10 points. PRD is structurally sound for a PoC, but loose specs in 5-6 areas create implementation drift risk. One CE improvement pass on the must-fix list should close the gap.

---

## Must-Fix (blockers before implementation)

1. **Data URL encoding not pinned.** Base64 vs percent-encoded (`data:text/calendar;charset=utf-8;base64,...` vs `;charset=utf-8,...`) is a real choice that affects the data URL length, file size, and how the ICS is consumed by browsers. Pick one, write it in §ICS Requirements.
2. **`providerNotes` shape undefined.** Output contract lists `providerNotes` but never specifies whether it's `string | string[] | Record<provider, string>`. The Apple/Zoho fallback language ("with a provider note") implies per-provider, but it's not typed.
3. **UID/DTSTAMP determinism rule is loose.** "Stable" and "when `id` and `createdAt` are provided" doesn't say what UID format is emitted. Specify: e.g. `UID:${id}@patronpro.com` and `DTSTAMP` always derived from `createdAt` (fallback behavior when missing?). Currently a CE could write either branch and the test would still pass on one of them.
4. **PRODID value not specified.** RFC 5545 requires it. Suggest `-//PatronPro//Onboarding Calendar Invite//EN` as a concrete default in §ICS Requirements.
5. **Provider URL coverage is contradictory.** §Provider URL says "include description, location/join URL, and start/end times in all provider links that support them" but §Provider URL Requirements also says Apple and Zoho fall back to `icsDataUrl` only. State explicitly: Apple/Zoho do NOT get a per-provider URL — they get the data URL + `providerNotes` entry. The current text lets a CE read "include all fields in all links that support them" and waste time building Apple/Zoho compose endpoints that won't be used.
6. **Datebook revisit trigger is too vague.** §Failure Modes says "if Datebook is later added, require a separate dependency/license review" but doesn't say **what business signal** triggers the revisit. PoC can ship the clean-room, but the "later" path needs a concrete condition (e.g., "when Zoho URL prefill becomes a hard requirement" or "when i18n non-America/Mexico_City timezones enter scope").

---

## Should-Fix (improvement pass)

1. **TypeScript interface signature missing.** Output is listed as fields but no `interface CalendarInviteInput` / `interface CalendarInviteOutput` block. Adding it would tighten actionability significantly.
2. **URL encoding strategy not specified.** `URLSearchParams` vs manual `encodeURIComponent` produces different escaping. Pick `URLSearchParams` and say so.
3. **VALARM `ACTION` not specified.** RFC 5545 default is `DISPLAY`, but `AUDIO` is also common. Pick one.
4. **Email validation absent.** `organizerEmail`/`attendeeEmail` go into `ORGANIZER;CN=...:mailto:` and into the ICS `ATTENDEE` line. Without a basic format check, an unvalidated string can produce a malformed ICS. Add a regex or `URL`-parse step in §Failure Modes.
5. **Test vectors missing for "escapes correctly".** Test #3 needs at least one explicit input string with a comma, semicolon, backslash, and newline, and the expected escaped output. Otherwise the assertion is unfalsifiable.
6. **No regression guard against re-adding Datebook or `add-to-calendar-button`.** A trivial `package.json` snapshot test ("neither dependency is present") would lock the license/scope decision in CI.
7. **Sample artifact content list not specified.** Path is given but the PRD doesn't enumerate the fields the JSON must contain (e.g., `payload`, `output.icsText`, `output.icsDataUrl`, `output.links`, `output.checksums.sha256`, `providerNotes`).
8. **URL length ceiling not addressed.** Google render URL has ~8192 char practical limit; long descriptions in `details=` will silently break. Add a length check or truncate-and-note behavior in §Failure Modes.
9. **ICS line folding rule is fuzzy.** "Fold lines at 75 octets or less **where practical**" — `where practical` invites drift. RFC 5545 §3.1 says lines SHOULD be ≤75 octets; make it a hard rule and note that fold inserts `\r\n ` (CRLF + space).
10. **DST / non-America/Mexico_City timezones.** The default is `America/Mexico_City` and the slice is PoC, but the input accepts an IANA string. State explicitly: input is expected to be `timeZone`-aware ISO (e.g., `2026-06-15T10:00:00-06:00`), and the generator normalizes to UTC in ICS. Without this, a future caller passing a naive ISO could produce wrong times.

---

## Residual Risks (won't be fully eliminated by another pass)

1. **Custom iCal conformance drift.** A clean-room generator reimplementing line folding, escape, and VALARM will have edge cases. Mitigation: add an ICS parser as a test dependency (e.g., `node-ical` or `ical.js`) and round-trip the output through it in tests. Not in current §Tests; flag for follow-up bead.
2. **Provider URL deprecation.** `calendar.google.com/calendar/render` and the Outlook deeplinks have been stable for years but are undocumented contracts. A breakage lands with no upstream signal. Mitigation: a smoke test that hits each URL and asserts 200/HTTP 2xx on a known-valid payload (separate from unit tests).
3. **PII leakage in sample artifact.** PRD says "non-secret, non-live" but doesn't forbid obvious patterns (e.g., `@gmail.com` real-looking). Add a linter or assertion that emails in the sample match a fake domain like `@example.com`.
4. **Outlook tenant variability.** Personal vs business Microsoft 365 tenants render the deeplink differently. PoC scope is fine, but `providerNotes` should flag this so a future caller knows.
5. **Datebook staleness not load-bearing for the PoC but limits future growth.** If the team needs to add Yandex, Yahoo, Office365 admin-level URLs, the clean-room will need expansion. Document this trade-off in the bead close note so the next maintainer sees the rationale, not just "we hand-rolled it".
6. **`add-to-calendar-button` Elastic 2.0 concern is correct, but worth a one-line note** in the PRD about which downstream projects would be affected (web only? mobile too?) if it were the only viable option. Current PRD just says "excluded" without scope.

---

## On the Datebook Decision Specifically

**Verdict on the decision: defensible for PoC, but the rationale could be tighter.**

- **MIT + 3-years-stale** is a real signal — but the PRD leans on "before Monday" timeline pressure as the main reason. That reads as schedule-driven, not technical. Recommend reordering: lead with the **stale-dep + auditability** argument; mention the Monday deadline as secondary.
- The **clean-room implementation must reinvent** at least: iCal escape, line folding per RFC 5545 §3.1, VALARM, 4 provider URL templates with correct encoding. That's 200-400 lines of code where every function is a potential conformance bug. The PRD doesn't acknowledge this cost.
- The **`add-to-calendar-button` Elastic 2.0 exclusion** is the stronger part of the dep rationale — that one is a hard license blocker. Lead the §Dependency Decision with this, then the staleness, then auditability.
- The **"later candidate" framing is correct** but needs a concrete trigger. See must-fix #6.

---

## Approval Verdict: **BLOCKING — Send to CE for one improvement pass**

The PRD is honest about its PoC scope and the dep decision is defensible, but 6 must-fix items create real implementation drift risk if CE starts coding today. After one focused CE pass on the must-fix list (estimated 30-45 min of PRD edits, not implementation), this should clear 44-46/50 and be safe to implement.

**Do not start implementation yet.** Hand to CE with the must-fix list above; expect a `…-improved.md` artifact before any `src/lib/onboarding/calendar-invite.ts` work begins.

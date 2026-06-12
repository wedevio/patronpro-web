## Sage: MiniMax (Depth & Rigor)

### Score: 38/50

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 7/10 | Missing event-level fields (`transparency`, `guestsCan*`, `extendedProperties`), missing integration boundary with GHL trigger, no iCalUID/idempotency story |
| Clarity | 8/10 | Sections are well-organized, payloads are explicit, naming is consistent |
| Actionability | 7/10 | Script path is given but no function signatures, no CLI output schema, no JSON Schema for the assertion step |
| Testability | 7/10 | Only `py_compile` + a vague "JSON assertion"; no fixture data, no negative-case coverage (e.g. sendUpdates=non-none without flag) |
| Safety | 9/10 | Dry-run default, lazy imports, secret hygiene, no live calls — all strong. Minor gap: no explicit rule about logging attendee PII in dry-run output |

---

### Strengths (keep these)

- **Dry-run-first architecture** (Safety Rules, Acceptance Criteria) is a strong default and correctly states that `sendUpdates=none` is **not** a safety mechanism — this is a subtle but real anti-pattern that many PoCs fall into.
- **Source Baseline** is dated, URL-anchored, and maps each finding to a specific claim (e.g. `conferenceDataVersion=1` required, `requestId` freshness, async conference generation). This is exactly the citation density an auditor needs.
- **"No live mutation in this bead"** is stated in three places (Goal, Product Constraints, Acceptance Criteria) — good defense-in-depth against scope creep.
- **Scope hierarchy** is correctly described: broad `calendar` vs. narrower `calendar.events` / `calendar.app.created` / `calendar.events.owned`. This protects against a future over-broad consent screen.
- **Token invalidation guidance** ("delete any existing `token.json` if the scope changes") is a non-obvious operational detail that most PoCs miss.
- **Separation of Desktop-client test path vs. future server path** is realistic and correctly flags the domain-wide-delegation caveat for service accounts.

---

### Logical Issues

| Issue | Severity | Section | Why It's Wrong | Fix |
|-------|----------|---------|----------------|-----|
| `requestId` "fresh-unique-request-id" used as the literal example value | Medium | Payload Contract → Minimum event body | A literal placeholder passed verbatim to a future live call would either (a) collide with other PoC runs in the same test calendar or (b) be silently ignored, producing no Meet link. | Replace with an explicit placeholder format and a hard-coded `REPLACE_BEFORE_LIVE_USE` guard in the script that refuses to run live with a literal value. |
| `requestId` collision rule is incomplete | High | Source Baseline | The doc says "repeated IDs can be ignored" but does not say **whose** requestId is checked (the conference's, not the event's). It also fails to note that `requestId` idempotency is **per (organizer, calendarId)**, so two organizers can safely reuse the same string. | Add: "`requestId` idempotency is per `calendarId`; collision only matters within a single organizer's calendar." |
| Async conference generation claim is over-broad | Medium | Source Baseline | For `events.insert` with `conferenceDataVersion=1`, the Meet link is normally returned synchronously in the response. The async path is mainly relevant for `events.patch` updates and for some Workspace tenants with propagation delays. | Reframe: "Conference generation is *usually* synchronous on insert; treat the response as eventually consistent and poll `conferenceData.entryPoints` if absent on first read." |
| `useDefault: false` is silently required, not just preferred | Low | Payload Contract → reminders | The doc says it's an example value, but if `useDefault: true` is sent, the `overrides` array is ignored. For a PatronPro reminder policy (24h email + 1h popup), this is the load-bearing field. | Add a sentence: "`useDefault: false` is required for the `overrides` below to apply." |
| `sendUpdates` defaulting to `"none"` in the example query is presented as harmless | Medium | Payload Contract → Request metadata | Sending an event insert with `sendUpdates=none` **still creates a calendar event with attendees attached** — attendees will see the event in their calendar (just no email). For a PoC that claims "no notifications", the doc should make the stronger statement: dry-run never reaches the wire, so the `sendUpdates` value in the dry-run JSON is metadata only. | Add: "In dry-run, this field is emitted but no HTTP call is made; the value here is the value the live call *would* use." |
| Operator-approval mechanism for live mode is undefined | Medium | Proposed Deliverables #1, Safety Rules | "Requires operator approval" is not operationalized. Is it a CLI flag, a second human-in-the-loop prompt, a PR review, an env var? Without this, a future contributor could flip `--execute` and ship. | Specify: "Live execution requires `--execute` AND `--confirm-live` AND a non-empty `PATRONPRO_LIVE_TOKEN` env var; the script aborts with non-zero exit if any are missing." |
| `requestId` "deterministic in dry-run using stable PatronPro fields plus a salt/date input" conflicts with "fresh per live attempt" | High | Proposed Deliverables #2 | Determinism in dry-run and freshness in live are both stated, but no rule distinguishes the two. A reviewer cannot tell whether the same deterministic value is *also* sent live (bad — would be ignored on the second attempt and create an event without Meet) or whether the script generates a new UUID. | Add: "The script MUST regenerate `requestId` at the boundary between dry-run and live, and live mode MUST verify the `requestId` is a UUIDv4 (or equivalent RFC 4122 random ID) before sending." |
| `conferenceDataVersion=1` is the **only** valid value | Low | Source Baseline | The doc says it's "required" but doesn't say it must equal 1, not 0 and not omitted. Future contributors might assume future versions exist. | Add: "As of 2026-06-12, the only supported value is `1`; any other value (or omission) is rejected with `400`." |
| `timeZone` field combined with offset-bearing `dateTime` is not explained | Low | Payload Contract → start/end | The example uses `"dateTime": "2026-06-15T10:00:00-05:00"` and `"timeZone": "America/Mexico_City"`. Google treats `dateTime` as wall-clock time in `timeZone`; the offset is only used for DST edge cases. A naïve reader will think the offset is authoritative. | Add: "`dateTime` is interpreted as wall-clock time in `timeZone`; the numeric offset is informational and used only for DST transitions." |

---

### Missing Edge Cases

| Edge Case | Impact | Where to Add | Suggested Implementation |
|-----------|--------|--------------|--------------------------|
| **DST transition day** (e.g. 2026-11-01 in `America/Mexico_City` is a DST day in the US — but Mexico abolished DST in 2022, so the offset is constant year-round; this is non-obvious) | High — wrong start/end time on a booking day | Payload Contract, plus a script validation step | Add an explicit note: Mexico abolished DST in 2022; `America/Mexico_City` is UTC-6 year-round. The script should assert the offset matches the IANA DB for the booking date. |
| **All-day events** | Medium — onboarding may eventually span multiple days or use date-only events | Payload Contract | Document that all-day events use `"date"` (not `"dateTime"`) and have **no** `conferenceData` (Meet requires timed events). |
| **Event idempotency** (`iCalUID`) | High — if the dry-run/live boundary retries, the same `iCalUID` updates the same event rather than creating duplicates | Payload Contract | Recommend `iCalUID: "patronpro-{ghlAppointmentId}@patronpro.app"` and document that Google dedupes on this. |
| **Attendee with no Google account** (external client) | Medium — the `attendees[].email` may not resolve; `sendUpdates=externalOnly` vs `all` matters here | Source Baseline (sendUpdates), Safety Rules | Add a row: external attendees cannot use Meet unless invited with their email; their join link is the `entryPoints[].uri` (phone or web). |
| **Organizer's calendar is a resource calendar** (e.g. `conf-room-1@resource.calendar.google.com`) | Low for PoC, but possible later | OAuth Checklist → future server path | Document that `organizer` cannot be set via API; it's derived from the OAuth principal. |
| **Calendar app-level `auth/calendar.events` scope still requires Google's "sensitive scope" verification** for non-internal apps | High — blocks production | OAuth Checklist, Product Constraints | Add: "`calendar.events` is a sensitive scope requiring Google's OAuth verification for external users; for an internal PoC, use the test-user allowlist and document the verification path before any external rollout." |
| **Rate limits** (default 1,000,000 queries/day per project, but write quotas are lower) | Low for PoC | New subsection: "Operational Notes" | Add a one-paragraph note: "Calendar API write quota is 100 req/sec/project by default; the PoC's `--execute` loop should add a 100ms sleep per request and back off on `403 rateLimitExceeded`." |
| **Time-zone-naive client input** | High — GHL may send `2026-06-15T10:00:00` without offset | Payload Contract, script behavior | The script MUST reject `dateTime` values without an offset or `timeZone`; otherwise Google interprets the time in the calendar's default zone. |
| **Cross-organizer conference reuse** | Low | Source Baseline | The doc should clarify that `requestId` is per-organizer; sharing a `requestId` across organizers does not link conferences. |
| **Recurring onboarding sessions** (e.g. weekly stand-up) | Medium | Payload Contract | Note: Meet on recurring events requires `conferenceData` on the **parent** event, not the children. The PoC should be scoped to single events only and document the recurring case as out-of-scope. |
| **Attendee PII in dry-run output** | Medium (privacy) | Safety Rules | Dry-run JSON may contain `attendees[].email`; if this is logged to RLM or committed, it leaks. Add: "Dry-run output MUST redact `attendees[].email` to `***@***` unless `--show-pii` is set, and `RLM` storage MUST store the redacted form." |
| **Empty `description` / no `summary`** | Low | Payload Contract | Google rejects events with empty `

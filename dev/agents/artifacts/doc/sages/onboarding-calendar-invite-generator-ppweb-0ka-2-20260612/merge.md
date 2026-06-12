# Quality Loop Merge: Onboarding Calendar Invite Generator

Date: 2026-06-12
Bead: `ppweb-0ka.2`
Topic: `onboarding-calendar-invite-generator`
Council: Mini + CE only

## Mini Review Result

- Mini score: 36/50.
- Verdict: blocking; do not implement until PRD is improved.

## Must-Fix Targets For CE

1. Pin `icsDataUrl` encoding as base64: `data:text/calendar;charset=utf-8;base64,...`.
2. Define `providerNotes` as a typed per-provider record.
3. Specify deterministic `UID` and `DTSTAMP` behavior, including fallback rules.
4. Specify exact `PRODID`: `-//PatronPro//Onboarding Calendar Invite//EN`.
5. Clarify Apple and Zoho are ICS fallback providers, not per-provider compose URLs.
6. Define concrete triggers for revisiting Datebook later.

## Should-Fix Targets For CE

- Add TypeScript `CalendarInviteInput` and `CalendarInviteOutput` interface blocks.
- Specify `URLSearchParams` for provider URL encoding.
- Specify VALARM `ACTION:DISPLAY`.
- Add basic organizer/attendee email validation.
- Add explicit escape test vectors.
- Add regression guard that Datebook and `add-to-calendar-button` are not dependencies in this slice.
- Define sample artifact fields.
- Add URL length ceiling behavior.
- Make line folding a hard rule using CRLF + space continuation.
- Clarify timezone-aware ISO input expectations and UTC normalization.

## Desired CE Output

Write an improved PRD at:

`dev/agents/artifacts/doc/plan/onboarding-calendar-invite-generator-ppweb-0ka-2-2026-06-12-improved.md`

The improved PRD should preserve the clean-room/no-live-mutation scope and include self-assessment out of 50.

# Merge: ppweb-0ka.8 Monday presentation packet

Input PRD: `dev/agents/artifacts/doc/plan/onboarding-monday-presentation-packet-ppweb-0ka-8-2026-06-12.md`
Mini review: `dev/agents/artifacts/doc/sages/onboarding-monday-presentation-packet-ppweb-0ka-8-20260612/sage-mini.md`
Mini score: 30/50

## MUST FIX

1. Add the actual demo script:
   - deterministic sample contact and appointment data;
   - expected calendar/ICS outcome;
   - panel navigation steps;
   - environment preflight.

2. Define presentation format:
   - audience;
   - duration;
   - format;
   - whether this packet is final deliverable or slide source.

3. Add per-bead evidence map:
   - bead id;
   - commit hash;
   - artifact paths;
   - verification commands/results;
   - safety boundary.

4. Define Mini pass/fail criteria for this packet:
   - all required sections present;
   - no live-mutation ambiguity;
   - per-claim evidence exists;
   - next queue is explicit.

5. Define CE fallback:
   - retry CE if quota becomes available;
   - if still unavailable, publish with Mini findings manually applied and record CE quota block.

6. Add live-mutation discovery and incident response:
   - stop demo;
   - capture evidence;
   - identify system and action;
   - file bead/errata;
   - revert/disable affected path before continuing.

7. Expand Google Meet setup:
   - OAuth credentials and scopes;
   - credential owner;
   - dry-run/live cutoff;
   - approval gates and expected API fields.

## SHOULD FIX

1. Add section length/timing budget.
2. Add Monday morning preflight checklist.
3. State chosen calendar dependency path: current clean-room generator, Datebook only if needed, no add-to-calendar-button core dependency without approval.
4. Verify fork URL and include it.
5. Cross-reference bead outputs to report sections.
6. Use dry-run/live matrix columns: action, system, current state, live gate, owner.
7. Add errata process if packet claim is wrong.

## NOT FIXING

1. Do not create slides or PDFs unless explicitly requested.
2. Do not start a dev server or run browser automation for packet generation.
3. Do not perform live GHL/Google/email/database/panel mutations.

## Approval Target

The final report must be ready to read aloud or use as a slide source on Monday. It must pass `git diff --check` and have enough concrete evidence that the next presenter does not need to rediscover child bead outputs.

# PRD: Monday onboarding automation presentation packet

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.8`
Date: 2026-06-12
Status: Improved after Mini review; CE retry pending quota availability

## Goal

Prepare and publish a Monday-ready packet for the onboarding automation PoC. The packet must be usable as the meeting script and as source material for slides if Oscar wants a deck later.

Final report:

`doc/reports/2026/06/patronpro-onboarding-automation-poc-packet-2026-06-12.md`

## Mini Findings Applied

Mini scored the draft PRD 30/50 and required:

- actual demo script with deterministic sample data;
- presentation format, timing, audience, and fallback;
- per-bead evidence map;
- pass/fail criteria for Mini and quality gate;
- CE quota fallback;
- live-mutation discovery and incident response;
- Google Meet setup details.

The final report now includes all of those sections.

## Packet Contract

Audience:

- Oscar first.
- Carlos/stakeholders only if Oscar wants to show the GitHub/fork lane.

Format:

- 15-minute document walkthrough.
- Optional 5-minute local panel demo.
- The report is the deliverable; slides/PDF are out of scope unless requested.

Required sections:

- executive summary;
- Monday morning preflight;
- deterministic demo script;
- architecture snapshot;
- dry-run/live matrix;
- license/dependency decision;
- Google Meet setup path;
- GitHub collaboration lane;
- per-bead evidence map;
- quality matrix;
- Mini/CE gate handling;
- incident response;
- known blockers;
- next queue;
- errata process.

## Verification Plan

Run:

```bash
bun test tests/onboarding-calendar-invite.test.ts tests/onboarding-invite-preview.test.ts tests/onboarding-invite-api.test.ts tests/onboarding-ghl-appointment-contract.test.ts
git diff --check
```

Optional checks:

```bash
rg -n "Executive Summary|Demo Script|Dry-Run And Live Boundary Matrix|Per-Bead Evidence Map|Incident Response|Next Implementation Queue" doc/reports/2026/06/patronpro-onboarding-automation-poc-packet-2026-06-12.md
gh api repos/mensajerokaos/patronpro-web --jq '[.full_name,.html_url,(.fork|tostring),(.parent.full_name // ""),.default_branch,(.private|tostring)] | @tsv'
```

## CE Fallback

CE was quota-blocked during `ppweb-0ka.7` until 17:40 CST. If quota is still unavailable, close `ppweb-0ka.8` only after:

- Mini findings are manually applied;
- the final report exists at the canonical path;
- required checks pass;
- the CE quota blocker is recorded in `ce-last-message.out`.

## Acceptance Criteria

- Final report exists under `doc/reports/2026/06/`.
- It includes the required sections listed above.
- It names exact bead IDs, commit hashes, paths, and commands.
- It explicitly states no live GHL, Google, email, database, browser, or PatronPro panel mutation was performed by the PoC slices, except the approved GitHub fork creation in `ppweb-0ka.6`.
- Mini findings are applied.
- CE blocker or CE approval is recorded.
- `git diff --check` passes.

## Final Self-Assessment

| Dimension | Score | Rationale |
| --- | ---: | --- |
| Completeness | 10 | Covers demo, architecture, boundaries, evidence, blockers, Google Meet setup, fork lane, and next queue. |
| Clarity | 9 | Defines audience, timing, report role, and readable presenter flow. |
| Actionability | 10 | Includes exact commands, paths, commits, demo data, and gate owners. |
| Testability | 9 | Provides required validation commands and grep checks; no live demo automation is required. |
| Safety | 10 | Includes dry-run/live matrix, no-mutation claims, incident response, license boundaries, and fork push gates. |
| Total | 48/50 | Approved target met with Mini findings manually applied; CE retry remains optional if quota resets before close. |

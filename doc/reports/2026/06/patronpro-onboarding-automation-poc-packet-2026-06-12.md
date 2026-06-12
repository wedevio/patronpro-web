# PatronPro Onboarding Automation PoC Packet

Date: 2026-06-12
Branch: `feature/onboarding-automation`
Worktree: `/home/oz/projects/2026/onboarding-automation`
Audience: Oscar first, then Carlos/stakeholders if Oscar chooses to show the GitHub/fork lane
Format: 15-minute document walkthrough with optional 5-minute local panel demo
Deliverable role: final Monday packet and slide source, not a generated slide deck

## Executive Summary

The PoC is ready to present as a deterministic, dry-run onboarding invite workflow.

What works now:

- GHL onboarding workflow inventory was documented read-only.
- A clean-room universal calendar invite generator produces ICS plus Google, Outlook, Office 365, Apple/iOS, Zoho, and direct ICS options.
- The protected `/panel/onboarding-invites` panel lets an operator preview the onboarding email, copy/download ICS output, inspect provider links, and produce a dry-run audit payload.
- Google Meet creation is researched and prototyped as a dry-run Google Calendar `events.insert` request with `conferenceDataVersion=1`; it is not live.
- Postgres-first persistence is designed with a Supabase migration path.
- The GitHub collaboration lane is defined, and the approved fork `https://github.com/mensajerokaos/patronpro-web` now exists as a fork of `wedevio/patronpro-web`.
- A GHL source-of-truth appointment import contract exists so the PoC can read PatronPro main-account onboarding appointments without making Google Calendar the scheduler.

The live boundary is intentionally conservative. No live GHL, Google, email, database, browser, or PatronPro panel mutation was performed by the PoC slices. The only approved live external mutation in this epic was the GitHub fork creation in `ppweb-0ka.6`.

## Presentation Timing

| Segment | Time | Purpose |
| --- | ---: | --- |
| Outcome summary | 2 min | Show the PoC is deterministic and bounded. |
| Demo script | 5 min | Walk through the panel and calendar artifacts. |
| Architecture | 3 min | Explain GHL source-of-truth and universal fallback first. |
| Safety and license decisions | 3 min | Explain dry-run boundaries, Datebook/add-to-calendar decisions, and no-main-branch rule. |
| Next queue | 2 min | Name the next approved engineering steps. |

If time is short, skip the live panel and use the deterministic sample payload plus screenshots/artifacts.

## Monday Morning Preflight

Run from `/home/oz/projects/2026/onboarding-automation`:

```bash
git status --short --branch
bun test tests/onboarding-calendar-invite.test.ts tests/onboarding-invite-preview.test.ts tests/onboarding-invite-api.test.ts tests/onboarding-ghl-appointment-contract.test.ts
bun run lint -- src/lib/onboarding/ghl-appointment-contract.ts tests/onboarding-ghl-appointment-contract.test.ts
git diff --check
```

Optional local panel demo:

```bash
bun run dev -- --hostname 127.0.0.1 --port 3023
```

Open:

```text
http://127.0.0.1:3023/panel/onboarding-invites
```

Profile 9 is not required for the local dry-run panel demo. Use WSL Chrome Profile 9 only if doing GHL UI reconnaissance, and do not fall back to Windows Profile 9 or Oscar personal Chrome profiles.

## Demo Script

### Sample Data

Use the seeded panel defaults or this equivalent deterministic record:

```json
{
  "clientName": "Demo Client",
  "businessName": "Demo Auto Shop",
  "clientEmail": "client@example.com",
  "meetingTitle": "PatronPro Onboarding",
  "start": "2026-06-15T10:00:00-06:00",
  "end": "2026-06-15T11:00:00-06:00",
  "timeZone": "America/Mexico_City",
  "location": "Google Meet",
  "joinUrl": "https://meet.google.com/demo-demo-demo",
  "organizerName": "PatronPro",
  "organizerEmail": "support@example.com"
}
```

Expected ICS time output:

```text
DTSTART:20260615T160000Z
DTEND:20260615T170000Z
```

Expected dry-run status:

```json
{
  "generated": true,
  "previewed": true,
  "sent": false,
  "ghlMutation": false
}
```

### Operator Steps

1. Open `/panel/onboarding-invites`.
2. Confirm the meeting form is populated with deterministic sample data.
3. Click preview/generate if needed.
4. Read the email preview out loud:
   - it names the business;
   - it includes the meeting time;
   - it includes the join link;
   - it is deterministic, not AI-generated.
5. Show the calendar action list:
   - Google Calendar link;
   - Outlook link;
   - Office 365 link;
   - Apple/iOS ICS fallback;
   - Zoho/ICS fallback;
   - direct ICS download/copy.
6. Download or copy the `.ics` content and point out the UTC-normalized `DTSTART`/`DTEND`.
7. Submit/inspect the dry-run audit payload.
8. State the boundary: this demo does not email the client, mutate GHL, create Google Calendar events, write to Postgres, or publish panel changes.

## Architecture Snapshot

```text
GHL main account appointment
  -> read/import contract (ppweb-0ka.7)
  -> local PoC panel preview (ppweb-0ka.3)
  -> clean-room calendar invite generator (ppweb-0ka.2)
  -> client-facing email preview + ICS/provider links
  -> future Postgres audit/persistence (ppweb-0ka.5)

Separate future track:
  Google Calendar API dry-run prototype (ppweb-0ka.4)
  -> only becomes live after OAuth credentials, scopes, approval, and sendUpdates policy are accepted.
```

The scheduler remains GHL. Google Calendar/Meet is an optional provider integration, not the appointment authority.

## Dry-Run And Live Boundary Matrix

| Action | System | Current state | Gate to flip live | Owner |
| --- | --- | --- | --- | --- |
| Read GHL workflow metadata | GHL | Read-only metadata documented | Profile 9 UI/export approval for internals | PatronPro operator |
| Generate ICS/provider links | Local code | Live deterministic local generation | Already safe; no external mutation | PatronPro engineering |
| Preview onboarding email | Local panel | Dry-run preview only | Email sender/domain/DNS approval and send policy | Oscar/product |
| Send onboarding email | Email/GHL | Not implemented | Explicit send approval, sender verified, suppression/audit path | Oscar/product |
| Create Google Meet | Google Calendar API | Dry-run request only | OAuth credentials, Calendar API scopes, consent, live-mode approval | Oscar/Google workspace owner |
| Persist invite/send audit | Postgres/Supabase | SQL contract only | Approved database env and migration run | Engineering |
| Import GHL appointment | Local code | Fixture/readback contract only | Approved read-only API token/runtime adapter | Engineering |
| Fork/copy Carlos repo | GitHub | Fork created in `mensajerokaos/patronpro-web` | FSN1 clone path and first-push approval | Oscar/engineering |
| Push experiment branch | GitHub | Not pushed | Secret scan, branch check, explicit first-push approval | Engineering |

## License And Dependency Decision

Current path: clean-room ICS/link generator. No new calendar package is required for the PoC.

Datebook remains acceptable as a first candidate if the generator needs a maintained helper later because its repo/package is MIT-licensed.

`add-to-calendar-button` is not a core PatronPro dependency. It is under Elastic License 2.0, which can be usable in some commercial contexts but has product/service restrictions. Use it only if legal/product explicitly accepts those restrictions.

## Google Meet Setup Path

The Google Meet path stays separate from the universal fallback.

To make it live later:

1. Create or choose a Google Cloud project owned by the right workspace/business owner.
2. Enable Google Calendar API.
3. Create OAuth client credentials or an approved service-account/domain-wide delegation strategy.
4. Use the least required calendar scope for event creation.
5. Insert events through `events.insert` with:
   - `conferenceDataVersion=1`;
   - `conferenceData.createRequest`;
   - deterministic non-sensitive `requestId`;
   - explicit `sendUpdates` policy;
   - GHL/PatronPro correlation metadata in private extended properties.
6. Keep GHL as source of truth; store Google event/Meet IDs as provider artifacts, not scheduler authority.
7. Run a live smoke only after explicit approval.

## GitHub Collaboration Lane

Confirmed facts:

- Source repo: `https://github.com/wedevio/patronpro-web`
- Fork destination: `https://github.com/mensajerokaos/patronpro-web`
- Verified on 2026-06-12: destination is a public fork of `wedevio/patronpro-web`, default branch `main`.
- Existing `mensajerokaos/patron-pro` is a separate private workspace with default branch `global`; it was not touched.

Next GitHub step only after approval:

1. Approve an FSN1 working path.
2. Clone with `upstream=https://github.com/wedevio/patronpro-web.git`.
3. Set `origin=https://github.com/mensajerokaos/patronpro-web.git`.
4. Create `feature/onboarding-automation-poc`.
5. Run LFS/submodule/CODEOWNERS/repo-shape checks and credential scanning.
6. Push only after explicit first-push approval.

## Per-Bead Evidence Map

| Bead | Commit | Output | Verification |
| --- | --- | --- | --- |
| `ppweb-0ka.1` GHL workflow map | `ba581303d2fc98bcce6729efb709aec9e9d4aecc` | `dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md` | Read-only GHL workflow metadata probe; no mutation. |
| `ppweb-0ka.2` calendar invite generator | `2a9701a31b9013fa1ea5f212169458f883fc3610` | `src/lib/onboarding/calendar-invite.ts`; `tests/onboarding-calendar-invite.test.ts` | Focused Bun tests; dependency guard confirms no Datebook/add-to-calendar-button dependency. |
| `ppweb-0ka.3` panel | `7ffb6bd783bcf816e2218fab175a757092a0813f` | `/panel/onboarding-invites`; dry-run API route; Playwright screenshots in `/tmp` from validation run | 20 focused tests, targeted lint, desktop/mobile Playwright smoke at implementation time. |
| `ppweb-0ka.4` Google Meet dry-run | `d13781c6a64a9c4db9c0a2c38af425df668d8791` | `dev/agents/artifacts/script/onboarding-automation/google_meet_calendar_poc.py` | `python3 -m py_compile`, validator, JSON validation, redaction grep, `git diff --check`. |
| `ppweb-0ka.5` Postgres persistence | `ad41b1f903389e84a11f72ea4b6bf0cdb43a19eb` | `dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql` | Static SQL validator passed; DB execution not run because local Postgres tooling absent. |
| `ppweb-0ka.6` GitHub fork lane | `8966dea579ad51424ad51439ef8a95a26c4e86b9` | `dev/agents/artifacts/doc/test/onboarding-automation/github-fork-execution-ppweb-0ka-6-2026-06-12.md` | FSN1 GitHub REST fork creation; REST parent verification; FSN1 `git ls-remote` verification. |
| `ppweb-0ka.7` GHL appointment contract | `d01e00b399ffab405e46e6c02ef90d414b031b6b` | `src/lib/onboarding/ghl-appointment-contract.ts`; `tests/onboarding-ghl-appointment-contract.test.ts` | 12 focused tests, 32-test onboarding slice, targeted lint, `git diff --check`. |

Current final validation for this packet should rerun:

```bash
bun test tests/onboarding-calendar-invite.test.ts tests/onboarding-invite-preview.test.ts tests/onboarding-invite-api.test.ts tests/onboarding-ghl-appointment-contract.test.ts
git diff --check
```

## Quality Matrix

| Dimension | Pass condition | Current state |
| --- | --- | --- |
| Completeness | All calendar targets, dry-run/live states, fork lane, Google Meet path, and persistence path covered | Covered in this packet |
| Clarity | A presenter can explain the system without rediscovering bead history | Bead evidence table and demo script included |
| Actionability | Next agent has paths, commands, commits, and gates | Included |
| Testability | Demo has deterministic sample data and verification commands | Included |
| Safety | No ambiguous live mutation, credential, or Carlos main-branch risk | Boundaries and incident response included |

## Mini And CE Gate Handling

Mini reviewed the PRD and scored it 30/50. The required fixes were:

- actual demo script;
- presentation timing/audience;
- per-bead evidence map;
- Mini pass/fail criteria;
- CE fallback;
- incident response;
- Google Meet setup details.

This packet applies those fixes.

CE was already quota-blocked during `ppweb-0ka.7` until 17:40 CST. If CE is still unavailable before close, publish this packet with the Mini findings applied manually and record the CE blocker. If CE becomes available, run a merge/review pass and revise the packet only for material issues.

Mini pass/fail criteria for this packet:

- Every required section exists.
- Every live/dry-run claim has a system and gate.
- Every bead in `ppweb-0ka.1` through `ppweb-0ka.7` has a commit and artifact reference.
- The next queue is explicit.
- The packet does not contain credentials, cookies, tokens, browser state, or unapproved live-action instructions.

## Incident Response If A Live Mutation Is Discovered

If a demo or review finds that a supposedly dry-run path performed a live action:

1. Stop the demo.
2. Capture the exact action, timestamp, user/account, request path, and artifact.
3. Identify the system: GHL, Google, email, database, GitHub, or panel.
4. Disable the path or revert the commit if local code caused it.
5. If the live system has a safe rollback, perform it only with explicit approval.
6. Add a bead for the incident and update `CHANGELOG.md`.
7. Add an errata note to this packet or a dated replacement report under `doc/reports/2026/06/`.

## Known Blockers

- GHL workflow trigger/action internals still need Profile 9 UI reconnaissance or an approved export.
- Google Calendar/Meet live creation needs OAuth credentials, scopes, consent, and explicit approval.
- Postgres migration has not been applied to a live DB in this worktree.
- Email sending is not implemented; sender/domain approval remains separate.
- The fork exists, but no experiment branch has been pushed to `mensajerokaos/patronpro-web`.
- CE review for late beads may need retry after usage quota resets.

## Next Implementation Queue

1. Wire the GHL appointment contract into a read-only adapter that can import an approved appointment readback into the panel.
2. Apply the Postgres migration in an approved local/dev database and connect dry-run persistence.
3. Add a send-disabled email preview persistence path.
4. Complete Profile 9 workflow internals reconnaissance for the four onboarding workflows.
5. Prepare Google OAuth credentials and run a controlled dry-run-to-live readiness review.
6. Create the FSN1 working clone and `feature/onboarding-automation-poc` branch only after path and first-push approval.
7. Convert this packet into slides or a PDF only if Oscar wants that format.

## Errata Process

If any claim in this packet is later found wrong:

1. Add a dated correction entry to `CHANGELOG.md`.
2. Store the correction in RLM with `artifact_status: current`.
3. Create a replacement report with the same filename stem plus `-errata-N` or a newer date.
4. Link the correction from the next handoff.

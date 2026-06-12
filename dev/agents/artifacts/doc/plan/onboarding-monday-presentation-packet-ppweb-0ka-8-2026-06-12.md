# PRD: Monday onboarding automation presentation packet

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.8`
Date: 2026-06-12
Status: Draft for quality loop

## Goal

Prepare a Monday-ready presentation packet for the onboarding automation PoC that lets Oscar explain what works, what remains dry-run/manual, why the architecture is safe, and what the next implementation queue should be.

## Required Output

Create the finalized report:

`doc/reports/2026/06/patronpro-onboarding-automation-poc-packet-2026-06-12.md`

Keep the quality-loop artifacts under:

`dev/agents/artifacts/doc/sages/onboarding-monday-presentation-packet-ppweb-0ka-8-20260612/`

## Required Content

The report must include:

1. Executive summary.
2. Current branch/worktree/commit context.
3. What works in the PoC:
   - read-only GHL workflow map;
   - universal calendar invite generator;
   - `/panel/onboarding-invites` dry-run panel;
   - Google Meet Calendar API dry-run prototype;
   - Postgres/Supabase-compatible persistence contract;
   - GitHub fork lane and created `mensajerokaos/patronpro-web` fork;
   - GHL source-of-truth appointment import contract.
4. Demo script with deterministic sample data and exact operator steps.
5. Architecture snapshot:
   - GHL main account remains scheduler/source of truth;
   - PoC reads/imports appointments;
   - panel previews email/calendar invite;
   - universal ICS/provider links are first option;
   - Postgres is persistence target, Supabase migration path retained;
   - Google Meet creation remains future/dry-run until OAuth and approval.
6. Dry-run versus live boundary matrix.
7. Quality-loop matrix for completeness, clarity, actionability, testability, safety.
8. Verification evidence by bead, including commands and commits.
9. License/dependency note:
   - Datebook is MIT-compatible as first candidate if needed;
   - clean-room generator is currently used;
   - `add-to-calendar-button` is Elastic License 2.0 and not a core dependency unless legal/product accepts restrictions.
10. Google Meet setup requirements.
11. GitHub collaboration lane for Carlos/Mensajero Caos.
12. Known blockers and manual steps.
13. Next implementation queue.

## Source Evidence

Use local artifacts and RLM checkpoints from:

- `ppweb-0ka.1` through `ppweb-0ka.7`
- active RLM epic checkpoint:
  `/mnt/rlm/knowledge/projects/patronpro-web-docs-automation/patterns/patronpro-onboarding-automation-worktree-point-2026-06-12.md`
- dedicated RLM checkpoints for `ppweb-0ka.6` and `ppweb-0ka.7`
- current `CHANGELOG.md`
- commit history on `feature/onboarding-automation`

## Acceptance Criteria

- Final report exists under `doc/reports/2026/06/`.
- It includes demo steps, architecture snapshot, dry-run/live boundaries, license notes, Google Meet setup, fork lane, verification evidence, blockers, and next queue.
- It names exact bead IDs, commit hashes, paths, and commands.
- It explicitly states no live GHL, Google, email, database, browser, or PatronPro panel mutation was performed by the PoC slices, except the approved GitHub fork creation in `ppweb-0ka.6`.
- Mini reviews the packet before close.
- CE merge is retried if quota is available; if still quota-blocked, record the blocker and close only if Mini findings are applied manually.
- `git diff --check` passes.

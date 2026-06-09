# Changelog

## 2026-06-09

- Created isolated `wedevio/patronpro-web` worktree at `/home/oz/projects/2026/patronpro-web-docs-automation` on branch `feature/liverpool-digital-docs-automation`.
- Confirmed GitHub write access for `wedevio/patronpro-web` before cloning.
- Ran Genesis bootstrap for agent artifact lanes, report storage, and local Beads task tracking with prefix `ppweb`.
- No live PatronPro panel, Supabase, or GHL changes were made during bootstrap.
- Created epic bead `ppweb-elk` and child beads for documentation ingest, checklist extraction, dry-run automation, QC, FSN1, and final handoff.
- Stored source index, required change list, and FSN1 runbook in RLM under `patron-pro/docs/patronpro-web`.
- Added dry-run automation harness for `qc`, `plan`, and `export-docs` modes.
- Ran quality-loop review with Codex and Mini reviewers; merged must-fix findings into the harness.
- Added a quality-loop onboarding automation report for Liverpool Digital with section-by-section automation/QC mapping.
- Added `assign-calendar-owner` harness command with dry-run default and exact calendar targeting from booking custom values.
- Applied the safe live calendar owner assignment in GHL: `Consulta Gratuita` and `On Site Visit` now each have the single Liverpool Digital user assigned.
- Added explicit QA gates for calendar owner assignment, calendar activation, deferred `landing_form`, and final account activation.
- Filed follow-up beads for calendar activation, website publication proof, Supabase/panel state access, Brand Boards, and GHL contact-form/DND customization.
- Added and applied `activate-calendars`; both Liverpool Digital onboarding calendars are now active via GHL API with owner assignment unchanged.
- Added `website-assets` read-only proof for generated HTML/images and GHL website/page inventory; GHL page-content publication remains unproven by documented API and is queued for browser fallback.
- Added and applied `apply-brand-board`; Liverpool Digital now has a default Brand Board with the generated site palette, verified through detailed Brand Board readback.
- Probed GHL Website Home publication for Liverpool Digital; generated HTML matches the pasted panel code, but current API tokens expose only page listing and no page-content write, and no authenticated Chrome/CDP session is available.

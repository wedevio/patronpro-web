# Changelog

## 2026-06-12

- Session close: created `ppweb-e7p` as the parent track for mobile LCP sub-second optimization, with children `ppweb-0o5`, `ppweb-jeg`, `ppweb-dtn`, and `ppweb-w1f`. Current source of remaining mobile image payload is `logo_square.png` at 670.1 KiB; the optimized mobile hero AVIF is only 29.9 KiB, so tomorrow's work should focus on logo/media handling, smaller breakpoints, Supabase-vs-GHL media strategy, and raw Lighthouse evidence retention.
- Rescheduled PatronPro main-account onboarding appointment `Cxa6iMN4am9r1XUdJWWS` from the mistaken Saturday slot to Friday, 2026-06-12 11:00-12:00 CDMX, assigned to Oscar Betancourt with `toNotify=true`. Evidence: `dev/agents/artifacts/doc/test/liverpool-digital/main-onboarding-appointment-reschedule-2026-06-12-1100-cdmx.json`.
- Updated the PatronPro automation checkpoint PDF cover attribution to `Prepared by Óscar Betancourt` and regenerated the PDF.
- Added the Picturelle-branded PatronPro automation session checkpoint report covering Liverpool Digital onboarding automation, Slack recorder/bot status, Brigitte fit guidance, website SEO/GEO/image optimization proposal, and the API/browser/manual split. Final report: `doc/reports/2026/06/patronpro-automation-session-checkpoint-2026-06-12.md`; PDF: `doc/reports/2026/06/patronpro-automation-session-checkpoint-2026-06-12.pdf`.
- Completed the post-optimization Lighthouse after-run and updated the checkpoint report/PDF: desktop performance improved 75 -> 94 and desktop LCP 3.9s -> 1.3s; mobile LCP improved 21.3s -> 8.2s; mobile image transfer dropped from 8070.0 KiB to 700.0 KiB.
- Promoted the calendar booking-rule baseline to a PatronPro-wide standard procedure in RLM and the Liverpool automation runbook: `Consulta Gratuita` uses next-day minimum notice, 15-minute buffers, and max 8 bookings/day; `On Site Visit` uses next-day notice, 45-minute buffers, and max 4 bookings/day.
- Corrected the onboarding-session booking flow: deleted the mistakenly created Liverpool subaccount `Consulta Gratuita` test event `Tee3EZ2G4RT7F2Vnjrv5` and created the real PatronPro main-account onboarding appointment `Cxa6iMN4am9r1XUdJWWS` in `Onboarding PatronPro`, assigned to Oscar Betancourt with `toNotify=true`.

## 2026-06-11

- Completed `ppweb-7` calendar booking-rule normalization for Liverpool Digital: `Consulta Gratuita` now has next-day minimum notice, 15-minute pre/post buffers, and max 8 bookings/day; `On Site Visit` keeps next-day notice and 45-minute buffers with max 4 bookings/day. Free-slot QA passed for both calendars.
- Advanced `ppweb-8` Email Services setup through WSL Chrome Profile 9 after public API probes and internal endpoint probes did not provide a supported token path. Created `email.build.picturelle.com` in GHL and stopped at the DNS records screen for Cloudflare verification; default From headers and `Automation Sender Email` remain pending until DNS verifies.
- Completed `ppweb-9` no-mutation appointment-date probe: current HighLevel docs confirm `POST /calendars/events/appointments` can create a custom dated appointment and `PUT /calendars/events/appointments/:eventId` can reschedule one. No test appointment was created.
- Agent manual-QA snapshot completed with Supabase-backed read-only QC: `qc-agent-supabase-ghl-2026-06-11.json` shows Supabase and GHL access passing with 12 pass / 11 fail / 0 blocked; `manual-qa-agent-walkthrough-2026-06-11.md` lists every onboarding manual point with Manual/Agent status. No DB writes were performed.

## 2026-06-10

- Completed `ppweb-5` for Liverpool Digital's GHL Add Contact customization using WSL Chrome Profile 9 on CDP port `9229`.
- Confirmed no supported public GHL API endpoint was found for the Add Contact modal layout; contact/custom-field APIs are not enough for this UI layout setting.
- Updated the live GHL Add Contact form layout: added `Language`, marked `Language` required, and removed `DND Channels`.
- Verified by reopening Contacts → Add Contact: the drawer now shows `Language *` and no DND/DnD fields.
- Stored QA screenshots and JSON readbacks under `dev/agents/artifacts/doc/test/liverpool-digital/`.
- Completed `ppweb-1` calendar availability QA: added read-only `calendar-availability-qa`, verified both active onboarding calendars return free slots, and updated `activate-calendars --apply` to include the same smoke test.
- Recorded that GHL calendar list `openHoursCount: 0` is not authoritative for Liverpool Digital; `GET /calendars/{calendarId}/free-slots` returned bookable slots and is now the automation QA gate.
- Completed `ppweb-2` website publication proof: refreshed public preview QA, confirmed no documented HighLevel page-builder content/publish API is exposed, and normalized the reusable GHL website-builder runbook to current WSL Chrome Profile 9 on CDP port `9229`.
- Preserved the 2026-06-09 browser save proof as the accepted block-level evidence: generated PatronPro HTML is saved in Home custom-code element `#custom-code-MTo38o_zdB`, preview serves the page, `landing_form` remains empty until Twilio approval, and top-level Publish remains manual/operator-approved.
- Blocked `ppweb-3` on missing Supabase API credentials: local env lacks `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and the available 1Password Supabase item only has login-style fields.
- Hardened `export-docs` output handling so `--out-dir` is constrained to this repository; the outside-repo write guard failed as expected for `/tmp/patronpro-should-not-write.json`.
- Captured current PatronPro-generated website HTML drift: the public endpoint now returns SHA-256 `c54297b55c0c911273577190ee1308a45880c94ea4f6c9409e8dc1ae4594a6fd`, which differs from the GHL-saved 2026-06-09 block hash. Regenerating HTML updates the PatronPro endpoint, not the GHL builder page automatically.
- Session close: added `ppweb-elk.10` for the user's Supabase access check and `ppweb-elk.11` for a guided manual QA walkthrough of every onboarding manual section against GHL/panel evidence.

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

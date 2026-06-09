# Liverpool Digital Onboarding Automation Quality Loop Report

Date: 2026-06-09
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Branch: `feature/liverpool-digital-docs-automation`

## Summary

The onboarding manual was converted into a section-by-section automation and QA map. Live safe automations completed: the single Liverpool Digital user was assigned to both onboarding calendars, both calendars were activated through the GHL API, and the Brand Board was created/updated with the generated site colors. The form embed remains intentionally deferred until Twilio/Trust Center approval.

## Live Changes Completed

| Step | Result | QA |
|---|---|---|
| Calendar owner/team member assignment | Pass | `Consulta Gratuita` and `On Site Visit` now each have exactly one team member: the main Liverpool Digital user. |
| Calendar activation | Pass | `Consulta Gratuita` and `On Site Visit` are active. Apply proof is in `calendar-activation-apply-2026-06-09.json`. |
| Website HTML/images | Pass for generated assets | PatronPro public endpoint returns ready HTML, ready image URLs, synced GHL image custom values, and GHL can list the website/Home page inventory. |
| Brand Board colors | Pass | Liverpool Digital Brand Board exists, is default, and contains Main `#471F23`, Accent `#F69309`, Complementary `#2F1417`. |
| Website publication into GHL editor | Blocked by API/auth boundary | HTML was confirmed against the PatronPro public endpoint, but GHL page-content write routes are not available through the current tokens. Browser fallback is tracked in `ppweb-elk.7` and needs an authenticated Chrome/CDP session or GHL login path. |
| Landing form | Deferred | `landing_form` remains empty because Twilio is not approved. This is the correct state. |

## Key Current State

- Website HTML exists and is ready through the PatronPro public website endpoint: 33,116 bytes.
- Website HTML SHA-256: `94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd`.
- Website images are ready and synced to GHL image custom values.
- GHL website inventory is readable: `Construction Company` (`YJXYasKPALXkQkvezVyw`) with Home page `JgrAMMXugg5Yi8QAnbDz`.
- HTML exposes brand colors including `#471f23`, `#f69309`, and `#2f1417`.
- Brand Boards write works. Gotcha: the list endpoint may omit `colors`; detailed board readback is required for QA.
- Domain custom value exists as `build.picturelle.com`, but GHL custom domain/location website evidence is empty.
- Phone/Twilio, email sender domain, Stripe, final landing publication, and account activation are not complete.
- Supabase/panel access is still missing, so panel submissions/checklist/approval state cannot be updated from this shell.

## Artifacts

- Working quality-loop plan: `dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md`
- Calendar apply proof: `dev/agents/artifacts/doc/test/liverpool-digital/calendar-owner-apply-2026-06-09.json`
- Calendar activation proof: `dev/agents/artifacts/doc/test/liverpool-digital/calendar-activation-apply-2026-06-09.json`
- Website asset proof: `dev/agents/artifacts/doc/test/liverpool-digital/website-assets-2026-06-09.json`
- Brand Board proof: `dev/agents/artifacts/doc/test/liverpool-digital/brand-board-default-apply-2026-06-09.json`
- Website publication API/browser attempt: `dev/agents/artifacts/doc/test/liverpool-digital/website-publication-attempt-2026-06-09.md`
- Final QC proof: `dev/agents/artifacts/doc/test/liverpool-digital/qc-live-final-2026-06-09.json`
- Reviewer findings: `dev/agents/artifacts/doc/sages/liverpool-digital-onboarding-quality-loop-20260609/`
- Updated harness: `dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs`

## Next Manual/Automation Queue

1. Provide Supabase/panel access for submissions, checklist, approval state, and live docs export.
2. Confirm calendar availability/free-slot behavior. Calendars are active, but both API payloads report `openHoursCount: 0`, so availability still needs manual/client QA.
3. Publish generated HTML into the correct GHL Website Home block after providing an authenticated Chrome/CDP browser session or GHL login path.
4. Connect domain/DNS and email sending domain; then set `automation_sender_email`.
5. Complete Twilio approval and phone assignment; then set `company_phone`.
6. After Twilio approval, set `landing_form` with the calendar embed.
7. Complete Stripe with the client and record connection proof.
8. Manually verify Contact Creation Form customization: Language required and DND Channels removed.
9. Run browser automation fallback bead `ppweb-elk.7` for GHL UI-only steps after API attempts are exhausted.
10. Keep account activation blocked until all critical gates pass.

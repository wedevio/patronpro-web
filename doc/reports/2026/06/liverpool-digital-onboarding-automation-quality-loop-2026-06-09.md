# Liverpool Digital Onboarding Automation Quality Loop Report

Date: 2026-06-09
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Branch: `feature/liverpool-digital-docs-automation`

## Summary

The onboarding manual was converted into a section-by-section automation and QA map. One live safe automation was completed: the single Liverpool Digital user was assigned to both onboarding calendars. The form embed remains intentionally deferred until Twilio/Trust Center approval.

## Live Changes Completed

| Step | Result | QA |
|---|---|---|
| Calendar owner/team member assignment | Pass | `Consulta Gratuita` and `On Site Visit` now each have exactly one team member: the main Liverpool Digital user. |
| Calendar activation | Not applied | Both calendars remain inactive. Activation is separate and should wait for availability/booking-rule QA. |
| Landing form | Deferred | `landing_form` remains empty because Twilio is not approved. This is the correct state. |

## Key Current State

- Website HTML exists and is ready through the PatronPro public website endpoint.
- Website images are ready and synced to GHL image custom values.
- HTML exposes colors: `#471f23`, `#f69309`, `#FFFFFF`.
- Brand Boards read endpoint works, but this location currently has zero Brand Boards.
- Domain custom value exists as `build.picturelle.com`, but GHL custom domain/location website evidence is empty.
- Phone/Twilio, email sender domain, Stripe, final landing publication, and account activation are not complete.
- Supabase/panel access is still missing, so panel submissions/checklist/approval state cannot be updated from this shell.

## Artifacts

- Working quality-loop plan: `dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md`
- Calendar apply proof: `dev/agents/artifacts/doc/test/liverpool-digital/calendar-owner-apply-2026-06-09.json`
- Final QC proof: `dev/agents/artifacts/doc/test/liverpool-digital/qc-live-final-2026-06-09.json`
- Reviewer findings: `dev/agents/artifacts/doc/sages/liverpool-digital-onboarding-quality-loop-20260609/`
- Updated harness: `dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs`

## Next Manual/Automation Queue

1. Provide Supabase/panel access for submissions, checklist, approval state, and live docs export.
2. Confirm calendar availability/booking rules, then activate calendars in a separate gated step.
3. Decide whether to create a default Brand Board from the detected colors.
4. Publish generated HTML into the correct GHL Website Home block and record proof.
5. Connect domain/DNS and email sending domain; then set `automation_sender_email`.
6. Complete Twilio approval and phone assignment; then set `company_phone`.
7. After Twilio approval, set `landing_form` with the calendar embed.
8. Complete Stripe with the client and record connection proof.
9. Manually verify Contact Creation Form customization: Language required and DND Channels removed.
10. Keep account activation blocked until all critical gates pass.

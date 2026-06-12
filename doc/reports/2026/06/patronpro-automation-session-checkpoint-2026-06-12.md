# PatronPro Automation Session Checkpoint

Date: 2026-06-12
Worktree: `/home/oz/projects/2026/patronpro-web-docs-automation`
Branch: `feature/liverpool-digital-docs-automation`
Epic bead: `ppweb-07o`
Primary test account: test onboarding account 01 (Liverpool Digital), GHL location `4cPIvLND9hFAIzWQ1ZbL`
Related RLM source: `/mnt/rlm/knowledge/projects/patron-pro/reports/2026/06/patronpro-session-checkpoint-brigitte-ou-wilio-2026-06-11.md`

## Slack-ready executive summary

PatronPro checkpoint:

1. Onboarding automation is now proven on test onboarding account 01 (Liverpool Digital). API-proven: calendar owner assignment, calendar activation/rules, Brand Board colors, GHL/Supabase read QC, and the main-account onboarding appointment for Friday, June 12 at 11:00 AM CDMX with Oscar as the onboarding owner. Browser-proven through WSL Profile 9: GHL website HTML save, Add Contact `Language` required + DND removed, and Email Services domain setup to the DNS-record stage. Manual/client gates remain: Twilio/A2P, Stripe, Cloudflare/DNS verification, final publish/activation, and client sign-off.

2. Website optimization was implemented on the test account preview without regenerating AI images. Existing images were reused, responsive AVIF -> WebP -> JPEG variants were generated, WhatsApp/Open Graph preview was added, JSON-LD SEO/GEO was added, and the optimized HTML was saved into GHL. Fresh Lighthouse: desktop performance 75 -> 94 and LCP 3.9s -> 1.3s; mobile LCP 21.3s -> 8.2s. Image transfer dropped by about 7.37 MiB on mobile.

3. Brigitte needs separate fit handling. What happened: she compared PatronPro to pdfFiller, mentioned paying about $100/year, and also referenced another Facebook tool, so her main objection is price/value mismatch. Recommended position: validate pdfFiller if she only needs PDFs/signatures, then explain that PatronPro is a broader client-flow system: landing page, form/calendar, calls, SMS/email, pipeline, estimates, invoices/payments, reminders, and follow-up. If she only wants document filling/signatures, she may not be the right PatronPro client right now. Do not promise social media management, AI agents, or advanced automations unless Carlos/Duncan approve that wording.

Full PDF: doc/reports/2026/06/patronpro-automation-session-checkpoint-2026-06-12.pdf

## Executive summary

This checkpoint consolidates the current PatronPro onboarding automation work across four lanes: test onboarding account 01 (Liverpool Digital) onboarding execution, website generation/optimization, Slack recorder/bot enablement, and Brigitte lead-fit handling. The strongest automation proof is in GHL API operations for calendars, Brand Boards, appointment creation, and read-only QC, plus browser automation for GHL UI surfaces that do not expose supported public API endpoints.

The main constraint remains operational gating: Twilio A2P/Trust Center, Stripe, Cloudflare DNS verification, final website publish, and account activation still require the client/operator at the correct moment. We should keep those gates manual or explicitly approved until a safe app workflow exists.

The website optimization work is now proven on the test account preview and remains a productization proposal for Carlos' app. The direction is to avoid spending more AI image credits when the client likes the generated images: reuse existing images, generate optimized AVIF/WebP/JPEG variants, refresh HTML, and run Lighthouse automatically with QA evidence.

## What is proven now

| Lane | Status | Evidence |
|---|---:|---|
| test onboarding account 01 GHL API access | Done | GHL location, calendars, Brand Board, custom values, and appointment APIs were readable/writable with secret-safe handling. |
| Supabase access | Done, read/storage | Agent QC/export could read onboarding state/docs. Optimized website derivatives were uploaded to Supabase Storage under a timestamped account asset path; application database tables were not changed in this pass. |
| Calendar owner/activation/rules | Done | `Consulta Gratuita` and `On Site Visit` assigned to the single test-account user, active, free-slot QA passed, and standard booking rules were applied. |
| Brand Board | Done | Test-account Brand Board colors set/read back: Main `#471F23`, Accent `#F69309`, Complementary `#2F1417`. |
| Website HTML in GHL | Browser-proven | Optimized HTML was saved into the GHL website builder custom-code block through WSL Profile 9. Top-level publish remains operator-approved/gated. |
| Website optimization | Done | Existing images reused; AVIF/WebP/JPEG derivatives and social preview generated; preview now contains `<picture>`, Open Graph/Twitter, and JSON-LD. |
| Add Contact customization | Browser-proven | `Language` required field was added and DND/DnD channels were removed using WSL Chrome Profile 9. |
| Email Services setup | Browser-proven to DNS step | `email.build.picturelle.com` was created in GHL and DNS records were captured for Cloudflare completion. |
| Main-account onboarding appointment | Done | Created in PatronPro MAIN, not the test-account subaccount: appointment `Cxa6iMN4am9r1XUdJWWS`, rescheduled to Friday 2026-06-12 11:00-12:00 CDMX, assigned to Oscar. |
| Brigitte lead tracking | Done | MAIN GHL custom fields created for quality/status/objection and Brigitte marked warm/engaged/too expensive. |
| Slack recorder architecture | Guarded MVP | Command lifecycle and recorder worker pattern documented/deployed with dry-run guard. Live command/recording validation remains controlled. |

## API, browser, and manual split

### API-proven operations

These are the best candidates for direct implementation in Carlos' PatronPro app or a sidecar automation, with dry-run, readback, and audit logs:

- GHL calendar owner assignment for a new subaccount's main user.
- GHL calendar activation.
- Standard calendar booking rules:
  - `Consulta Gratuita`: next-day minimum notice, 15-minute pre/post buffers, max 8 bookings per day.
  - `On Site Visit`: next-day minimum notice, 45-minute pre/post buffers, max 4 bookings per day.
- Brand Board creation/update/readback.
- Read-only onboarding QC using GHL plus Supabase panel state.
- PatronPro MAIN appointment creation for onboarding sessions.
- MAIN contact custom fields for lead status/quality/objection tracking.
- Generated website asset discovery from the public PatronPro website endpoint.

### Browser-proven operations

These worked through WSL Chrome Profile 9 and should be scripted only when no supported API exists. They need selector maps, screenshots, and post-action readback:

- GHL website builder custom-code paste/save for the Home page.
- GHL Contacts -> Add Contact -> Customize Form: add `Language`, mark required, remove DND channels.
- GHL Email Services domain creation to the DNS-record screen.

### Manual or client-gated operations

These should stay gated until there is a stronger legal, security, or platform-approved path:

- Twilio Trust Center/A2P identity verification, campaign registration, phone purchase, Shaken/Stir, CNAM, Voice Integrity.
- Stripe account creation/bank connection/payout configuration.
- Cloudflare or registrar DNS record creation and verification.
- Inserting the website landing form only after Twilio approval.
- Final website top-level publish when operator approval is required.
- SA Configurator account approval/client access handoff.
- Final client sign-off and mobile app access confirmation.

## Test onboarding account 01 status

Agent QC on 2026-06-11 reported `12 pass / 11 fail` for test onboarding account 01 (Liverpool Digital). Passing items include Supabase access, GHL access, location exists, onboarding form received, panel contact IDs known, generated website assets, Brand Board, calendar owner assignment, calendar activation, calendar configured, staff permissions, and landing-form Twilio gate.

Failing or pending items are expected at this stage: domain/customDomain, phone/Twilio, email sender, landing publication evidence/current GHL HTML, Stripe, client OK, account approval, missing `domain_purchase_authorized`, missing final landing custom values, onboarding workflow proof, and final activation gate.

The current rehearsal appointment is in the PatronPro MAIN account, not the client subaccount:

- Appointment: `Cxa6iMN4am9r1XUdJWWS`.
- Calendar: `Onboarding PatronPro` / `D7x8ts5xcdNOWnd6Pjlq`.
- Main location: `hHLZC7FaTtUINPf3cbHd`.
- Contact: `rSBhh1nzHdjaRXOF3F0A`.
- Assigned user: Oscar Betancourt / `r2NA4HiIxWRvKwzuYpzv`.
- Scheduled slot: Friday, 2026-06-12, 11:00-12:00 CDMX.
- GHL readback uses `2026-06-12T10:00:00-07:00` to `2026-06-12T11:00:00-07:00`, which is the same instant as `2026-06-12T11:00:00-06:00` to `2026-06-12T12:00:00-06:00`.
- Notifications: `toNotify=true`.
- Reschedule proof: `dev/agents/artifacts/doc/test/liverpool-digital/main-onboarding-appointment-reschedule-2026-06-12-1100-cdmx.json`.

## Website optimization and productization evidence

The current implementation makes optimization repeatable and low-cost:

1. If AI images already exist and the client likes them, do not regenerate images by default.
2. Generate responsive derivatives from the existing images:
   - widths: 640w, 960w, 1440w;
   - codecs: AVIF first, WebP second, compressed JPEG fallback last;
   - legacy fallback custom value: 960w JPEG so old HTML does not break.
3. Use `<picture>` markup with AVIF -> WebP -> JPEG source order.
4. Use `loading="eager" fetchpriority="high" decoding="async"` only for the hero/LCP image.
5. Keep below-fold images lazy and async.
6. Generate a 1200x630 social preview image for WhatsApp, Messenger, Open Graph, and Twitter/X cards.
7. Add SEO/GEO structure: canonical, meta description, robots, Open Graph/Twitter tags, LocalBusiness/ProfessionalService JSON-LD, service ItemList/makesOffer, SiteNavigationElement, stable service anchors, and no invented ratings/prices/licenses/review schema.
8. Run automated Lighthouse mobile and desktop analysis before and after the GHL save.

### Implementation proof

- Optimized HTML artifact: `dev/agents/artifacts/doc/test/liverpool-digital/optimized-website-2026-06-12/test-onboarding-account-01-optimized-2026-06-12.html`.
- Optimized manifest: `dev/agents/artifacts/doc/test/liverpool-digital/optimized-website-2026-06-12/test-onboarding-account-01-optimized-2026-06-12.manifest.json`.
- Final optimized HTML SHA-256: `2cbac2eeca6dd6158bff43deecf8ea836bf6c76007b66395d88d343ed4e78370`.
- GHL save proof: `dev/agents/artifacts/doc/test/liverpool-digital/ghl-profile9-optimized-html-save-fixed-2026-06-12.json`.
- Preview QA: `dev/agents/artifacts/doc/test/liverpool-digital/ghl-preview-optimized-fixed-2026-06-12.html`.
- Visual QA screenshots: `preview-optimized-fixed-mobile-2026-06-12.png` and `preview-optimized-fixed-desktop-2026-06-12.png`.
- Top-level GHL Publish was not clicked.

Important gotcha: GHL Media rejected `image/avif` with `INVALID_FILE_TYPE`. The working pattern is to host optimized website derivatives in the existing public Supabase Storage `website-assets` bucket, under a timestamped account path, while keeping application database tables unchanged.

### Lighthouse evidence

Fresh before/after Lighthouse was run on 2026-06-12 against the same GHL preview URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz?notrack=true`.

| Run | Before | After | Change |
|---|---:|---:|---:|
| Desktop performance | `75` | `94` | `+19` |
| Desktop LCP | `3.9s` | `1.3s` | `-2.7s` |
| Desktop total transfer | `8465.1 KiB` | `1173.0 KiB` | `-7292.1 KiB` |
| Desktop image transfer | `8070.3 KiB` | `776.2 KiB` | `-7294.0 KiB` |
| Mobile performance | `65` | `66` | `+1` |
| Mobile LCP | `21.3s` | `8.2s` | `-13.1s` |
| Mobile total transfer | `8464.9 KiB` | `1096.2 KiB` | `-7368.8 KiB` |
| Mobile image transfer | `8070.0 KiB` | `700.0 KiB` | `-7370.0 KiB` |

Artifacts:

- Before summary: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-before-optimized-2026-06-12.md`.
- After summary: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-after-optimized-fixed-2026-06-12.md`.
- Comparison JSON: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-before-after-comparison-2026-06-12.json`.

Conclusion: the payload bottleneck was fixed materially. The next performance target is the 670 KiB logo PNG, which is now the largest image request in both desktop and mobile after-runs.

## Slack recorder and bot checkpoint

Current architecture:

- Use a dedicated Slack user named `PatronPro Recorder` / `patronpro_recorder` for repeat tests and production-like recording, not Oscar's personal Slack user.
- Slack slash commands are the control plane only. `/record`, `/record-hq`, `/pp-record`, and `/pp-record-hq` should acknowledge immediately and enqueue a local recording job.
- The recorder worker owns browser/CDP control, view preparation, FFmpeg lifecycle, Huddle state monitoring, stop/leave behavior, metadata finalization, and status reporting.
- Recorder lifecycle states should stay explicit: queued, starting, waiting_for_host_or_permission, recording, stopping, uploading, completed, failed, cancelled, timed_out.
- Recorder-alone gotcha: if the recorder becomes the last participant, stop FFmpeg, click Leave Huddle through CDP, verify controls disappear, and store `huddle_leave_status`.
- Current provider fallback for transcription is Groq -> Deepgram -> OpenAI -> local. Local Whisper is not configured.
- Slack MCP and the PatronPro Bolt app are separate layers. MCP is for AI access to Slack text context; the Bolt app is for commands, notices, reports, and job orchestration.

Guarded status:

- The command-controlled recorder lifecycle exists as a guarded MVP with dry-run controls.
- FSN1 rollout guards included channel allowlist and `PATRONPRO_SLACKBOT_RECORDING_DRY_RUN_ONLY=true`.
- Remaining controlled work: install/update Slack manifest for slash commands, verify dry-run command status in the approved test channel, then run live start/stop/recorder-alone tests only after explicit approval.

## Brigitte fit and outreach checkpoint

Brigitte's objection: she currently uses pdfFiller, pays around $100/year, and feels PatronPro is expensive. She also mentioned another Facebook tool.

Recommended positioning:

- Acknowledge that pdfFiller is a good tool if the need is PDF filling, signatures, forms, and document workflows.
- Reframe PatronPro as the broader client-flow system: landing page/website, lead form, calendar, calls, SMS, email, appointments, pipeline, estimates, invoices/payments, reminders, and follow-up in one place.
- Ask what she uses most in pdfFiller and what she saw on Facebook before judging fit.
- Be honest: if her only need is document filling/signatures, she may not be the right client for PatronPro right now.
- Do not promise social media post creation, social media account management, AI agents, or advanced automations as a standard feature unless Carlos/Duncan approve the exact wording.

MAIN GHL tracking completed:

- Created lead quality, lead status, lead objection reason, and lead objection notes fields.
- Updated Brigitte as warm, engaged, objection reason too expensive.
- Gotcha stored: GHL contact update rejects `locationId` in the body; custom field readback returns values under `value`, not `field_value`.

## Reusable gotchas

- WSL Profile 9 only for PatronPro/GHL browser automation. Do not silently use Windows Chrome or Oscar's personal WSL Profile 6.
- GHL website code deployment does not update an existing GHL builder page. The HTML must be saved/published into the builder after generation.
- Calendar list `openHoursCount: 0` is not authoritative for test onboarding account 01 (Liverpool Digital); free-slots endpoint is the QA gate.
- GHL appointment timezone readback can return a different offset for the same instant. Compare instants, not raw local strings.
- GHL appointment DELETE can return success while GET still returns a deleted appointment object; check `deleted: true`.
- Email Services has no currently proven public API path for the domain setup screen; browser automation is the fallback.
- GHL Media rejected `image/avif` uploads with `INVALID_FILE_TYPE`; use Supabase Storage public assets for optimized AVIF/WebP/JPEG website derivatives.
- Brand Board list endpoints may omit colors; hydrate detail/readback before deciding whether an update is needed.
- 1Password entries can have misleading blank fields. Never print secrets; use field labels carefully and confirm via API health/readback.
- Do not insert `landing_form` before Twilio approval. The absence of `landing_form` is a pass while Twilio is inactive.

## Recommended next steps

1. Run the test onboarding account 01 (Liverpool Digital) self-onboarding rehearsal on Friday, 2026-06-12 at 11:00 AM CDMX.
2. Complete Cloudflare DNS for `build.picturelle.com` and `email.build.picturelle.com`, then verify GHL domain/email status and From headers.
3. Complete Twilio/A2P and phone setup during/after the onboarding flow; keep landing form deferred until approval.
4. Complete Stripe with the client/operator present.
5. Run manual QA against the onboarding checklist and the GHL preview evidence before any final publish/activation.
6. Optimize the remaining large logo PNG; it is now the main Lighthouse image payload after the AI photos were reduced.
7. Productize the website optimizer as a safe PatronPro app feature: separate `Optimize Existing Images` / `Refresh Website HTML` from costly `Regenerate Images`, with dry-run and readback evidence.
8. Present the report to Carlos/Duncan as a proposal, not as an immediate live deployment request.

# PatronPro Automation Session Checkpoint

Date: 2026-06-12
Worktree: `/home/oz/projects/2026/patronpro-web-docs-automation`
Branch: `feature/liverpool-digital-docs-automation`
Epic bead: `ppweb-elk`
Primary client/account: Liverpool Digital, GHL location `4cPIvLND9hFAIzWQ1ZbL`
Related RLM source: `/mnt/rlm/knowledge/projects/patron-pro/reports/2026/06/patronpro-session-checkpoint-brigitte-ou-wilio-2026-06-11.md`

## Slack-ready executive summary

PatronPro checkpoint: we documented what is now proven for onboarding automation and what remains manual/client-gated. API-proven: Liverpool Digital calendar owner/activation/rules, Brand Board, GHL/Supabase read QC, Brigitte lead-objection tracking in PatronPro MAIN, and the main-account onboarding appointment for Liverpool Digital on Sat Jun 13 at 11:00 AM CDMX. Browser-proven: GHL website HTML save, Add Contact Language required + DND removed, and Email Services domain setup to the DNS-record stage. Manual gates remain: Twilio/A2P, Stripe, Cloudflare/DNS verification, final publish/activation, and client sign-off. Website proposal covers AVIF -> WebP -> JPEG responsive images, OG/WhatsApp preview, JSON-LD SEO/GEO, and automated Lighthouse analysis for possible PatronPro app adoption. The report also documents the Slack recorder/bot architecture and Brigitte fit guidance. Full PDF: doc/reports/2026/06/patronpro-automation-session-checkpoint-2026-06-12.pdf

## Executive summary

This checkpoint consolidates the current PatronPro onboarding automation work across four lanes: Liverpool Digital onboarding execution, website generation/optimization, Slack recorder/bot enablement, and Brigitte lead-fit handling. The strongest automation proof is in GHL API operations for calendars, Brand Boards, appointment creation, and read-only QC, plus browser automation for GHL UI surfaces that do not expose supported public API endpoints.

The main constraint remains operational gating: Twilio A2P/Trust Center, Stripe, Cloudflare DNS verification, final website publish, and account activation still require the client/operator at the correct moment. We should keep those gates manual or explicitly approved until a safe app workflow exists.

The website optimization work is ready as a productization proposal, not as an unreviewed live change to Carlos' app. The direction is to avoid spending more AI image credits when the client likes the generated images: reuse existing images, generate optimized AVIF/WebP/JPEG variants, update image custom values, and regenerate or refresh HTML only when needed.

## What is proven now

| Lane | Status | Evidence |
|---|---:|---|
| Liverpool Digital GHL API access | Done | GHL location, calendars, Brand Board, custom values, and appointment APIs were readable/writable with secret-safe handling. |
| Supabase access | Done, read-only | Agent QC/export could read onboarding state and docs. No Supabase writes were performed. |
| Calendar owner/activation/rules | Done | `Consulta Gratuita` and `On Site Visit` assigned to the single Liverpool user, active, free-slot QA passed, and standard booking rules were applied. |
| Brand Board | Done | Liverpool Digital Brand Board colors set/read back: Main `#471F23`, Accent `#F69309`, Complementary `#2F1417`. |
| Website HTML in GHL | Browser-proven | Generated HTML was saved into the GHL website builder custom-code block. Top-level publish remains operator-approved/gated. |
| Add Contact customization | Browser-proven | `Language` required field was added and DND/DnD channels were removed using WSL Chrome Profile 9. |
| Email Services setup | Browser-proven to DNS step | `email.build.picturelle.com` was created in GHL and DNS records were captured for Cloudflare completion. |
| Main-account onboarding appointment | Done | Created in PatronPro MAIN, not Liverpool subaccount: appointment `Cxa6iMN4am9r1XUdJWWS`, Sat 2026-06-13 11:00-12:00 CDMX, assigned to Oscar. |
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

## Liverpool Digital status

Agent QC on 2026-06-11 reported `12 pass / 11 fail`. Passing items include Supabase access, GHL access, location exists, onboarding form received, panel contact IDs known, generated website assets, Brand Board, calendar owner assignment, calendar activation, calendar configured, staff permissions, and landing-form Twilio gate.

Failing or pending items are expected at this stage: domain/customDomain, phone/Twilio, email sender, landing publication evidence/current GHL HTML, Stripe, client OK, account approval, missing `domain_purchase_authorized`, missing final landing custom values, onboarding workflow proof, and final activation gate.

The current Liverpool rehearsal appointment is in the PatronPro MAIN account, not the client subaccount:

- Appointment: `Cxa6iMN4am9r1XUdJWWS`.
- Calendar: `Onboarding PatronPro` / `D7x8ts5xcdNOWnd6Pjlq`.
- Main location: `hHLZC7FaTtUINPf3cbHd`.
- Contact: `rSBhh1nzHdjaRXOF3F0A`.
- Assigned user: Oscar Betancourt / `r2NA4HiIxWRvKwzuYpzv`.
- Scheduled slot: Saturday, 2026-06-13, 11:00-12:00 CDMX.
- GHL readback uses `10:00-11:00 -07:00`, which is the same instant as `11:00-12:00 -06:00`.
- Notifications: `toNotify=true`.

## Website optimization and productization proposal

The current proposal is to make optimization repeatable and low-cost:

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
8. Run automated Lighthouse mobile and desktop analysis after regeneration/publish.

### Lighthouse evidence

We have a concrete baseline for Liverpool Digital, but no verified post-optimization Lighthouse after-run yet. The report should not claim a quantified live improvement until that run exists.

Baseline artifacts from 2026-06-09:

- Mobile: performance `65`, accessibility `94`, best practices `77`, SEO `58`.
- Mobile LCP: `31.2s`; FCP `4.2s`; CLS `0.001`.
- Mobile transfer: `8455.6 KiB`, with images `8062.2 KiB` or `95.3%` of total.
- Constrained desktop-profile artifact: performance `74`, LCP `4.4s`, transfer `8459.7 KiB`, images `8065.5 KiB` or `95.3%`.
- Gotcha: the desktop JSON still reported mobile screen emulation, so it should not be treated as a true wide-desktop score.
- Lighthouse did not expose the LCP element in the JSON, likely because the page uses CSS background images and/or GHL preview wrappers.

Conclusion: the payload bottleneck is proven. The optimization pipeline is implemented/proposed, but the after-run still needs to be executed after optimized HTML and image values are regenerated and published.

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
- Calendar list `openHoursCount: 0` is not authoritative for Liverpool Digital; free-slots endpoint is the QA gate.
- GHL appointment timezone readback can return a different offset for the same instant. Compare instants, not raw local strings.
- GHL appointment DELETE can return success while GET still returns a deleted appointment object; check `deleted: true`.
- Email Services has no currently proven public API path for the domain setup screen; browser automation is the fallback.
- Brand Board list endpoints may omit colors; hydrate detail/readback before deciding whether an update is needed.
- 1Password entries can have misleading blank fields. Never print secrets; use field labels carefully and confirm via API health/readback.
- Do not insert `landing_form` before Twilio approval. The absence of `landing_form` is a pass while Twilio is inactive.

## Recommended next steps

1. Run the Liverpool Digital self-onboarding rehearsal on Saturday, 2026-06-13 at 11:00 AM CDMX.
2. Complete Cloudflare DNS for `build.picturelle.com` and `email.build.picturelle.com`, then verify GHL domain/email status and From headers.
3. Complete Twilio/A2P and phone setup during/after the onboarding flow; keep landing form deferred until approval.
4. Complete Stripe with the client/operator present.
5. Run manual QA against `ppweb-elk.11` using the walkthrough artifact.
6. After optimized website generation and GHL publish, run Lighthouse mobile and desktop again and compare against the 2026-06-09 baseline.
7. Productize the website optimizer as a safe PatronPro app feature: separate `Optimize Existing Images` / `Refresh Website HTML` from costly `Regenerate Images`, with dry-run and readback evidence.
8. Present the report to Carlos/Duncan as a proposal, not as a live deployment request.

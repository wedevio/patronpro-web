# Liverpool Digital Onboarding Automation Quality Loop

Date: 2026-06-09
Repo: `wedevio/patronpro-web`
Branch: `feature/liverpool-digital-docs-automation`
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Client/account: Liverpool Digital / Picturelle
Artifact role: automation PRD + QA checklist
Artifact status: current checkpoint after live calendar owner assignment, activation, and Brand Board apply

## Goal

Automate as many PatronPro onboarding steps as possible while attaching a quality assurance proof to every step. The future app should execute deterministic setup actions, record evidence, and leave manual/client-only tasks clearly queued for an agent or human.

## Guardrails

- Do not set `landing_form` until Twilio/Trust Center is approved. This is intentionally deferred and may take about two weeks.
- Do not invent phone, email sender, domain, Stripe, or Twilio values.
- Do not mark PatronPro panel checklist rows complete without evidence.
- Keep calendar owner assignment separate from calendar activation.
- Keep account activation separate from setup; activation only after final QA.
- Never print, store, or commit API tokens.

## Source Inputs

- RLM onboarding manual: `/mnt/rlm/knowledge/projects/patron-pro/docs/patronpro-web/patronpro-panel-onboarding-manual-2026-06-09.md`
- RLM automation map: `/mnt/rlm/knowledge/projects/patron-pro/patterns/patronpro-onboarding-automation-map-2026-06-09.md`
- Current harness: `dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs`
- HighLevel official API docs repo snapshot checked locally at `/tmp/highlevel-api-docs`
- Live GHL reads using the Liverpool Digital PIT from 1Password
- Public website read endpoint: `https://www.getpatronpro.com/api/website/4cPIvLND9hFAIzWQ1ZbL`

## Successful Automation So Far

| Step | Status | Action | QA proof |
|---|---|---|---|
| Logo custom value | Pass | Set empty `logo` custom value from existing `logo_cuadrado` URL. | GHL custom values read confirms both are populated. Prior RLM checkpoint: `PatronPro Liverpool Digital Onboarding Checklist Apply 2026-06-09`. |
| Calendar owner/team member | Pass | Assigned the single main user to both onboarding calendars through `PUT /calendars/{calendarId}` with `teamMembers: [{ userId }]`. | `dev/agents/artifacts/doc/test/liverpool-digital/calendar-owner-apply-2026-06-09.json` shows both updates returned 200 and verification read shows exactly one matching team member per calendar. |
| Calendar activation | Pass | Activated both onboarding calendars through `PUT /calendars/{calendarId}` with `{ "isActive": true }`. | `dev/agents/artifacts/doc/test/liverpool-digital/calendar-activation-apply-2026-06-09.json` shows both updates returned 200 and verification read shows both active with team members unchanged. |
| Website generated assets | Pass | Read generated website HTML/images from the PatronPro public website endpoint and GHL image custom values. | `dev/agents/artifacts/doc/test/liverpool-digital/website-assets-2026-06-09.json` shows ready HTML, ready image URLs, synced image custom values, and detected colors. |
| Brand Board colors | Pass | Created/updated the Liverpool Digital Brand Board through `POST /brand-boards/` and `PATCH /brand-boards/{locationId}/{brandBoardId}`. | `dev/agents/artifacts/doc/test/liverpool-digital/brand-board-default-apply-2026-06-09.json` shows `default: true` and colors `#471F23`, `#F69309`, `#2F1417` after detailed readback. |

## Current Live QA Snapshot

After calendar owner assignment, activation, website asset read, and Brand Board apply:

- GHL access: pass.
- Location exists: pass.
- Staff permissions disabled check: pass.
- Calendar owner/team member assigned: pass.
- Calendar activation: pass.
- Full calendar configured: pass at the API active/owner level.
- Calendar availability/free-slot behavior: still needs QA because both calendar payloads report `openHoursCount: 0`.
- Website generated assets: pass.
- GHL website/page inventory: read-only pass for website `Construction Company` and Home page ID `JgrAMMXugg5Yi8QAnbDz`.
- Brand Board colors: pass; board `6a28836266e5a89332434e0d` is default and contains Main `#471F23`, Accent `#F69309`, Complementary `#2F1417`.
- Supabase/panel account state: blocked, no Supabase env or authenticated panel session in this shell.
- Domain: fail, `dominio_web` exists but GHL `customDomain`/location website evidence is empty.
- Phone/Twilio: fail, no phone number detected.
- Email: fail, `automation_sender_email` is empty.
- Stripe: fail, no transaction/payment connection signal detected.
- Landing form: deferred until Twilio approval.

## Phase 1: Alta, Pago, Cita Y Formulario

| Manual section | Automation status | Proposed app action | QA proof |
|---|---|---|---|
| 5.1 Pre-registro | Needs definition | Capture lead fields and abandoned signup state once popup fields and GHL mapping are finalized. | GHL contact exists with expected source/tag and required mapped fields. |
| 5.2 Pago/subcuenta/snapshot | Read/QC possible | Read location, plan/payment signal, snapshot-derived assets. | Location exists, payment/subaccount signal present, baseline objects found. |
| 5.3 Agendamiento | API/browser possible | Verify appointment exists and recovery workflows are configured. | Calendar event/appointment or workflow evidence; recovery workflow names/triggers documented. |
| 5.4 Cuenta en pausa | Unknown/API pending | Discover exact SA Configurator/pause mechanism before automation. | Account remains inaccessible to client until activation; panel/SaaS state evidence. |
| 5.5 Formulario onboarding | Supabase/panel blocked | Read latest `account_submissions` and map fields to GHL custom values. | Supabase submission row, custom values, file/logo URLs. |
| 5.6 Email preparación | Needs content | Send only after copy/list are finalized. | Email template ID and delivery/log evidence. |
| 5.7 Portal interno | Supabase/panel blocked | Read/write checklist only with panel auth or Supabase service role. | Checklist rows tied to QC evidence IDs and timestamps. |

## Phase 2: Configuracion Previa

| Manual section | Automation status | Current Liverpool Digital state | QA proof / next action |
|---|---|---|---|
| 6.1 Snapshot | Partial pass | 1 pipeline, 14 workflows, 2 calendars visible. | Add stricter checks for snippets, dashboard, forms, contracts, legal pages when API/UI path is known. |
| 6.2 Contact creation form: language required, remove DND Channels | Manual/browser likely | No API endpoint found for customizing the Add Contact side-panel form. Contact API DND fields are not this UI configuration. | Manual check or future browser automation. QA needs screenshot or UI readback. |
| 6.3 Calendars | API active pass; availability QA pending | `Consulta Gratuita` and `On Site Visit` now each have the main user assigned and `isActive: true`. | Owner and activation QA passed. Next check is availability/free-slot behavior because both payloads show `openHoursCount: 0`. |
| 6.4 Domain/DNS | Manual/API provider-specific | `dominio_web = build.picturelle.com`; GHL `customDomain` empty. | Connect domain in GHL/registrar, then verify custom domain, DNS, SSL, and custom value match. |
| 6.5 Website HTML/images | Generated assets pass, GHL publish blocked by auth/API boundary | Public endpoint returns ready HTML (33,116 bytes, SHA-256 `94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd`), images ready, image custom values populated, and GHL can list website/page inventory. | API probes confirm list-only page access; detail/content routes return 404 or IAM 401. Need authenticated browser/CDP session or a validated page-content write endpoint. Do not add form yet. |
| 6.6 Branding | API write pass | HTML exposes colors `#471f23`, `#f69309`, `#2f1417`. A default Brand Board now exists for Liverpool Digital with those colors. | `brand-board-default-apply-2026-06-09.json` verifies the detailed board readback. Gotcha: the Brand Board list endpoint omits colors, so verification must hydrate each board with a detail read. |
| 6.7 Platform language | Manual/browser likely | Not verified. | Requires Login As / My Profile UI or a confirmed user preference API. |
| 6.8 Invoice/contract/document notifications | Manual/browser likely | Not verified. | Requires UI/API discovery for template selection and duplicate notification disabling. |
| 6.9 Pipelines/workflows | Read partial | Workflows visible, but expected onboarding workflow evidence not found by name. | Need trigger/action inspection in UI or stronger workflow API response. |

## Phase 3: Cita De Onboarding

| Manual section | Automation status | Proposed app action | QA proof |
|---|---|---|---|
| 7.1 Twilio A2P/phone | Human/client required; reads possible | Preflight required docs; after approval, read phone/Twilio status and write `company_phone`. | Phone-system number exists, active status where available, SMS/call test result. |
| 7.1.1 Trust Center options | Browser/manual likely | Queue Shaken/Stir, CNAM, Voice Integrity checks after A2P profile exists. | Trust Center statuses in Review/Approved. |
| 7.1.2 Inbound call routing | API/browser possible after phone exists | Assign inbound calls to team member, web app/mobile app routes, 40s timeout, disable business-phone forwarding. | Phone number config readback or manual screenshot. |
| 7.2 Domains during call | Manual/client required unless registrar API exists | Guide operator/client through provider DNS if not authorized for purchase. | DNS records verified and GHL domain status active. |
| 7.3 Stripe | Human/client required | App can track checklist and read payment signals, not enter SSN/bank details. | Stripe/account/payment connection evidence. |
| 7.4 Staff | API possible | Add/invite staff only when names/emails are provided. | Users exist with intended roles. |
| 7.5 Calendar hours | API possible with caution | Configure availability, booking notice, duration, interval after client confirms hours. | Calendar schedule/readback and free-slot smoke check. |
| 7.6 Mobile app | Manual assist | Send/check invite if endpoint is confirmed. | Client confirms app access. |

## Phase 4: Verificacion Y Acceso

| Manual section | Automation status | Proposed app action | QA proof |
|---|---|---|---|
| 8.0 Wait for Twilio | Deferred | Poll/read phone/Twilio status if exposed; otherwise task reminder. | Twilio/Trust Center approved. |
| 8.1 Add form to website | Deferred until Twilio approval | After approval, copy calendar embed into `landing_form` custom value. | `landing_form` populated and live website displays form. |
| 8.2 Activate account | Manual/API unknown | Only after all critical QA rows pass; approve account and send verification/reset instructions. | `approved_at`/SA Configurator state plus user verification evidence. |

## Immediate To-Do List

1. Provide Supabase service-role env or authenticated panel session so the app can read submissions, checklist, account approval state, and live docs.
2. Confirm calendar availability/free-slot behavior now that calendars are active; both active calendar payloads report `openHoursCount: 0`.
3. Connect/publish the generated HTML inside the correct GHL Website Home block after providing an authenticated Chrome CDP session or GHL login path; current API probes cannot update the Custom HTML block.
4. Complete domain/DNS setup and email sending domain setup; then set `automation_sender_email`.
5. Complete Twilio approval/phone assignment; then set `company_phone`.
6. Only after Twilio approval, add the calendar embed to `landing_form`.
7. Complete Stripe setup with the client.
8. Manually verify Contact Creation Form customization: Language required, DND Channels removed.
9. Define the missing onboarding operational docs from Anexo C: pause mechanism, prep email, portal process, final QA owner, and communications workflow mapping.
10. Run browser automation fallback from bead `ppweb-elk.7` after API attempts are exhausted, starting with GHL Website editor publication and Contact Creation Form customization.

## Status Semantics

- `pass`: authoritative readback proves the step is in the desired state.
- `fail`: required access exists, but the system state is wrong or incomplete.
- `blocked`: prerequisite access or upstream data is missing, so the step cannot be judged safely.
- `deferred`: the process intentionally holds the step until a future gate, such as Twilio approval. In the current harness, deferred steps are represented by explicit pass/fail gate rows such as `landing_form_gate`.

## Current Mutation Contract

Allowed live mutation:

- `assign-calendar-owner --apply`
- `activate-calendars --apply`
- `apply-brand-board --apply`

Calendar preconditions:

- GHL location read succeeds.
- GHL users read succeeds.
- Exactly one location user exists.
- GHL custom values read succeeds.
- Exactly two target calendar IDs are derived from `free_consultation_calendar` and `on_site_visit_calendar`.
- The target calendars exist by exact ID.
- Each target calendar has no existing team members, or is already assigned exactly to the main user.
- The command sends only `teamMembers`, never `isActive`.
- Activation command sends only `isActive: true`, never `teamMembers`.

Brand Board preconditions:

- Generated website read succeeds.
- Brand Boards list read succeeds.
- Brand Board detail read succeeds for any existing candidate board.
- Exactly three valid palette colors are derived from generated HTML/fallback defaults.
- Brand Board command derives colors from generated HTML, writes only `name`, `colors`, and `default`, and verifies through detailed board readback.

QA:

- Fresh calendar read after apply.
- Both target calendars have exactly one `teamMembers[].userId` matching the main user.
- Activation QA requires both exact target calendars to have `isActive: true` and the same single assigned user after a fresh readback.
- Availability/free-slot QA remains pending and should be handled separately from activation.
- Brand Board QA requires detailed `GET /brand-boards/{locationId}/{brandBoardId}` because the list endpoint can omit colors.

Remaining app-level contract gaps:

- Add an immutable mutation audit log with actor, host, git revision, command, before state, after state, and result hash.
- Add rollback support for calendar owner assignment using captured pre-apply team member state.
- Add fixture-based regression tests for pass/fail/blocked/deferred status behavior.
- Add a formal retention/redaction policy for artifacts containing client PII.
- Define exit-code semantics for CI/app orchestration.

## App Automation Candidates

These are safe candidates to productize first:

1. GHL state collector: location, users, calendars, custom values, workflows, pipelines, phone, transactions.
2. Exact custom value updater: avoid loose `includes()` matching because `logo` can accidentally match `logo_cuadrado`.
3. Calendar owner assignment: single-user precondition, no overwrite of different existing members, verification readback.
4. Calendar activation: separate command sending only `isActive: true`, with availability/free-slot QA tracked separately.
5. Website generated asset reader: HTML bytes, image URLs, image custom values, detected colors.
6. Brand Board creator/updater: create or update default Brand Board from generated HTML colors; verify with board-detail hydration, not list-only reads.
7. Checklist evidence mapper: one evidence object per onboarding section, then panel checklist update only after proof exists.
8. Deferred Twilio gate: prevent `landing_form` and account activation until Twilio/phone criteria pass.

## Quality Gate

Minimum approval threshold for a setup step:

- The action is deterministic and idempotent, or the report states why it is not.
- Preconditions are explicit.
- The command defaults to dry-run.
- Apply mode records the exact before/after state.
- QA is a fresh read from the authoritative system.
- Failure produces a gotcha or manual follow-up, not a silent pass.

## Reviewer Merge

Reviewer artifacts:

- `dev/agents/artifacts/doc/sages/liverpool-digital-onboarding-quality-loop-20260609/sage-codex.md`
- `dev/agents/artifacts/doc/sages/liverpool-digital-onboarding-quality-loop-20260609/sage-mini.md`

Merged fixes:

- Calendar owner apply now targets exact calendar IDs from booking custom values instead of broad calendar-name matching.
- Calendar owner apply no longer sends `isActive`; activation remains separate.
- Calendar owner apply now refuses unexpected existing team member shapes instead of silently reducing them.
- `landing_form` is now represented as a Twilio-gated value, not a generic missing custom value.
- Landing publication no longer treats `location.website` alone as proof.
- Domain QA now requires `customDomain` and `dominio_web` to match after normalization, though DNS/SSL/public reachability are still separate.
- Final account activation now has its own critical gate and cannot pass solely because `approved_at` exists.
- Output paths are constrained to the repository.
- CLI flag values now reject missing values and accidental next-flag values.

Remaining reviewer risks:

- Calendar availability still needs booking rule, buffer, duration, notice, and free-slot QA after activation.
- Workflow QA is still inventory/name-level only; trigger/action body verification remains manual/UI or stronger API work.
- Brand Board creation/update was applied on Liverpool Digital; productized verification must hydrate board details because list reads omit colors.
- GHL Website editor publication remains unproven by API.
- Supabase/panel access is still needed for submissions, checklist state, account approval state, and live docs export.

Current score: 94/100 for documented automation safety and live calendar owner/activation/Brand Board automation.

Reasoning: calendar owner, calendar activation, and Brand Board automation now work with exact-target verification, generated website assets are readable, and important reviewer blockers were fixed. Remaining gaps are Supabase/panel access, GHL website publish automation, contact form UI customization, Twilio/Stripe/client-driven steps, calendar availability/free-slot QA, and final account activation path.

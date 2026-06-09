# Liverpool Digital Required Change List

Date: 2026-06-09
Repo: `wedevio/patronpro-web`
Branch: `feature/liverpool-digital-docs-automation`
Epic bead: `ppweb-elk`
Target client: Liverpool Digital
Target location: `4cPIvLND9hFAIzWQ1ZbL`
Artifact role: pre-change checklist
Artifact status: current, source-code-derived

## Safety Gate

No live PatronPro panel, Supabase, or GHL changes should be made until this checklist is reviewed and an explicit run mode is selected. All scripts for this epic must default to dry-run.

The live panel documentation table `doc_pages` has not been exported yet because this shell has no Supabase env or authenticated panel session. The checklist below is derived from committed implementation sources and RLM GHL documentation context.

## Programmatic Access Needed

Required for read-only QC:

- GHL OAuth env: `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_REFRESH_TOKEN`, `GHL_COMPANY_ID`.
- Supabase env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Optional panel cookie/session if using panel HTTP routes instead of direct Supabase.

Required only for generation/write flows:

- `OPENAI_API_KEY` for current website/image generation endpoints.
- `INTERNAL_API_SECRET` if calling internal generation routes without panel session.
- `ONBOARDING_LINK_SECRET` for signed onboarding link creation.
- Explicit write mode, such as `--apply`, after dry-run review.

## Required Changes And Setup Steps

| Step | Required change | Automation lane | AI needed | QC proof |
|---|---|---|---|---|
| 1 | Export live panel documentation from `doc_pages` and store it in RLM. | Supabase read or authenticated panel API. | No. | RLM path plus local JSON/Markdown export with page slugs and updated timestamps. |
| 2 | Verify Liverpool Digital GHL location exists and belongs to PatronPro company. | GHL read: location by ID, company check. | No. | Location ID, name, email, phone, website, custom domain, plan/status. |
| 3 | Confirm or create client contact for onboarding. | GHL contacts read/upsert. | No. | Client contact ID in Liverpool Digital sub-account and PatronPro contact ID if invite is generated. |
| 4 | Generate signed onboarding link if the test user needs to submit or resubmit. | Existing panel route or direct `buildOnboardingLink()` logic. | No. | Link, expiry, client contact ID, PatronPro contact ID. Do not expose signature in public reports. |
| 5 | Capture or seed onboarding submission data for Liverpool Digital. | Supabase direct insert or submit through `/api/onboarding`. | Maybe for copy only; deterministic for data. | `accounts`, latest `account_submissions`, and `account_checklist` rows exist for the location. |
| 6 | Sync current implemented GHL custom values. | GHL custom values API via existing mapper. | No. | `company_name`, `company_address`, `dominio_web`, `logo`, `logo_cuadrado`, `hours_of_operation`, `domain_purchase_authorized`, `on_site_visit_calendar`, `free_consultation_calendar`. |
| 7 | Fill landing-generator prerequisite custom values that are expected but not synced by current mapper. | GHL custom values API. | No. | `company_phone`, `automation_sender_email`, and `landing_form` exist and are non-empty. |
| 8 | Apply default staff permissions. | GHL users API via existing `applyDefaultStaffPermissions()`. | No. | Users in location have Ads Manager, Adwords Reporting, Content AI, Gokollab, WordPress, and Bot Service disabled when applicable. |
| 9 | Configure brand colors in GHL Brand Boards / Global Colors. | Manual/UI for now. Current code notes API path returned 404. | No. | Screenshot or later API proof from GHL if a valid endpoint is found. |
| 10 | Generate landing HTML and save it to `account_websites`. | Existing `/api/website/generate` route or direct Supabase write after generation. | Yes, for landing HTML. | `/api/website/{locationId}` returns `status=ready` and non-empty HTML. |
| 11 | Generate website images and sync image custom values. | Existing `/api/website/generate-images` route. | Yes, for images. | `website_hero_image`, `website_about_image`, `website_contact_image` custom values exist and image URLs resolve. |
| 12 | Publish the generated landing page inside GHL. | Likely manual/UI unless a reliable GHL funnel/page endpoint is confirmed. | No. | Public URL or GHL page/funnel evidence; generated HTML present in the correct Custom HTML block. |
| 13 | Connect domain or DNS. | Manual/UI or registrar/DNS API if credentials exist. | No. | GHL `customDomain`, DNS records, and `dominio_web` custom value match expected domain. |
| 14 | Assign phone number and activate phone system. | Read is API-scriptable; assignment may be UI/API-scope dependent. | No. | Phone-system endpoint shows at least one number and active Twilio/account status. |
| 15 | Connect business email. | Likely manual/UI or provider-specific DNS/API. | No. | Location email plus sender/custom value evidence; DNS/email-domain status if accessible. |
| 16 | Configure calendars needed by custom values. | Calendar read/write may be API-scriptable; visual availability/settings may be UI. | No. | Calendars include on-site/on-site visit and consultation/consulta names, and booking links are synced. |
| 17 | Connect Stripe. | Usually manual OAuth/UI; QC can read transactions signal. | No. | Payment/transaction endpoint or panel signal shows Stripe connected; form flag alone is not proof. |
| 18 | Verify onboarding SMS/email workflow. | GHL workflow edit likely UI-only; read-only workflow inventory may be API-scriptable. | No. | Workflow has tag trigger `ob-meeting-ok` and webhook POST body matching `send-onboarding` route docs. |
| 19 | Approve account in panel if setup is ready. | Panel API or Supabase update. | No. | `accounts.approved_at` is non-null. |
| 20 | Mark panel checklist items only after proof exists. | Panel checklist API or Supabase. | No. | Each item maps to a QC evidence row and timestamp. |
| 21 | Client acceptance / `client_ok`. | Manual human sign-off. | No. | Approval note, ticket, message, or explicit user confirmation. |

## Panel Checklist Mapping

| Panel item | Meaning | Suggested evidence |
|---|---|---|
| `form` | Onboarding submission received. | Latest `account_submissions` row for `4cPIvLND9hFAIzWQ1ZbL`. |
| `domain` | Domain connected / DNS configured. | GHL custom domain or DNS proof plus `dominio_web` custom value. |
| `phone` | GHL phone number assigned. | Phone-system endpoint returns number and active account status. |
| `email` | Business email connected. | Location email/sender value plus sender-domain verification if available. |
| `landing` | Landing page published. | Website status ready, HTML present, images synced, and GHL page publication proof. |
| `calendar` | Calendar configured. | Calendar list has required calendars and booking custom values are set. |
| `stripe` | Stripe connected. | Payments/transactions signal or explicit Stripe connection evidence. |
| `client_ok` | Client access verified. | Manual sign-off from the client or operator. |

## AI Use Boundary

AI should only be required for:

- Landing page HTML generation.
- Website image generation.
- Optional copy/asset review.

All data inventory, custom-value reads/writes, panel checklist updates, and QC should be deterministic scripts. MiniMax M3 can later act as the automation driver for AI generation/review, but the first implementation should keep script execution deterministic and dry-run by default.

## Immediate Follow-Up

Create a dry-run automation and QC harness that:

1. Loads target location `4cPIvLND9hFAIzWQ1ZbL`.
2. Reads GHL/Supabase state without mutation.
3. Prints the planned changes for missing setup items.
4. Emits a QC report mapping each panel checklist item to evidence.
5. Requires `--apply` before any write.

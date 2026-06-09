# Liverpool Digital PatronPro Source Index

Date: 2026-06-09
Repo: `wedevio/patronpro-web`
Commit scanned: `f7ebe04`
Worktree: `/home/oz/projects/2026/patronpro-web-docs-automation`
Branch: `feature/liverpool-digital-docs-automation`
Epic bead: `ppweb-elk`
Target location: `4cPIvLND9hFAIzWQ1ZbL`
Target client: Liverpool Digital
Artifact role: source index
Artifact status: current code-derived snapshot

## Scope

This artifact records what the repository itself documents or implements for PatronPro panel onboarding and GHL setup automation. It is not a live export of the panel documentation table because this worktree does not currently have `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` available.

## Documentation Sources Found

- `src/app/panel/docs/page.tsx:9-24` reads published documentation pages from Supabase table `doc_pages`.
- `src/app/api/panel/docs/route.ts:14-31` lists `doc_pages` for logged-in panel users.
- `src/app/api/panel/docs/route.ts:33-72` creates docs pages for admin/manager users.
- `src/app/api/panel/docs/[id]/route.ts:15-37` reads full docs pages by UUID or slug.
- `src/app/api/panel/docs/[id]/route.ts:39-82` updates page metadata, blocks, published state, and position for admin/manager users.
- `src/lib/docs/types.ts:1-56` defines docs blocks as `heading`, `text`, `image`, `video`, and `callout`.
- `openspec/changes/support-tickets/*` contains committed support-ticket specs, not onboarding setup docs.
- Git history does not show committed seed content for `doc_pages`; panel docs appear database-backed.

## Current Setup Checklist Surface

The panel checklist is code-defined in `src/lib/panel/store.ts:13-22`:

- `form`: Formulario de onboarding recibido
- `domain`: Dominio conectado / DNS configurado
- `phone`: Numero de telefono asignado en GHL
- `email`: Email de negocio conectado
- `landing`: Landing page publicada
- `calendar`: Calendario configurado
- `stripe`: Stripe conectado
- `client_ok`: Acceso verificado con el cliente

Checklist writes are available through `src/app/api/panel/checklist/route.ts`, which calls `updateChecklist()` and upserts checklist rows by location ID. The update path can create missing `accounts` and `account_checklist` rows on demand (`src/lib/panel/store.ts:228-288`).

## Onboarding Flow Implemented

The onboarding submit route requires signed link context and a client `locationId`/`contactId` (`src/app/api/onboarding/route.ts:41-67`).

It parses and persists these fields:

- Business identity, address, phone, email, legal name, EIN, legal structure, team size, tax ID status, Stripe-account flag, platform language, customer-communication language (`src/app/api/onboarding/route.ts:80-114`).
- Domain choice, existing/desired domain, registrar, and domain purchase authorization (`src/app/api/onboarding/route.ts:101-106`).
- Brand colors, logo, square logo, business description/tagline, services, and hours (`src/app/api/onboarding/route.ts:97-113`, `src/app/api/onboarding/route.ts:138-194`).

It then:

- Gets a location-scoped GHL token (`src/app/api/onboarding/route.ts:123`).
- Fetches the GHL company ID for user-permission updates (`src/app/api/onboarding/route.ts:125-136`).
- Uploads the submitted logo to GHL/Supabase and square logo to Supabase (`src/app/api/onboarding/route.ts:138-194`).
- Syncs custom values to GHL (`src/app/api/onboarding/route.ts:196-197`).
- Applies default staff permissions when company ID is available (`src/app/api/onboarding/route.ts:199-206`).
- Leaves brand-board/global color setup disabled because the current API path returned 404 (`src/app/api/onboarding/route.ts:208-210`).
- Adds a contact note and `ob-form-ok` tag after submit (`src/app/api/onboarding/route.ts:212-243`).
- Saves the Supabase account/submission and seeds checklist rows (`src/app/api/onboarding/route.ts:246-290`).
- Triggers website generation when services exist (`src/app/api/onboarding/route.ts:295-324`).

## GHL Custom Values Implemented

`src/lib/ghl/custom-values.ts:136-147` currently syncs:

- `company_name`
- `company_address`
- `dominio_web`
- `logo`
- `logo_cuadrado`
- `hours_of_operation`
- `domain_purchase_authorized`
- `on_site_visit_calendar`
- `free_consultation_calendar`

Calendar links are detected by reading location calendars and matching names containing `on site`, `on-site`, `consultation`, or `consulta` (`src/lib/ghl/custom-values.ts:86-114`).

Important gap: the landing generator expects additional custom values that are not created by this mapper, including `company_phone`, `automation_sender_email`, and `landing_form` (`src/app/api/website/generate/route.ts:43-61`).

## Manual Or Not GHL-Synced Fields

The panel side panel marks the following as "No sincronizados con GHL - requieren configuracion manual" (`src/app/panel/_components/PanelClient.tsx:638-700`):

- Legal business name
- Owner email
- EIN / Tax ID
- Domain registrar
- City/state/ZIP display detail
- Business legal structure
- Team/user count
- Stripe account availability from form
- Tax ID status
- Preferred platform language
- Customer communication language

The panel also displays GHL-derived account state including location name, address, phone, email, website, custom domain, plan, phone numbers, Twilio, Stripe, SMS sent, and onboarding appointment (`src/app/panel/_components/PanelClient.tsx:583-627`).

## Website Generation Surface

`src/app/api/website/generate/route.ts` creates GHL Custom HTML from business data and saves generated HTML to `account_websites`:

- Required GHL merge tags include `company_name`, `company_phone`, `company_address`, `automation_sender_email`, `hours_of_operation`, `dominio_web`, `logo`, `logo_cuadrado`, and `landing_form` (`src/app/api/website/generate/route.ts:41-61`).
- Required page structure includes navbar, hero, trust band, services, about, process, testimonials, urgency CTA, contact section, and footer (`src/app/api/website/generate/route.ts:115-134`).
- HTML is saved to Supabase with status `ready` when generation succeeds (`src/app/api/website/generate/route.ts:358-368`).
- Image generation then creates hero/about/contact images and syncs `website_hero_image`, `website_about_image`, and `website_contact_image` to GHL (`src/app/api/website/generate-images/route.ts:185-221`).
- The read endpoint `src/app/api/website/[locationId]/route.ts:18-45` returns the generated website state by location ID.

## Manual Onboarding Link And GHL Workflow

The panel can generate a manual onboarding link for a location (`src/app/api/panel/accounts/[locationId]/onboarding-link/route.ts`). It verifies the location exists in GHL and calls `buildOnboardingLink()`.

The automatic GHL workflow endpoint is documented directly in `src/app/api/webhooks/send-onboarding/route.ts:1-33`:

- Trigger: Contact Tag Added -> `ob-meeting-ok`.
- Action: HTTP Webhook POST to `https://getpatronpro.com/api/webhooks/send-onboarding?secret=WEBHOOK_SECRET`.
- Body fields: contact email, phone, first name, and company name.
- Endpoint finds the sub-account by email, builds an onboarding link, upserts PatronPro contact, and sends email/SMS (`src/app/api/webhooks/send-onboarding/route.ts:19-25`, `src/app/api/webhooks/send-onboarding/route.ts:159-225`).

## Automation Feasibility

API-scriptable with current repo patterns:

- Read and upsert GHL custom values.
- Read GHL location metadata, phone-system numbers, SaaS plan/status, transactions for Stripe signal, conversations for SMS signal, and calendar events for appointment signal.
- Generate or retrieve manual onboarding links when panel session/auth is available.
- Toggle panel checklist items by API when authenticated as a panel user.
- Generate landing HTML/images if Supabase, OpenAI, internal secret or panel session, and GHL OAuth are available.

Likely manual or needs browser/UI:

- GHL workflow trigger/action creation or edits.
- Brand-board/global color setup, explicitly disabled in code due 404 API paths.
- DNS/domain connection unless registrar/DNS API credentials are available.
- Stripe actual account connection.
- Phone-number purchase/assignment if API scope/path is unavailable or requires GHL UI.
- Email sending-domain setup if DNS/provider API credentials are unavailable.
- Publishing generated HTML into a GHL funnel/page if the needed GHL page builder endpoint is unavailable.

## Immediate Blocker For Live Docs Export

The live panel documentation content is in Supabase `doc_pages`, not in committed files. This shell has no `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in the environment, and the repo has no `.env` file. Exporting the actual live docs requires one of:

- Supabase service-role environment variables for this project.
- An authenticated panel session that can call `/api/panel/docs` and `/api/panel/docs/{id}`.
- A safe Vercel environment pull with credentials available locally.

Until then, RLM can store this source-code-derived index but should treat it as implementation signal, not the complete panel documentation corpus.

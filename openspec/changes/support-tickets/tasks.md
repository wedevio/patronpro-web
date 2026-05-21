# Tasks: Support Tickets

- [x] TASK-01: Secure shared session auth and route guard
  - Files: package.json, src/lib/env.ts, src/lib/auth/session.ts, src/app/api/panel/checklist/route.ts, src/proxy.ts
  - Depends on: none
  - Can parallelize with: TASK-02
  - Notes: Add `jose`/`zod`; verify `pp-session` with `NEXTAUTH_SECRET`; add `support-session`; protect `/api/support/*`; use `proxy.ts` (Next 16), not deprecated `middleware.ts`.

- [x] TASK-02: Add Supabase support-ticket migration
  - Files: supabase/migrations/<timestamp>_support_tickets.sql
  - Depends on: none
  - Can parallelize with: TASK-01, TASK-03
  - Notes: Create enums, `support_tickets`, `support_ticket_notes`, indexes, updated_at trigger, and service-role-only/RLS setup.

- [x] TASK-03: Define support types and validation schemas
  - Files: src/lib/support/types.ts
  - Depends on: TASK-01
  - Can parallelize with: TASK-02
  - Notes: Export TS types + Zod schemas for ticket payloads, filters, notes, response envelopes, and session-aware author metadata.

- [x] TASK-04: Build support ticket data layer
  - Files: src/lib/support/tickets.ts
  - Depends on: TASK-02, TASK-03
  - Can parallelize with: none
  - Notes: Implement all DAL functions with `getAdminClient()`, duplicate checks, note visibility rules, resolve timestamps, and fire-and-forget `notifyOnboarder()` calls.

- [x] TASK-05: Verify foundation batch
  - Files: package.json, src/lib/auth/session.ts, src/lib/support/types.ts, src/lib/support/tickets.ts, supabase/migrations/*
  - Depends on: TASK-01, TASK-02, TASK-03, TASK-04
  - Can parallelize with: none
  - Notes: Run `tsc --noEmit`; fix type issues before any route work.

- [x] TASK-06: Implement iframe auth and ticket collection APIs
  - Files: src/app/api/auth/ghl-iframe/route.ts, src/app/api/support/tickets/route.ts
  - Depends on: TASK-04, TASK-05
  - Can parallelize with: TASK-07
  - Notes: Mark handlers `force-dynamic`; issue secure partitioned iframe cookie; validate location/company; implement GET list and POST create with duplicate 409 handling.

- [x] TASK-07: Implement ticket detail and note APIs
  - Files: src/app/api/support/tickets/[id]/route.ts, src/app/api/support/tickets/[id]/notes/route.ts
  - Depends on: TASK-04, TASK-05
  - Can parallelize with: TASK-06
  - Notes: Enforce staff-only PATCH, client/staff note authorship, note visibility filtering, waiting-client reopen, and response envelope consistency.

- [x] TASK-08: Verify API batch
  - Files: src/app/api/auth/ghl-iframe/route.ts, src/app/api/support/tickets/**/*.ts
  - Depends on: TASK-06, TASK-07
  - Can parallelize with: none
  - Notes: Run `tsc --noEmit`; confirm auth helper imports, route signatures, and handler typing all pass.

- [ ] TASK-09: Build GHL iframe support UI
  - Files: src/app/ghl/layout.tsx, src/app/ghl/support/new/page.tsx, src/app/ghl/support/_components/*
  - Depends on: TASK-06, TASK-08
  - Can parallelize with: TASK-10
  - Notes: Use a bare iframe layout, redirect through iframe auth flow, and ship a client form plus existing-ticket list for the current location/contact.

- [ ] TASK-10: Build panel support list and detail UI
  - Files: src/app/panel/support/page.tsx, src/app/panel/support/[id]/page.tsx, src/app/panel/support/_components/*
  - Depends on: TASK-07, TASK-08
  - Can parallelize with: TASK-09
  - Notes: Server-render ticket list/detail, add client filters/forms as needed, and expose staff actions for status, assignee, priority, and notes.

- [ ] TASK-11: Verify UI batch and final integration
  - Files: src/app/ghl/**/*.tsx, src/app/panel/support/**/*.tsx, src/proxy.ts
  - Depends on: TASK-09, TASK-10
  - Can parallelize with: none
  - Notes: Run `tsc --noEmit`; then manually sanity-check iframe auth, ticket creation, panel listing, detail loading, and note posting flows.

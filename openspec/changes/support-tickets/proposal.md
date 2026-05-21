# Proposal: Support Ticket System

## Intent

PatronPro has zero support infrastructure. Agency clients (GHL sub-accounts) cannot report issues, request help, or track resolution. Staff have no centralized view of open issues. This change adds a full support ticket system accessible from inside GHL via Custom Menu iframe AND from the internal staff panel.

## Scope

### In Scope
- Supabase tables: `support_tickets`, `support_ticket_notes`
- GHL iframe auth flow (`/api/auth/ghl-iframe` → `support-session` cookie, SameSite=None; Secure, 8h TTL)
- Fix pp-session auth (replace `jwtDecode` with proper JWT verification)
- Ticket CRUD API routes (create, list, get, update, add notes)
- GHL iframe page (`/ghl/support/new`) for clients to submit tickets
- Staff panel pages (`/panel/support`, `/panel/support/[id]`)
- GHL contact note posted on ticket open/resolve (via existing `notifyOnboarder` pattern)

### Out of Scope
- Email/SMS notifications on ticket updates
- SLA tracking or auto-escalation
- File upload for attachments (schema supports URLs, but upload infra deferred)
- Public-facing knowledge base
- Real-time ticket updates (polling is fine for v1)

## Capabilities

### New Capabilities
- `support-tickets`: Ticket lifecycle — create, list, filter, update status, add notes
- `ghl-iframe-auth`: Secure iframe authentication for GHL Custom Menu context
- `ghl-contact-notes`: Post notes to GHL contacts on ticket events

### Modified Capabilities
- `session-auth`: Fix pp-session JWT verification (currently unverified `jwtDecode`)

## Approach

1. **Data layer**: Two Supabase tables with RLS policies scoped by `ghl_location_id`
2. **Iframe auth**: `/api/auth/ghl-iframe` receives `locationId` from GHL URL params, verifies location belongs to agency via GHL API, issues `support-session` cookie (separate from `pp-session`)
3. **API routes**: Standard Next.js route handlers under `/api/support/`, all `force-dynamic`
4. **GHL integration**: Iframe at `/ghl/support/new` reads `{{location.id}}` and `{{contact.id}}` from URL; falls back to search when accessed from global menu
5. **pp-session fix**: Replace `jwtDecode` with `jose` `jwtVerify` using Supabase JWT secret

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Two tables + RLS policies |
| `src/app/api/auth/ghl-iframe/` | New | Iframe session endpoint |
| `src/app/api/support/` | New | Ticket CRUD + notes API |
| `src/app/ghl/support/` | New | Iframe ticket form |
| `src/app/panel/support/` | New | Staff ticket list + detail |
| `src/lib/auth/` | Modified | Fix JWT verification |
| `src/lib/ghl/` | Modified | Add contact note helper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| pp-session fix breaks existing auth flows | Med | Test all existing authenticated routes before/after |
| Iframe cookies blocked (Safari ITP, Chrome 3P) | Med | `SameSite=None; Secure; Partitioned` + Storage Access API fallback |
| GHL `{{contact.id}}` empty in global menu context | High | Search fallback UI; ticket works without contact link |

## Rollback Plan

- Revert Supabase migration (drop tables)
- Remove `/api/support/`, `/ghl/support/`, `/panel/support/` routes
- Revert auth changes (pp-session fix is independent, can stay)

## Dependencies

- GHL Custom Menu configured in agency dashboard (manual step)
- Supabase JWT secret available as env var for pp-session fix

## Success Criteria

- [ ] Client can submit ticket from GHL Custom Menu iframe
- [ ] Staff can view, filter, and respond to tickets in `/panel/support`
- [ ] Ticket status changes post a note to the GHL contact
- [ ] pp-session uses verified JWT (not raw decode)
- [ ] Iframe auth works in Chrome and Safari with third-party cookie restrictions

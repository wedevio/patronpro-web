# Design: Support Ticket System

## Technical Approach

Two-table Supabase schema accessed exclusively via `getAdminClient()` (service_role, bypasses RLS). Two auth contexts: `support-session` (iframe JWT signed with `SUPPORT_SESSION_SECRET`) and `pp-session` (staff JWT verified with `NEXTAUTH_SECRET`). Middleware validates both cookie types for `/api/support/*` routes.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| DB access | `getAdminClient()` only — no anon/RLS | RLS with row-level policies | All access server-side via route handlers; RLS adds complexity without benefit since we never expose the client to browsers |
| Iframe auth | Custom JWT in `support-session` cookie | Session table in Supabase, GHL OAuth per-user | Stateless, no DB round-trip; 8h TTL matches GHL session length; `SameSite=None; Secure; Partitioned` for cross-origin iframe |
| JWT library | `jose` (`jwtVerify` / `SignJWT`) | `jsonwebtoken` | `jose` is Edge-compatible, already used by NextAuth internally; works in both middleware and route handlers |
| pp-session fix | Replace `jwtDecode` → `jwtVerify` with `NEXTAUTH_SECRET` | Keep unverified decode | Current code trusts unsigned tokens — critical security gap |
| Ticket IDs | Supabase `gen_random_uuid()` + `ticket_number` serial | CUID, nanoid | UUID for PK, serial `ticket_number` for human-readable display (`#42`) |
| Note integration | Reuse existing `notifyOnboarder()` | New GHL API wrapper | Already works, tested in production for onboarding flow |

## Data Flow

```
GHL iframe                          Staff panel
    │                                    │
    ▼                                    ▼
/api/auth/ghl-iframe          (pp-session cookie)
    │ verify location.companyId          │
    │ set support-session cookie         │
    ▼                                    ▼
/api/support/tickets ◄──── middleware checks cookie ────►
    │
    ▼
src/lib/support/tickets.ts  (data access layer)
    │
    ├──► Supabase (getAdminClient)
    └──► GHL API (notifyOnboarder on create/resolve)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/support/types.ts` | Create | Zod schemas + TS types for tickets, notes, filters |
| `src/lib/support/tickets.ts` | Create | DAL: createTicket, listTickets, getTicket, updateTicket, addNote, findDuplicates |
| `src/lib/auth/session.ts` | Create | `verifyPpSession(token)`, `verifySupportSession(token)`, `createSupportSession(payload)` using jose |
| `src/app/api/auth/ghl-iframe/route.ts` | Create | GET: validate locationId via GHL API, issue support-session cookie |
| `src/app/api/support/tickets/route.ts` | Create | GET (list+filter), POST (create) |
| `src/app/api/support/tickets/[id]/route.ts` | Create | GET (detail), PATCH (update status/priority/assignee) |
| `src/app/api/support/tickets/[id]/notes/route.ts` | Create | GET (list), POST (add note) |
| `src/app/ghl/support/layout.tsx` | Create | Bare layout — no nav, minimal wrapper for iframe embedding |
| `src/app/ghl/support/new/page.tsx` | Create | Client component: URL params → auth redirect → ticket form + existing tickets |
| `src/app/panel/support/page.tsx` | Create | Server component: ticket list with client filter controls |
| `src/app/panel/support/[id]/page.tsx` | Create | Server component: ticket detail + client note form |
| `src/middleware.ts` | Create | Protect `/api/support/*`: require valid `support-session` OR `pp-session` |
| `src/app/api/panel/checklist/route.ts` | Modify | Replace `jwtDecode` → `verifyPpSession` from shared auth module |

## Interfaces / Contracts

```typescript
// src/lib/support/types.ts
const TicketStatus = z.enum(["open", "in_progress", "waiting_client", "resolved", "closed"]);
const TicketPriority = z.enum(["low", "medium", "high", "urgent"]);
const TicketCategory = z.enum(["bug", "feature_request", "question", "access", "billing", "other"]);

const CreateTicketSchema = z.object({
  ghlLocationId: z.string().min(1),
  ghlContactId: z.string().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: TicketCategory,
  priority: TicketPriority.default("medium"),
});

// src/lib/auth/session.ts
function createSupportSession(payload: { locationId: string; contactId?: string }): Promise<string>
function verifySupportSession(token: string): Promise<{ locationId: string; contactId?: string }>
function verifyPpSession(token: string): Promise<{ email: string; sub: string }>
```

## Migration SQL

```sql
-- Enums
CREATE TYPE support_ticket_status AS ENUM ('open','in_progress','waiting_client','resolved','closed');
CREATE TYPE support_ticket_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE support_ticket_category AS ENUM ('bug','feature_request','question','access','billing','other');

-- Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL UNIQUE,
  ghl_location_id TEXT NOT NULL,
  ghl_contact_id TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category support_ticket_category NOT NULL DEFAULT 'other',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  status support_ticket_status NOT NULL DEFAULT 'open',
  assigned_to TEXT, -- staff email
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes
CREATE TABLE support_ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('client','staff')),
  author_name TEXT NOT NULL,
  author_email TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tickets_location ON support_tickets(ghl_location_id);
CREATE INDEX idx_tickets_contact ON support_tickets(ghl_contact_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_notes_ticket ON support_ticket_notes(ticket_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: enabled but permissive for service_role (which bypasses anyway)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_notes ENABLE ROW LEVEL SECURITY;
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Zod schemas, session helpers | `tsc --noEmit` type checking; manual Zod parse tests |
| Integration | API routes auth + CRUD | `curl` / Postman against dev; verify cookie flow |
| E2E | Iframe auth → ticket create → panel view | Manual QA in GHL sandbox |

## Migration / Rollout

1. Apply Supabase migration (tables + indexes)
2. Add env vars: `SUPPORT_SESSION_SECRET`, verify `NEXTAUTH_SECRET` exists
3. Deploy all new routes + pages
4. Configure GHL Custom Menu Link: `https://{domain}/ghl/support/new?locationId={{location.id}}&contactId={{contact.id}}`
5. pp-session fix deploys alongside — backward compatible (same cookie, now verified)

## Open Questions

- [x] ~~RLS vs service_role~~ → service_role only (decided above)
- [ ] Should `ticket_number` reset per location or be global? (Design assumes global serial — simpler)

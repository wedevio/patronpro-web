# Support Tickets Specification

## Purpose

Full ticket lifecycle: create, list, filter, update status, add notes. Accessible from GHL iframe (clients) and staff panel.

## Data Model

### Table: `support_tickets`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | uuid | PK | gen_random_uuid() |
| ghl_location_id | text | NOT NULL, indexed | — |
| ghl_contact_id | text | nullable | — |
| contact_name | text | NOT NULL | — |
| contact_email | text | nullable | — |
| subject | text | NOT NULL | — |
| description | text | NOT NULL | — |
| status | text | NOT NULL, CHECK | 'open' |
| priority | text | NOT NULL, CHECK | 'medium' |
| category | text | NOT NULL, CHECK | 'general' |
| source | text | NOT NULL, CHECK | 'iframe' |
| assigned_to | uuid | nullable, FK→auth.users | — |
| resolved_at | timestamptz | nullable | — |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Enums (CHECK constraints):**
- status: `open`, `in_progress`, `waiting_on_client`, `resolved`, `closed`
- priority: `low`, `medium`, `high`, `urgent`
- category: `general`, `billing`, `technical`, `onboarding`, `feature_request`
- source: `iframe`, `panel`, `api`

**Indexes:** `ghl_location_id`, `status`, `(ghl_location_id, status)`, `created_at DESC`

### Table: `support_ticket_notes`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | uuid | PK | gen_random_uuid() |
| ticket_id | uuid | NOT NULL, FK→support_tickets ON DELETE CASCADE | — |
| author_type | text | NOT NULL, CHECK | — |
| author_name | text | NOT NULL | — |
| body | text | NOT NULL | — |
| attachments | jsonb | nullable | '[]' |
| is_internal | boolean | NOT NULL | false |
| created_at | timestamptz | NOT NULL | now() |

**author_type:** `client`, `staff`, `system`

**Indexes:** `ticket_id`, `(ticket_id, created_at)`

### RLS Policies

- SR-RLS-01: `support_tickets` — service_role only (API routes use service client)
- SR-RLS-02: `support_ticket_notes` — service_role only

## Requirements

### Requirement: Create Ticket

The system MUST allow creating a ticket with subject, description, category, and priority. Contact info (name, email, ghl_contact_id) and location are derived from the auth session.

#### Scenario: Successful creation from iframe

- GIVEN a valid support-session with ghl_location_id and contact info
- WHEN POST /api/support/tickets with { subject, description, category, priority }
- THEN ticket is created with status=open, source=iframe
- AND response is 201 with ticket object

#### Scenario: Duplicate detection

- GIVEN an open ticket exists with same ghl_location_id, ghl_contact_id, and subject
- WHEN POST /api/support/tickets with same subject
- THEN response is 409 with existing ticket reference

#### Scenario: Missing required fields

- GIVEN a valid session
- WHEN POST /api/support/tickets without subject
- THEN response is 400 with validation errors

### Requirement: List Tickets

The system MUST support listing tickets with filtering and pagination.

**API:** GET /api/support/tickets?status=&priority=&category=&page=&limit=&sort=

#### Scenario: Staff lists all tickets

- GIVEN a valid pp-session (staff)
- WHEN GET /api/support/tickets
- THEN returns paginated list with total count, sorted by created_at DESC

#### Scenario: Iframe user lists own tickets

- GIVEN a valid support-session
- WHEN GET /api/support/tickets
- THEN returns only tickets matching session's ghl_location_id

#### Scenario: Filter by status

- GIVEN tickets in various statuses
- WHEN GET /api/support/tickets?status=open
- THEN returns only open tickets

### Requirement: Get Ticket Detail

The system MUST return a single ticket with its notes.

#### Scenario: Staff views any ticket

- GIVEN a valid pp-session
- WHEN GET /api/support/tickets/[id]
- THEN returns ticket with notes array (excluding is_internal=false for client, including all for staff)

#### Scenario: Client views own ticket

- GIVEN a valid support-session
- WHEN GET /api/support/tickets/[id] where ticket.ghl_location_id matches session
- THEN returns ticket with non-internal notes only

#### Scenario: Unauthorized access

- GIVEN a support-session for location A
- WHEN GET /api/support/tickets/[id] for location B's ticket
- THEN response is 404

### Requirement: Update Ticket

The system MUST allow staff to update status, priority, category, and assignment.

#### Scenario: Staff changes status to resolved

- GIVEN a valid pp-session and an open ticket
- WHEN PATCH /api/support/tickets/[id] with { status: "resolved" }
- THEN ticket.status = resolved, resolved_at = now()
- AND a system note is added: "Ticket resolved by {staff_name}"

#### Scenario: Client cannot update status

- GIVEN a valid support-session
- WHEN PATCH /api/support/tickets/[id]
- THEN response is 403

### Requirement: Add Note

The system MUST allow adding notes to tickets.

#### Scenario: Staff adds internal note

- GIVEN a valid pp-session
- WHEN POST /api/support/tickets/[id]/notes with { body, is_internal: true }
- THEN note is created with author_type=staff, visible only to staff

#### Scenario: Client adds note

- GIVEN a valid support-session, ticket belongs to session's location
- WHEN POST /api/support/tickets/[id]/notes with { body }
- THEN note is created with author_type=client, is_internal=false
- AND ticket.status changes to open if it was waiting_on_client

## API Contract Summary

| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| POST | /api/support/tickets | support-session OR pp-session | { subject, description, category?, priority? } |
| GET | /api/support/tickets | support-session OR pp-session | ?status, ?priority, ?category, ?page, ?limit, ?sort |
| GET | /api/support/tickets/[id] | support-session OR pp-session | — |
| PATCH | /api/support/tickets/[id] | pp-session only | { status?, priority?, category?, assigned_to? } |
| POST | /api/support/tickets/[id]/notes | support-session OR pp-session | { body, is_internal? } |

**Response envelope:** `{ data: T, error?: string, meta?: { total, page, limit } }`

**Error responses:** 400 (validation), 401 (no session), 403 (forbidden), 404 (not found), 409 (duplicate)

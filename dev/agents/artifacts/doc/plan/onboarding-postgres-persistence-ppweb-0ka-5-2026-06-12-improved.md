# PRD: Postgres-first persistence with Supabase migration path

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.5`
Date: 2026-06-12
Status: Improved PRD after CE merge
Quality-loop inputs:

- Original PRD: `dev/agents/artifacts/doc/plan/onboarding-postgres-persistence-ppweb-0ka-5-2026-06-12.md`
- Mini review: `dev/agents/artifacts/doc/sages/onboarding-postgres-persistence-ppweb-0ka-5-20260612/sage-mini.md`
- Merge synthesis: `dev/agents/artifacts/doc/sages/onboarding-postgres-persistence-ppweb-0ka-5-20260612/merge.md`

## Goal

Define and implement a portable Postgres persistence contract for the onboarding automation PoC while preserving a clean migration path to future Supabase deployment.

The schema must support clients, onboarding meetings, calendar invite artifacts, provider links, email previews, send attempts, and audit events. It must not depend on Supabase Auth, Supabase Storage, Realtime, Vault, service-role assumptions, extension-provided UUID defaults, or browser session state.

GHL remains the source of truth for appointment booking. This schema stores GHL identifiers, app-generated artifacts, redacted source readback payloads, and audit records for reconciliation; it does not replace GHL ownership of booking state.

## Source Baseline

RLM/current project context to preserve:

- `ppweb-0ka.3` already added a narrow `onboarding_invite_audit` scratch table for the Monday panel dry-run API.
- RLM Supabase access pattern says current Supabase access is read-only unless the user explicitly approves writes. Do not use or store Supabase secrets.
- The epic requires local Postgres first and Supabase-compatible migrations later.

Official Supabase docs checked on 2026-06-12:

- Supabase database migrations guide: `https://supabase.com/docs/guides/deployment/database-migrations`
- Context7 Supabase CLI docs: `supabase migration new`, `supabase migration up`, `supabase db push --dry-run`, `supabase db reset`

Supabase migration findings:

- Schema changes should live in migration SQL files.
- Remote Supabase schema should not be changed manually once migrations are in use.
- Local migration testing is expected before remote push.
- Remote deployment should use `supabase db push`; `--dry-run` can show pending migrations without applying them.

Environment finding:

- This worktree currently has no `psql`, `pg_isready`, or `postgres` binary available.
- This session can only honestly close at verification tier `static-only` unless a future environment provides `POSTGRES_URL` and `psql`.
- Do not claim a local Postgres apply, Supabase dry-run, or live migration unless that exact command actually ran and its output is recorded.

## Deliverables

1. Portable SQL migration:
   - Path: `dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql`
   - Uses app-generated IDs with the format `<prefix>_<ulid-like-token>`.
   - Uses `varchar(40)` for all ID columns.
   - Uses Postgres-native `jsonb`, `timestamptz`, foreign keys, check constraints, uniqueness constraints, and indexes.
   - Does not use `auth.*`, `storage.*`, `vault.*`, `supabase_realtime`, RLS policies, service-role references, secrets, or extension-dependent ID defaults.

2. Migration notes:
   - Path: `dev/agents/artifacts/doc/research/postgres-supabase-persistence-ppweb-0ka-5-2026-06-12.md`
   - Must contain, in order:
     1. Purpose
     2. Source-of-truth model: GHL, app, schema
     3. Table-by-table column reference: types, defaults, nullability, checks
     4. FK graph with `ON DELETE` behavior
     5. Uniqueness and index catalog
     6. Compatibility with `onboarding_invite_audit` from `ppweb-0ka.3`
     7. Local Postgres apply command
     8. Supabase migration steps
     9. Explicitly excluded Supabase features
     10. Known limitations and verification tier reached

3. Static validator:
   - Path: `dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py`
   - Must be headless and deterministic.
   - Must accept `--sql-path`.
   - Must accept `--strict`; strict mode promotes warnings to failures.
   - Must exit `0` on success and `1` on failure, with one-line diagnostics per failure.

4. Verification command documentation:
   - Static validator:
     ```bash
     python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py --sql-path dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql --strict
     ```
   - Optional future local apply:
     ```bash
     psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
     ```

## ID Contract

All primary keys and FK references use app-generated IDs, not database-generated UUIDs.

Format:

- `<prefix>_<ulid-like-token>`
- Prefixes:
  - `cli` for `onboarding_clients.id`
  - `mtg` for `onboarding_meetings.id`
  - `inv` for `onboarding_calendar_invites.id`
  - `cpl` for `onboarding_calendar_provider_links.id`
  - `eml` for `onboarding_email_previews.id`
  - `snd` for `onboarding_send_attempts.id`
  - `aud` for `onboarding_audit_events.id`
- Column type: `varchar(40) NOT NULL`
- SQL should enforce prefix shape with `CHECK` constraints where practical, for example `id LIKE 'cli_%'`.
- The validator must reject `uuid` ID columns, `gen_random_uuid()`, `uuid_generate_v4()`, and unconstrained `text` primary keys.

The exact application-side ID helper is out of scope for this bead. Do not add `_ids.py` in `ppweb-0ka.5`; document the contract and enforce the database surface.

## Table Contract

### `onboarding_clients`

Purpose: one app-side client/contact record tied to GHL when available.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'cli_%')`
- `ghl_contact_id text NULL CHECK (ghl_contact_id IS NULL OR length(ghl_contact_id) > 0)`
- `display_name text NULL`
- `email text NULL`
- `phone text NULL`
- `source_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `anonymized_at timestamptz NULL`

Constraints and indexes:

- Unique nullable GHL contact ID: `UNIQUE (ghl_contact_id)` with Postgres nullable semantics.
- Index: `onboarding_clients(ghl_contact_id)`.

Safety:

- `source_payload` must contain redacted source readback only.
- Right-to-erasure handling is anonymization, not hard deletion: overwrite PII fields, set `anonymized_at`, retain ID for FK integrity.

### `onboarding_meetings`

Purpose: one onboarding meeting state snapshot or reschedule version linked to a client.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'mtg_%')`
- `client_id varchar(40) NOT NULL REFERENCES onboarding_clients(id) ON DELETE RESTRICT`
- `ghl_appointment_id text NULL CHECK (ghl_appointment_id IS NULL OR length(ghl_appointment_id) > 0)`
- `meeting_source text NOT NULL CHECK (meeting_source IN ('ghl','manual','system'))`
- `status text NOT NULL CHECK (status IN ('scheduled','rescheduled','cancelled','completed','no-show','blocked'))`
- `scheduled_start_at timestamptz NULL`
- `scheduled_end_at timestamptz NULL`
- `timezone text NULL`
- `replaced_by_id varchar(40) NULL REFERENCES onboarding_meetings(id) ON DELETE SET NULL`
- `source_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `anonymized_at timestamptz NULL`

Constraints and indexes:

- Unique nullable GHL appointment ID: `UNIQUE (ghl_appointment_id)`.
- Indexes: `client_id`, `ghl_appointment_id`, `scheduled_start_at`, `replaced_by_id`.
- All `timestamptz` values are stored in UTC; UI and reports convert using the client or appointment IANA timezone.

Reschedule behavior:

- A corrected time can update the current row when history is not material.
- A true reschedule creates a new meeting row and sets the prior row's `replaced_by_id` to the new `mtg_*` ID, plus an audit event.

### `onboarding_calendar_invites`

Purpose: generated invite artifacts associated with a meeting.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'inv_%')`
- `meeting_id varchar(40) NOT NULL REFERENCES onboarding_meetings(id) ON DELETE RESTRICT`
- `invite_source text NOT NULL CHECK (invite_source IN ('calendar-link','google-calendar-api','manual','system'))`
- `artifact_kind text NOT NULL CHECK (artifact_kind IN ('ics','google-calendar-event','calendar-url','manual-note'))`
- `title text NULL`
- `starts_at timestamptz NULL`
- `ends_at timestamptz NULL`
- `timezone text NULL`
- `redacted_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Index: `meeting_id`.
- Optional uniqueness when external IDs exist is handled in provider links, not this table.

### `onboarding_calendar_provider_links`

Purpose: provider-specific references derived from an invite.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'cpl_%')`
- `invite_id varchar(40) NOT NULL REFERENCES onboarding_calendar_invites(id) ON DELETE CASCADE`
- `provider text NOT NULL CHECK (provider IN ('google-calendar','calendar-link','manual'))`
- `external_calendar_id text NULL CHECK (external_calendar_id IS NULL OR length(external_calendar_id) > 0)`
- `external_event_id text NULL CHECK (external_event_id IS NULL OR length(external_event_id) > 0)`
- `status text NOT NULL CHECK (status IN ('active','disconnected','revoked','error'))`
- `redacted_provider_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Unique provider link: `UNIQUE (invite_id, provider, external_calendar_id)`.
- Indexes: `invite_id`, `(provider, external_calendar_id)`.

### `onboarding_email_previews`

Purpose: generated email preview content before send approval.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'eml_%')`
- `meeting_id varchar(40) NOT NULL REFERENCES onboarding_meetings(id) ON DELETE RESTRICT`
- `meeting_version_id varchar(40) NULL REFERENCES onboarding_meetings(id) ON DELETE SET NULL`
- `subject text NOT NULL`
- `body_text text NOT NULL`
- `body_html text NULL`
- `preview_status text NOT NULL CHECK (preview_status IN ('draft','approved','superseded','blocked'))`
- `redacted_context jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Indexes: `meeting_id`, `meeting_version_id`, `preview_status`.
- A preview for a rescheduled meeting should point to the meeting row whose timing it describes.

### `onboarding_send_attempts`

Purpose: durable record of approved or blocked provider send attempts without storing secrets or raw provider credentials.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'snd_%')`
- `meeting_id varchar(40) NOT NULL REFERENCES onboarding_meetings(id) ON DELETE RESTRICT`
- `invite_id varchar(40) NULL REFERENCES onboarding_calendar_invites(id) ON DELETE SET NULL`
- `email_preview_id varchar(40) NULL REFERENCES onboarding_email_previews(id) ON DELETE SET NULL`
- `attempt_no integer NOT NULL CHECK (attempt_no >= 1)`
- `run_mode text NOT NULL CHECK (run_mode IN ('dry-run','approved-live'))`
- `status text NOT NULL CHECK (status IN ('draft','queued','sent','failed','blocked'))`
- `state_version integer NOT NULL DEFAULT 0 CHECK (state_version >= 0)`
- `provider text NULL CHECK (provider IS NULL OR provider IN ('gmail','google-calendar','ghl','manual','system'))`
- `redacted_request jsonb NULL`
- `redacted_response jsonb NULL`
- `error_code text NULL`
- `error_message text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Unique attempt number: `UNIQUE (meeting_id, attempt_no)`.
- Indexes: `meeting_id`, `invite_id`, `email_preview_id`, `run_mode`, `status`.
- App-side update convention: transition send state with optimistic concurrency using `WHERE id = ? AND state_version = ?`.

Safety:

- `approved-live` is a recordable mode but this bead does not send email, mutate Google Calendar, call GHL, or perform provider-side writes.

### `onboarding_audit_events`

Purpose: append-oriented audit trail for schema-owned entities and reconciled source actions.

Required columns:

- `id varchar(40) PRIMARY KEY CHECK (id LIKE 'aud_%')`
- `entity_type text NOT NULL CHECK (entity_type IN ('client','meeting','invite','provider_link','email_preview','send_attempt'))`
- `entity_id varchar(40) NOT NULL`
- `audit_source text NOT NULL CHECK (audit_source IN ('ghl','manual','system','google-calendar-api'))`
- `event_type text NOT NULL`
- `run_mode text NULL CHECK (run_mode IS NULL OR run_mode IN ('dry-run','approved-live'))`
- `message text NULL`
- `redacted_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- No DB-level FK on `entity_type` plus `entity_id`; audit remains readable across entity lifetimes and polymorphic entity types.
- Indexes: `(entity_type, entity_id)`, `audit_source`, `event_type`, `created_at`.

## Relationship Model

- A client has many onboarding meetings.
- A meeting can have many invite artifacts.
- An invite can have many provider links.
- A meeting can have many email previews.
- Send attempts reference a meeting and optionally the specific invite and email preview used.
- Audit events point at an entity by constrained `entity_type` and `entity_id` without DB-level FK.

FK delete rules:

- Audit-owned entities use `ON DELETE RESTRICT`: client to meetings, meeting to invites, meeting to email previews, meeting to send attempts.
- Derived provider links use `ON DELETE CASCADE` from invite.
- Optional references from send attempts use `ON DELETE SET NULL`.
- Meeting reschedule chain uses `ON DELETE SET NULL` for `replaced_by_id`.
- Audit events remain polymorphic and append-oriented.

## Compatibility With `onboarding_invite_audit`

`ppweb-0ka.5` must not alter, drop, rename, or backfill the `001` scratch table `onboarding_invite_audit`.

The `002` migration creates the durable persistence schema in parallel. Both tables may coexist until a later bead explicitly migrates data.

Migration notes must document this future mapping for a later backfill:

- Old invite-audit row identifier maps to a new `aud_*` ID.
- Old invite or dry-run identifier maps to `entity_type='invite'` and `entity_id=<inv_*>` when a durable invite exists.
- Source maps to `audit_source='system'` unless the old row records a more specific GHL/manual source.
- Old payload maps to `redacted_payload` after redaction review.
- No union view or backfill is required in this bead.

## Validator Scope

The validator must inspect the SQL file as text and fail deterministically when required contract items are missing.

Required checks:

- All seven required tables are present.
- Every ID column is `varchar(40)`.
- Every table has a prefixed primary key check where practical.
- No `uuid`, `gen_random_uuid()`, `uuid_generate_v4()`, or extension dependency is used for IDs.
- Required enum values are bound to the exact columns named in this PRD.
- All FK declarations include explicit `ON DELETE` behavior.
- Required uniqueness constraints are present.
- Required indexes are present, including all FK columns and `onboarding_audit_events(entity_type, entity_id)`.
- `timestamptz` is used instead of bare `timestamp`.
- `jsonb` is used instead of `json`.
- No forbidden Supabase-specific assumptions appear in executable SQL:
  - `auth.`
  - `storage.`
  - `vault.`
  - `supabase_realtime`
  - `auth.uid`
  - `service_role`
  - RLS policy statements
  - remote manual-edit instructions
- No forbidden secret/token-like column names or literals appear:
  - column names matching `(token|secret|api_?key|authorization|password|cookie)` case-insensitively
  - JWT-shaped literals beginning with `eyJ`
  - `Bearer ` literals with long credential-like suffixes
  - `sk_test_`, `sk_live_`, or similar provider-secret-looking literals
- Validator supports `--sql-path` and `--strict`.
- Validator emits one diagnostic per failure.

Warnings in non-strict mode:

- Optional syntax parse was not run.
- Optional local Postgres apply was not run.
- Optional Supabase dry-run was not run.

Strict mode must fail missing required contract items, but must not fail only because this environment lacks `psql`.

## Verification Plan

Always run:

```bash
python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py --sql-path dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql --strict
git diff --check
```

If local Postgres tooling is available:

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
```

Optional syntactic parse tier if Postgres is not available and a parser dependency is already approved/available:

```bash
python3 -c "import pglast; pglast.parse_sql(open('dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql').read()); print('parse ok')"
```

Future Supabase path:

```bash
supabase migration new onboarding_persistence_core
# copy the SQL into the generated supabase/migrations/<timestamp>_onboarding_persistence_core.sql
supabase migration up
supabase db push --dry-run
```

Verification tier must be recorded in the bead closure comment and migration notes:

- `live-apply`: local Postgres apply ran successfully.
- `syntactic-parse`: SQL parser accepted the migration, but no live database apply ran.
- `static-only`: static validator and text checks passed, but no parser or database apply ran.

For this session, expected tier is `static-only` because `psql`, `pg_isready`, and `postgres` are not present in the worktree environment.

## Supabase Readiness Checklist

Before any future Supabase remote migration:

- Confirm no remote manual schema edits are needed.
- Confirm the SQL contains no `auth.*`, `storage.*`, `vault.*`, realtime, RLS, or service-role dependency.
- Confirm the SQL contains no extension dependency for IDs.
- Confirm local migration testing has run, or explicitly record why it has not.
- Run `supabase db push --dry-run` before any remote apply.
- Do not use Supabase secrets in repository files, shell history snippets, logs, validator fixtures, or RLM stores.

## Safety Rules

- Never store OAuth tokens, refresh tokens, session cookies, API keys, service-role keys, raw Authorization headers, passwords, browser localStorage, or provider credential blobs.
- Redact request and response payloads before storing them in `jsonb` columns.
- Keep raw source payload columns optional and redacted.
- Do not enable Supabase RLS in this PoC migration. RLS should be a later Supabase-specific migration once auth tenancy is defined.
- Do not create storage buckets, realtime publications, auth triggers, or Vault entries.
- Do not run live GHL, Google, Supabase, email, or database provider mutations in this bead without explicit user approval.
- Do not add `_ids.py` or `_redact.py` in this bead; those app helpers are future implementation slices.
- The schema may include `approved-live` as a status value for future auditability, but no live-send behavior is implemented here.

## Implementation Order

1. Update or create the migration notes with the column contract, FK graph, index catalog, `onboarding_invite_audit` compatibility rule, and verification tier language.
2. Write `002_onboarding_persistence_core.sql` from this PRD.
3. Write `validate_onboarding_persistence_sql.py` against this PRD, not by reverse-engineering only the SQL.
4. Run the static validator in strict mode.
5. Run `git diff --check`.
6. If and only if local Postgres tooling exists and `POSTGRES_URL` points to a disposable local database, run the documented `psql` apply command.
7. Record the verification tier honestly.

## Acceptance Criteria

- SQL migration defines all seven required persistence tables.
- SQL uses portable Postgres constructs only.
- IDs are app-generated `varchar(40)` values following the prefix contract.
- Enum/source/status values are bound to exact columns through check constraints.
- FK `ON DELETE` behavior is explicit everywhere.
- Required uniqueness constraints and indexes are present.
- `onboarding_invite_audit` remains untouched and coexistence/backfill mapping is documented.
- Migration notes include the required table-by-table reference, Supabase path, excluded Supabase features, and verification tier.
- Static validator passes in strict mode against the committed SQL.
- `git diff --check` passes.
- No secrets, tokens, service-role values, live provider credentials, or real client PII are committed.
- Bead closure must state the reached verification tier: `live-apply`, `syntactic-parse`, or `static-only`.

## Out of Scope

- Live GHL, Google, Supabase, email, or database provider mutation.
- Supabase Auth, RLS, Storage, Realtime, Vault, or service-role integration.
- Backfill from `onboarding_invite_audit`.
- Union views over scratch and durable audit tables.
- App helper modules such as `_ids.py` or `_redact.py`.
- Installing Postgres or parser dependencies in this session.

## Final Self-Assessment

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| Completeness | 10 | Covers all requested tables, IDs, enum bindings, compatibility, FKs, indexes, validator scope, Supabase path, and verification tiers. |
| Clarity | 9 | Separates source context, contracts, implementation order, and out-of-scope provider actions; remaining flexibility is limited to SQL syntax details. |
| Actionability | 10 | Provides exact paths, columns, constraints, indexes, commands, implementation order, and acceptance criteria. |
| Testability | 9 | Defines strict validator behavior and verification tiers; live database apply remains environment-dependent and is explicitly gated. |
| Safety | 10 | Preserves read-only/provider-mutation boundaries, forbids secrets and Supabase-specific assumptions, and requires honest verification reporting. |
| Total | 48/50 | Approved for implementation of the migration, notes, validator, and static verification. |

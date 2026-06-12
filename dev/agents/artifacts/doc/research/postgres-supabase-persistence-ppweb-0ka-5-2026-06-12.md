# Postgres-first persistence with Supabase migration path

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.5`
Date: 2026-06-12
Artifact status: current implementation note
Verification tier reached: `static-only`

## 1. Purpose

This note documents the portable Postgres persistence schema for the onboarding automation PoC and the path to later Supabase migration.

The migration lives at:

```text
dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
```

The validator lives at:

```text
dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py
```

This bead does not apply the migration to a database because the worktree environment has no `psql`, `pg_isready`, or `postgres` binary.

## 2. Source-of-truth model: GHL, app, schema

GHL remains the source of truth for appointment booking. The PatronPro app schema stores:

- Client/contact correlation data.
- Onboarding meeting snapshots and reschedule chains.
- Generated invite artifacts.
- Provider-specific calendar link/event references.
- Email previews.
- Send attempts and blocked attempts.
- Audit events for reconciliation and operator accountability.

The schema does not replace GHL ownership of appointment state. It stores GHL IDs and redacted source readback payloads so the app can compare, reconcile, and explain generated artifacts.

## 3. Table-by-table column reference

All IDs use app-generated `varchar(40)` values with the format `<prefix>_<ulid-like-token>`.

### `onboarding_clients`

Purpose: app-side client/contact record tied to GHL when available.

Columns:

- `id varchar(40)` primary key, prefix `cli_`.
- `ghl_contact_id text null`, unique nullable GHL contact ID.
- `display_name text null`.
- `email text null`.
- `phone text null`.
- `source_payload jsonb null`, redacted readback only.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.
- `deleted_at timestamptz null`.
- `anonymized_at timestamptz null`.

### `onboarding_meetings`

Purpose: meeting state snapshot or reschedule version.

Columns:

- `id varchar(40)` primary key, prefix `mtg_`.
- `client_id varchar(40)` references `onboarding_clients(id)` with `ON DELETE RESTRICT`.
- `ghl_appointment_id text null`, unique nullable GHL appointment ID.
- `meeting_source text` in `ghl`, `manual`, `system`.
- `status text` in `scheduled`, `rescheduled`, `cancelled`, `completed`, `no-show`, `blocked`.
- `scheduled_start_at timestamptz null`.
- `scheduled_end_at timestamptz null`.
- `timezone text null`.
- `replaced_by_id varchar(40) null` references `onboarding_meetings(id)` with `ON DELETE SET NULL`.
- `source_payload jsonb null`.
- `created_at`, `updated_at`, `deleted_at`, `anonymized_at`.

### `onboarding_calendar_invites`

Purpose: generated invite artifacts for a meeting.

Columns:

- `id varchar(40)` primary key, prefix `inv_`.
- `meeting_id varchar(40)` references `onboarding_meetings(id)` with `ON DELETE RESTRICT`.
- `invite_source text` in `calendar-link`, `google-calendar-api`, `manual`, `system`.
- `artifact_kind text` in `ics`, `google-calendar-event`, `calendar-url`, `manual-note`.
- `title text null`.
- `starts_at timestamptz null`.
- `ends_at timestamptz null`.
- `timezone text null`.
- `redacted_payload jsonb null`.
- `created_at`, `updated_at`.

### `onboarding_calendar_provider_links`

Purpose: provider-specific references derived from an invite.

Columns:

- `id varchar(40)` primary key, prefix `cpl_`.
- `invite_id varchar(40)` references `onboarding_calendar_invites(id)` with `ON DELETE CASCADE`.
- `provider text` in `google-calendar`, `calendar-link`, `manual`.
- `external_calendar_id text null`.
- `external_event_id text null`.
- `status text` in `active`, `disconnected`, `revoked`, `error`.
- `redacted_provider_payload jsonb null`.
- `created_at`, `updated_at`.

### `onboarding_email_previews`

Purpose: generated email preview content before send approval.

Columns:

- `id varchar(40)` primary key, prefix `eml_`.
- `meeting_id varchar(40)` references `onboarding_meetings(id)` with `ON DELETE RESTRICT`.
- `meeting_version_id varchar(40) null` references `onboarding_meetings(id)` with `ON DELETE SET NULL`.
- `subject text not null`.
- `body_text text not null`.
- `body_html text null`.
- `preview_status text` in `draft`, `approved`, `superseded`, `blocked`.
- `redacted_context jsonb null`.
- `created_at`, `updated_at`.

### `onboarding_send_attempts`

Purpose: durable record of provider send attempts without storing credentials.

Columns:

- `id varchar(40)` primary key, prefix `snd_`.
- `meeting_id varchar(40)` references `onboarding_meetings(id)` with `ON DELETE RESTRICT`.
- `invite_id varchar(40) null` references `onboarding_calendar_invites(id)` with `ON DELETE SET NULL`.
- `email_preview_id varchar(40) null` references `onboarding_email_previews(id)` with `ON DELETE SET NULL`.
- `attempt_no integer not null`.
- `run_mode text` in `dry-run`, `approved-live`.
- `status text` in `draft`, `queued`, `sent`, `failed`, `blocked`.
- `state_version integer not null default 0`.
- `provider text null` in `gmail`, `google-calendar`, `ghl`, `manual`, `system`.
- `redacted_request jsonb null`.
- `redacted_response jsonb null`.
- `error_code text null`.
- `error_message text null`.
- `created_at`, `updated_at`.

`approved-live` is representable for future auditability, but no live sends are implemented in this bead.

### `onboarding_audit_events`

Purpose: append-oriented audit trail.

Columns:

- `id varchar(40)` primary key, prefix `aud_`.
- `entity_type text` in `client`, `meeting`, `invite`, `provider_link`, `email_preview`, `send_attempt`.
- `entity_id varchar(40) not null`.
- `audit_source text` in `ghl`, `manual`, `system`, `google-calendar-api`.
- `event_type text not null`.
- `run_mode text null` in `dry-run`, `approved-live`.
- `message text null`.
- `redacted_payload jsonb null`.
- `created_at timestamptz not null default now()`.

Audit events intentionally do not use DB-level FKs because they are polymorphic and should stay readable across entity lifecycle changes.

## 4. FK graph with ON DELETE behavior

| Child table | Column | Parent | ON DELETE |
| --- | --- | --- | --- |
| `onboarding_meetings` | `client_id` | `onboarding_clients(id)` | `RESTRICT` |
| `onboarding_meetings` | `replaced_by_id` | `onboarding_meetings(id)` | `SET NULL` |
| `onboarding_calendar_invites` | `meeting_id` | `onboarding_meetings(id)` | `RESTRICT` |
| `onboarding_calendar_provider_links` | `invite_id` | `onboarding_calendar_invites(id)` | `CASCADE` |
| `onboarding_email_previews` | `meeting_id` | `onboarding_meetings(id)` | `RESTRICT` |
| `onboarding_email_previews` | `meeting_version_id` | `onboarding_meetings(id)` | `SET NULL` |
| `onboarding_send_attempts` | `meeting_id` | `onboarding_meetings(id)` | `RESTRICT` |
| `onboarding_send_attempts` | `invite_id` | `onboarding_calendar_invites(id)` | `SET NULL` |
| `onboarding_send_attempts` | `email_preview_id` | `onboarding_email_previews(id)` | `SET NULL` |

## 5. Uniqueness and index catalog

Unique constraints:

- `onboarding_clients_ghl_contact_id_unique` on `ghl_contact_id`.
- `onboarding_meetings_ghl_appointment_id_unique` on `ghl_appointment_id`.
- `onboarding_provider_links_invite_provider_calendar_unique` on `invite_id`, `provider`, `external_calendar_id`.
- `onboarding_send_attempts_meeting_attempt_unique` on `meeting_id`, `attempt_no`.

Indexes:

- `onboarding_clients_ghl_contact_id_idx`.
- `onboarding_meetings_client_id_idx`.
- `onboarding_meetings_ghl_appointment_id_idx`.
- `onboarding_meetings_scheduled_start_at_idx`.
- `onboarding_meetings_replaced_by_id_idx`.
- `onboarding_calendar_invites_meeting_id_idx`.
- `onboarding_provider_links_invite_id_idx`.
- `onboarding_provider_links_provider_calendar_idx`.
- `onboarding_email_previews_meeting_id_idx`.
- `onboarding_email_previews_meeting_version_id_idx`.
- `onboarding_email_previews_preview_status_idx`.
- `onboarding_send_attempts_meeting_id_idx`.
- `onboarding_send_attempts_invite_id_idx`.
- `onboarding_send_attempts_email_preview_id_idx`.
- `onboarding_send_attempts_run_mode_idx`.
- `onboarding_send_attempts_status_idx`.
- `onboarding_audit_events_entity_idx`.
- `onboarding_audit_events_audit_source_idx`.
- `onboarding_audit_events_event_type_idx`.
- `onboarding_audit_events_created_at_idx`.

## 6. Compatibility with `onboarding_invite_audit`

The `001_onboarding_invite_audit.sql` table remains unchanged. The `002` migration does not alter, drop, rename, backfill, or union it.

Future backfill mapping:

- Old invite-audit row ID maps to a new `aud_*` ID.
- Old invite/dry-run identifier maps to `entity_type='invite'` and a durable `inv_*` ID once one exists.
- Old source maps to `audit_source='system'` unless stronger source evidence exists.
- Old payload maps to `redacted_payload` after redaction review.

Until that future data migration, both tables coexist.

## 7. Local Postgres apply command

Run only against a disposable local Postgres database:

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
```

This session did not run the command because no Postgres client/server binary is installed in the worktree environment.

## 8. Supabase migration steps

Future Supabase path:

```bash
supabase migration new onboarding_persistence_core
# copy the SQL into the generated supabase/migrations/<timestamp>_onboarding_persistence_core.sql
supabase migration up
supabase db push --dry-run
```

After migrations are adopted, avoid remote Dashboard/Table Editor schema edits because they bypass migration history.

## 9. Explicitly excluded Supabase features

Excluded from this first migration:

- Supabase Auth schema assumptions.
- Row-level security policies.
- Storage buckets or storage policies.
- Realtime publications.
- Vault entries.
- Service-role values.
- Database-generated UUID defaults or extension dependency for IDs.

## 10. Known limitations and verification tier reached

Reached tier: `static-only`.

Commands run for this tier:

```bash
python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py --sql-path dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql --strict
git diff --check
```

Not run in this session:

- Local Postgres apply.
- Optional parser tier.
- Supabase CLI dry-run.
- Remote Supabase push.

The schema is designed to be portable, but a future environment with Postgres tooling should run the local apply command before any real Supabase migration.

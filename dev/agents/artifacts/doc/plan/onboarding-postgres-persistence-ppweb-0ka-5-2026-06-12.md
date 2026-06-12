# PRD: Postgres-first persistence with Supabase migration path

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.5`
Date: 2026-06-12
Status: Draft for quality loop

## Goal

Define and implement a portable Postgres persistence contract for the onboarding automation PoC while keeping a clean path to future Supabase deployment.

The schema must support clients, onboarding meetings, calendar invite artifacts, provider links, email previews, send attempts, and audit events. It must not depend on Supabase Auth, Supabase Storage, Realtime, Vault, service-role assumptions, or browser session state.

## Source Baseline

RLM/current project context:

- `ppweb-0ka.3` already added a narrow `onboarding_invite_audit` scratch table for the Monday panel dry-run API. That table should remain backward compatible but should not be treated as the full persistence model.
- RLM Supabase access pattern says current Supabase access is read-only unless the user explicitly approves writes. Do not use or store Supabase secrets.
- The epic requires local Postgres first and Supabase-compatible migrations later.

Official Supabase docs checked on 2026-06-12:

- Supabase database migrations guide: `https://supabase.com/docs/guides/deployment/database-migrations`
- Context7 Supabase CLI docs: `supabase migration new`, `supabase migration up`, `supabase db push --dry-run`, `supabase db reset`.

Important Supabase migration findings:

- Schema changes should live in migration SQL files.
- Remote Supabase schema should not be changed manually once migrations are in use.
- Local migration testing is expected before remote push.
- Remote deploy should use `supabase db push`; `--dry-run` can show pending migrations without applying them.

Environment finding:

- This worktree currently has no `psql`, `pg_isready`, or `postgres` binary available, so a true local Postgres apply test cannot run in this session without installing/provisioning Postgres.
- The implementation should still include the exact `psql` apply command and a static validator. Do not mark a live DB apply as completed unless a future environment provides `POSTGRES_URL` and `psql`.

## Deliverables

1. Portable SQL migration:
   - Path: `dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql`
   - Uses app-generated text IDs instead of Supabase-only auth IDs or extension-dependent UUID defaults.
   - Uses Postgres-native `jsonb`, `timestamptz`, foreign keys, check constraints, and indexes.
   - No `auth.*`, `storage.*`, `vault.*`, `supabase_realtime`, RLS policies, service role references, or secrets.

2. Migration notes:
   - Path: `dev/agents/artifacts/doc/research/postgres-supabase-persistence-ppweb-0ka-5-2026-06-12.md`
   - Documents table purpose, source-of-truth model, Supabase migration steps, local apply command, and limitations.

3. Static validator:
   - Path: `dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py`
   - Confirms the required tables, forbidden Supabase-specific assumptions, foreign keys, core indexes, source/status check constraints, and no obvious secret placeholders.

4. Optional sample apply command:
   - `psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql`
   - This command is documented but not run unless `psql` and a local test database are available.

## Table Contract

Required tables:

- `onboarding_clients`
- `onboarding_meetings`
- `onboarding_calendar_invites`
- `onboarding_calendar_provider_links`
- `onboarding_email_previews`
- `onboarding_send_attempts`
- `onboarding_audit_events`

Required event/source types:

- `ghl`
- `manual`
- `google-calendar-api`
- `calendar-link`
- `system`

Required run modes:

- `dry-run`
- `approved-live`

Required send statuses:

- `draft`
- `queued`
- `sent`
- `failed`
- `blocked`

## Relationship Model

- A client has many onboarding meetings.
- A meeting can have many invite artifacts.
- An invite can have many provider links.
- A meeting can have many email previews.
- Send attempts reference a meeting and optionally the specific invite/email preview used.
- Audit events can point at any entity by `entity_type` and `entity_id`.

GHL remains the source of truth for appointment booking. The schema stores GHL IDs and source readback payloads for reconciliation, not as replacement ownership.

## Safety Rules

- Never store OAuth tokens, refresh tokens, session cookies, API keys, service-role keys, raw Authorization headers, or browser localStorage.
- Redact request/response payloads before storing them in `jsonb` columns.
- Keep raw source payload columns optional and redacted.
- Do not enable Supabase RLS in this PoC migration. RLS should be a later Supabase-specific migration once auth tenancy is defined.
- Do not create storage buckets, realtime publications, auth triggers, or Supabase Vault entries.
- All live send/provider actions remain outside this bead.

## Verification Plan

Run:

```bash
python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py
git diff --check
```

If a local Postgres database is available:

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
```

For future Supabase:

```bash
supabase migration new onboarding_persistence_core
# copy the SQL into the generated supabase/migrations/<timestamp>_onboarding_persistence_core.sql
supabase migration up
supabase db push --dry-run
```

## Acceptance Criteria

- SQL migration defines all required persistence tables with portable Postgres constructs.
- Static validator passes.
- Documentation explains local Postgres apply, Supabase migration path, and why Supabase-specific auth/storage/RLS assumptions are excluded from this first migration.
- No secrets, tokens, service-role values, or real client PII are committed.
- Bead is closed only after artifacts are committed, pushed, and checkpointed in RLM.

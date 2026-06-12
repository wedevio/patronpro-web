# Merge: ppweb-0ka.5 Postgres persistence PRD

Input PRD: `dev/agents/artifacts/doc/plan/onboarding-postgres-persistence-ppweb-0ka-5-2026-06-12.md`
Mini review: `dev/agents/artifacts/doc/sages/onboarding-postgres-persistence-ppweb-0ka-5-20260612/sage-mini.md`
Mini score: 35/50

## MUST FIX

1. Split conflated enum/source terms and bind them to columns:
   - `meeting_source` on meetings: `ghl`, `manual`, `system`
   - `invite_source` on calendar invites: `calendar-link`, `google-calendar-api`, `manual`, `system`
   - `audit_source` on audit events: `ghl`, `manual`, `system`, `google-calendar-api`
   - `entity_type` on audit events: `client`, `meeting`, `invite`, `provider_link`, `email_preview`, `send_attempt`

2. Define app-generated ID format:
   - `<prefix>_<ulid-like-token>`
   - Prefixes: `cli`, `mtg`, `inv`, `cpl`, `eml`, `snd`, `aud`
   - Column type `varchar(40)` for all IDs.
   - SQL should enforce prefix shape with check constraints where practical.

3. Make `onboarding_invite_audit` compatibility explicit:
   - Do not alter, drop, or rename the `001` table.
   - `002` creates the durable schema in parallel.
   - Future backfill can map old rows into `onboarding_audit_events`; this bead only documents the mapping.

4. Specify FK delete behavior:
   - Audit-owned entities use `ON DELETE RESTRICT`.
   - Derived provider links can use `ON DELETE CASCADE` from invite.
   - Optional references from send attempts use `ON DELETE SET NULL`.
   - Audit events use polymorphic `entity_type`/`entity_id` without DB-level FK.

5. Bind run modes/statuses to exact columns:
   - `onboarding_send_attempts.run_mode`
   - `onboarding_send_attempts.status`
   - `onboarding_calendar_provider_links.status`
   - `onboarding_meetings.status`

6. Add uniqueness and indexes:
   - Unique nullable GHL contact/external IDs where needed.
   - Unique provider link by `(invite_id, provider, external_calendar_id)`.
   - Unique send attempt by `(meeting_id, attempt_no)`.
   - Index all FK columns and audit lookup `(entity_type, entity_id)`.

7. Make validator scope precise:
   - Required table presence.
   - Forbidden Supabase-specific assumptions.
   - Forbidden secret/token-like column names and literals.
   - Required `varchar(40)` IDs, `timestamptz`, `jsonb`, FK `ON DELETE`, indexes, and check constraints.
   - `--sql-path` and `--strict`.

8. Add verification tier honesty:
   - Record `static-only` in this session because no `psql`, `pg_isready`, or `postgres` binary exists.
   - Document the exact command for future local Postgres apply.
   - Do not claim local apply unless it actually runs.

## SHOULD FIX

1. Include soft-delete/anonymization posture with `deleted_at` and optional `anonymized_at`.
2. Include reschedule chain support with `replaced_by_id` on meetings.
3. Mention app-side redaction helper as future work, but do not create a separate helper in this bead.
4. Include a table-by-table column reference in the migration notes.
5. Include Supabase readiness checklist: no auth, no storage, no vault, no realtime, no extension dependency, no remote manual edits.

## NOT FIXING

1. Do not add `_ids.py` or `_redact.py` in this bead. The migration can document the ID/redaction contract and the validator can reject obvious unsafe SQL; app helper modules are a later implementation slice.
2. Do not install `pglast` or provision Postgres in this session. The environment lacks Postgres tooling and this bead should not hide that. Use static validation and record the tier.
3. Do not backfill or union `onboarding_invite_audit` yet. That would be a data migration after the durable schema is accepted.

## Approval Target

CE merge must produce an improved PRD scored at least 46/50, ready for implementation of the SQL migration, validator, research/migration note, and static verification.

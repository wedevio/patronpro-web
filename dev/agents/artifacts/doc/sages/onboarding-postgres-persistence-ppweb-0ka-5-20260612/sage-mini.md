## Sage: MiniMax (Depth & Rigor)

### Score: 35/50

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Completeness | 7/10 | PRD covers 7 tables, enums, safety, but the actual column-level contract (types, lengths, defaults, nullability) is deferred to a SQL file not in scope of this review. Relationship to `onboarding_invite_audit` (ppweb-0ka.3) is left underspecified. |
| Clarity | 7/10 | The "Required event/source types" bucket mixes sources (`ghl`, `manual`), invite sources (`google-calendar-api`, `calendar-link`), and event types (`system`) without assigning each to a column. "App-generated text IDs" is directionally correct but says nothing about format/prefix/length, which materially affects index size and validator coverage. |
| Actionability | 6/10 | The document tells you *what* to build and *where* to put it, but several decisions are left to the implementer (CASCADE rules, uniqueness, ON CONFLICT targets, ID format, soft vs. hard delete, entity_type check values). |
| Testability | 6/10 | A static validator is mandated, but the PRD never defines its positive/negative test cases or the failure messages. Live psql apply is unreachable in this worktree; the PRD acknowledges this but Acceptance Criteria don't downgrade the bead for it. |
| Safety | 9/10 | Strong, explicit guardrails. No auth/storage/RLS/Vault/realtime. Redaction is mandated. The only gap is absence of a destructive-rollback clause (no `DROP` documented for re-runs). |

### Strengths (keep these)

- **Source-of-truth boundary is explicit and well-placed.** "GHL remains the source of truth for appointment booking. The schema stores GHL IDs and source readback payloads for reconciliation, not as replacement ownership." This is the right architectural call and is stated clearly.
- **Supabase migration path is staged correctly.** `migration new` → copy SQL into timestamped file → `migration up` → `db push --dry-run` is the canonical sequence; the PRD recommends testing locally first. The constraint "do not mark a live DB apply as completed unless `POSTGRES_URL` and `psql` exist" is rigorous and prevents false-positive bead closure.
- **Naming convention is portable and honest.** Prefixed `onboarding_*` table names avoid collisions with future Supabase auth/storage tables and make the migration trivial to lift into a Supabase project.
- **Migration filename `002_…`** implicitly acknowledges the `001_…` audit table from ppweb-0ka.3, preserving chain-of-custody.
- **Safety rules are concrete and falsifiable.** "Never store OAuth tokens, refresh tokens, session cookies, API keys, service-role keys, raw Authorization headers, or browser localStorage" — this is a checklist the validator can mechanically enforce.
- **"No Supabase auth/storage assumptions"** is reinforced in *three* places (Goal, Deliverables, Safety), which signals it is a real boundary, not a platitude.

### Logical Issues

| Issue | Severity | Section | Why It's Wrong | Fix |
|-------|----------|---------|----------------|-----|
| "Required event/source types" conflates three different semantic categories | High | Table Contract → Required event/source types | `ghl` and `manual` are *event sources* (who did it), `google-calendar-api` and `calendar-link` are *invite generation sources* (how the invite was created), and `system` is a *trigger* (e.g., for `run_mode` or `event_type`). Bundling them into one bullet means a downstream column enum is forced to be a union, which is a normalization smell and will leak into the validator. | Split into three named lists: `event_source ∈ {ghl, manual, system}`, `invite_source ∈ {google-calendar-api, calendar-link, system}`, and explicitly attach each list to a specific column. |
| "App-generated text IDs" is undefined | High | Deliverables #1 | Without a defined format (length, character set, optional prefix), the validator cannot bound-check ID column sizes, and the schema risks either `text` (no max) or arbitrary `varchar(N)` guesses. A client ID like `cli_01H8…` is 30+ chars; if the column is `varchar(32)` it fails silently in app code. | Specify a concrete format: e.g., `prefix_ulid` where ULID is 26 chars and prefix is 3–4 chars, total ≤ 36; column type `varchar(40)`. Document the generator. |
| Backward compatibility with `onboarding_invite_audit` is asserted but the contract is missing | High | Source Baseline; Table Contract | The PRD says the ppweb-0ka.3 scratch table "should remain backward compatible" but the new `onboarding_audit_events` table is the natural successor. Without a `DROP`/rename/`INSERT … SELECT` migration step or a coexistence rule, the implementer must guess whether the old table stays, is renamed, or is backfilled. | Add a "Migration from ppweb-0ka.3" subsection specifying: keep `onboarding_invite_audit` as-is, add `onboarding_audit_events`, and define a mapping (`entity_type='invite'` etc.) for future backfill. |
| No ON DELETE behavior specified for foreign keys | High | Relationship Model; Table Contract | `onboarding_meetings.client_id → onboarding_clients.id` — what happens when a client is deleted? Without `ON DELETE` clauses, Postgres defaults to `NO ACTION` and deletes will fail loudly. The PRD does not state whether deletion is even permitted in the PoC. | Add an explicit rule: "All FKs use `ON DELETE RESTRICT` for entities under audit; soft-delete is handled via a `deleted_at timestamptz` column on `onboarding_clients` and `onboarding_meetings`." |
| Run modes and send statuses are not bound to columns | Medium | Table Contract → Required run modes; Required send statuses | `dry-run`/`approved-live` and `draft`/`queued`/`sent`/`failed`/`blocked` are listed but never assigned to columns. A new contributor cannot write the SQL or the validator from the PRD alone. | State: `onboarding_send_attempts.run_mode text NOT NULL CHECK (run_mode IN ('dry-run','approved-live'))` and `…status text NOT NULL CHECK (status IN ('draft','queued','sent','failed','blocked'))`. |
| "Optional sample apply command" undermines verification rigor | Medium | Deliverables #4; Verification Plan | The PRD simultaneously says the apply command "is documented but not run" and Acceptance Criteria require the bead be closed only after artifacts are committed — but the validator cannot prove the SQL is *executable*. A syntax error in the migration can pass the static validator and break in production. | Add a third validator check: spawn `psql --no-psqlrc -c '\set ON_ERROR_STOP on' --single-transaction -f …` against a Docker ephemeral Postgres when available, falling back to `sqlfluff parse` or `pg_query_go` syntactic parse as a last resort. |
| `entity_type` is an unconstrained string | Medium | Relationship Model; Table Contract | "Audit events can point at any entity by `entity_type` and `entity_id`" — `entity_type` should be a `CHECK` over the seven known entity types, otherwise typos (`'clinet'`) silently break audit joins. | Add `CHECK (entity_type IN ('client','meeting','invite','provider_link','email_preview','send_attempt','audit_event'))`. |
| No uniqueness constraints described | Medium | Table Contract | A client should be unique by `ghl_contact_id`; a provider link should be unique by `(meeting_id, provider, external_calendar_id)`; a send attempt might be unique by `(meeting_id, attempt_no)`. Without these, the table allows logically impossible duplicates. | Add a "Uniqueness constraints" subsection with explicit `UNIQUE (…)` declarations per table. |
| Indexes on FK columns are implied but not listed | Medium | Deliverables #1; Table Contract | Postgres does not auto-index FK columns. Without explicit indexes on every FK, the audit-event lookup pattern (`entity_type, entity_id`) and provider-link lookup will seq-scan. | Add an "Indexes" subsection enumerating `(entity_type, entity_id)`, `(client_id)`, `(meeting_id)` on every child table. |
| "Redact request/response payloads before storing them in `jsonb` columns" is unenforced | Low | Safety Rules | The redaction is a policy, not a constraint. JSONB columns are opaque; an unredacted token can land in `payload jsonb` and the validator cannot detect it. | Require a redaction helper module (e.g., `_redact.py` referenced by the migration notes) and forbid `text` columns named `*_token`, `*_secret`, `authorization`. Add a regex check in the validator. |
| No rollback / re-run strategy | Low | Deliverables #1 | Postgres migrations are not idempotent by default. If the validator is re-run after a partial apply, the migration will fail with "relation already exists". | Use `CREATE TABLE IF NOT EXISTS` (acceptable for PoC) or document that the migration is single-shot and any re-run requires a manual `DROP SCHEMA … CASCADE` in a dev DB. |

### Missing Edge Cases

| Edge Case | Impact | Where to Add | Suggested Implementation |
|-----------|--------|--------------|-------------------------|
| Reschedule of a meeting: update vs. new row + audit event | Two valid patterns; the schema must support both. Without `version int` or a `replaced_by` self-FK, history is lost. | Relationship Model → meetings | Add `replaced_by_id text NULL REFERENCES onboarding_meetings(id)` and an audit event on reschedule. |
| Soft delete / GDPR right-to-erasure | Client requests deletion; we need to null PII while keeping FK-referenced rows valid. | Safety Rules | Add `deleted_at timestamptz NULL` to `onboarding_clients` and `onboarding_meetings`; document an "anonymize" procedure that overwrites PII columns. |
| ID collision with app-generated text IDs | If the generator is monotonic but the validator allows arbitrary 32-char strings, a typo can shadow a real ID. | Deliverables #1 | Validator should regex-check ID format, e.g., `^[a-z]{3,4}_[0-9A-HJKMNP-TV-Z]{26}$` (ULID charset). |
| `timestamptz` storage but local-time display | `timestamptz` is stored as UTC; the application must convert. The PRD says nothing. | Table Contract | Add a note: "All `timestamptz` columns store UTC; UI must convert with the client's IANA zone." |
| Concurrent update of an `onboarding_send_attempts` row from `draft` → `sent` | Two workers could double-send. | Table Contract → send_attempts | Add a `state_version int NOT NULL DEFAULT 0` and an `UPDATE … WHERE id = ? AND state_version = ?` convention, or a partial unique index `(meeting_id) WHERE status = 'queued'`. |
| Empty GHL contact (e.g., lead form never finished) | `onboarding_clients.ghl_contact_id` may be NULL or empty string. | Table Contract | Make `ghl_contact_id` `NULL`-able; add `CHECK (ghl_contact_id IS NULL OR length(ghl_contact_id) > 0)`. |
| Provider link to a calendar the user later disconnects | `onboarding_calendar_provider_links.status` should reflect disconnection. | Table Contract | Add `status text NOT NULL CHECK (status IN ('active','disconnected','revoked','error'))`. |
| Email preview generated for a meeting that was rescheduled 3 times | Which meeting version does the preview point to? | Relationship Model → email_previews | Add `meeting_version int` or use the `replaced_by_id` chain to pin. |
| `validate_onboarding_persistence_sql.py` run against a stale SQL file | Validator silently passes an old version. | Verification Plan | Have the script read a `_version` constant from the SQL header and assert it matches the beaded version (`ppweb-0ka.5`). |
| `supabase db push --dry-run` against a project with RLS already enabled by another team | The dry-run will pass but apply will fail on `auth.uid()` references — N/A here, but future Supabase RLS migration could fail silently. | Migration notes | Add a "Pre-flight checklist" in the migration notes: confirm Supabase project RLS state, confirm no `auth` schema collisions, confirm extension list. |

### Concrete Improvements

1. **Split the "event/source types" list into three enumerated sets** (Section: Table Contract → Required event/source types)
   CURRENT:
   > Required event/source types:
   > - `ghl`
   > - `manual`
   > - `google-calendar-api`
   > - `calendar-link`
   > - `system`
   PROPOSED:
   > Required enums (bound to specific columns — see "Column-level contract" in the migration notes):
   >
   > - `event_source` on `onboarding_audit_events.source`: `('ghl','manual','system')`
   > - `invite_source` on `onboarding_calendar_invites.source`: `('google-calendar-api','calendar-link','system')`
   > - `entity_type` on `onboarding_audit_events.entity_type`: `('client','meeting','invite','provider_link','email_preview','send_attempt')`

2. **Add a backward-compatibility clause for `onboarding_invite_audit`** (Section: Source Baseline)
   CURRENT:
   > `ppweb-0ka.3` already added a narrow `onboarding_invite_audit` scratch table for the Monday panel dry-run API. That table should remain backward compatible but should not be treated as the full persistence model.
   PROPOSED:
   > `ppweb-0ka.3` already added a narrow `onboarding_invite_audit` scratch table for the Monday panel dry-run API. This bead does **not** alter or drop that table. The new `onboarding_audit_events` table is a parallel, broader contract; a future bead (`ppweb-0ka.6+`) may backfill `onboarding_invite_audit` rows into `onboarding_audit_events` with `entity_type='invite'` and `source='system'`, and then rename the old table. Until that happens, both tables coexist; reads must union them.

3. **Make the ID format explicit** (Section: Deliverables #1)
   CURRENT:
   > Uses app-generated text IDs instead of Supabase-only auth IDs or extension-dependent UUID defaults.
   PROPOSED:
   > Uses app-generated text IDs with the format `<prefix>_<ulid>`, where the prefix is one of `cli`, `mtg`, `inv`, `cpl`, `eml`, `snd`, `aud` matching the table name, and the ULID is 26 Crockford-base32 characters. All ID columns are `varchar(40) NOT NULL` and PRIMARY KEYs of their tables. The generator is implemented in `dev/agents/artifacts/script/onboarding-automation/_ids.py` (separate bead).

4. **Add explicit ON DELETE behavior and uniqueness rules** (Section: Relationship Model)
   CURRENT:
   > - A client has many onboarding meetings.
   > - A meeting can have many invite artifacts.
   > - An invite can have many provider links.
   > - A meeting can have many email previews.
   > - Send attempts reference a meeting and optionally the specific invite/email preview used.
   > - Audit events can point at any entity by `entity_type` and `entity_id`.
   PROPOSED:
   > Cardinality and constraints:
   > - `onboarding_meetings.client_id` → `onboarding_clients.id` ON DELETE RESTRICT.
   > - `onboarding_calendar_invites.meeting_id` → `onboarding_meetings.id` ON DELETE RESTRICT.
   > - `onboarding_calendar_provider_links.invite_id` → `onboarding_calendar_invites.id` ON DELETE CASCADE (provider links are derived artifacts of an invite).
   > - `onboarding_email_previews.meeting_id` → `onboarding_meetings.id` ON DELETE RESTRICT.
   > - `onboarding_send_attempts.meeting_id` → `onboarding_meetings.id` ON DELETE RESTRICT, with `invite_id` and `email_preview_id` nullable ON DELETE SET NULL.
   > - `onboarding_audit_events` FKs are advisory only (entity_type + entity_id, no DB-level FK to keep the audit table append-only across entity lifetimes).
   >
   > Uniqueness:
   > - `onboarding_clients.ghl_contact_id` UNIQUE NULLS DISTINCT.
   > - `onboarding_calendar_provider_links(invite_id, provider, external_calendar_id)` UNIQUE.
   > - `onboarding_send_attempts(meeting_id, attempt_no)` UNIQUE.

5. **Add a "Live apply or fall back" tier to the Verification Plan** (Section: Verification Plan)
   CURRENT:
   > If a local Postgres database is available:
   > ```bash
   > psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
   > ```
   PROPOSED:
   > If a local Postgres database is available:
   > ```bash
   > psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql
   > ```
   > If `psql` is unavailable, run a **syntactic** check via `pip install pglast` and:
   > ```bash
   > python3 -c "import pglast, sys; pglast.parse_sql(open('dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql').read()); print('parse ok')"
   > ```
   > The bead must record which tier was reached (live apply / syntactic parse / static-validator-only) in the closure comment.

6. **Tighten Safety Rules with mechanical checks** (Section: Safety Rules)
   CURRENT:
   > - Never store OAuth tokens, refresh tokens, session cookies, API keys, service-role keys, raw Authorization headers, or browser localStorage.
   > - Redact request/response payloads before storing them in `jsonb` columns.
   PROPOSED:
   > - Never store OAuth tokens, refresh tokens, session cookies, API keys, service-role keys, raw Authorization headers, or browser localStorage.
   > - Redact request/response payloads before storing them in `jsonb` columns. The redaction helper is `dev/agents/artifacts/script/onboarding-automation/_redact.py` (separate bead).
   > - The static validator MUST fail (exit code 1) on any of:
   >   - column name matching `/(token|secret|api_?key|authorization|password|cookie)/i`,
   >   - string literal in the SQL matching a JWT shape `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`,
   >   - string literal matching `sk_(test|live)_[A-Za-z0-9]{16,}` (Stripe-style),
   >   - string literal matching `Bearer [A-Za-z0-9._-]{20,}`.

7. **Add a "Migration from ppweb-0ka.3" subsection to the Deliverables** (Section: Deliverables #2 — migration notes path)
   CURRENT: *(none — only a path is listed)*
   PROPOSED:
   > The migration notes file MUST contain the following sections, in this order:
   > 1. Purpose
   > 2. Source-of-truth model (GHL, app, schema)
   > 3. Table-by-table column reference (types, defaults, nullability, CHECK constraints)
   > 4. FK graph (visual or table form) with ON DELETE behavior
   > 5. Uniqueness and index catalog
   > 6. Compatibility with `onboarding_invite_audit` (ppweb-0ka.3)
   > 7. Local Postgres apply command
   > 8. Supabase migration steps (`migration new` → copy → `migration up` → `db push --dry-run`)
   > 9. Explicitly excluded Supabase features (auth, storage, vault, RLS, realtime)
   > 10. Known limitations (no live apply in current worktree; no RLS; no soft-delete beyond `deleted_at`)

8. **Make the static validator surface testable** (Section: Verification Plan)
   CURRENT:
   > Run:
   > ```bash
   > python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py
   > ```
   PROPOSED:
   > Run:
   > ```bash
   > python3 dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py
   > ```
   > The validator MUST exit `0` on success and `1` on any failure, with a one-line diagnostic per failure. It MUST accept a `--sql-path` flag for CI use and a `--strict` flag that promotes warnings (e.g., missing optional indexes) to errors.

### Implementation Correctness

Because the actual SQL body is in a sibling file (`dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql`) not provided to this reviewer, I cannot verify BEFORE/AFTER code blocks or `FILE:LINE` references directly. The following are the **verifications I will run in the merge pass** when the SQL is in hand:

1. **Verify table presence.** For each of the 7 required tables, confirm a `CREATE TABLE` statement with the exact name (`onboarding_clients`, `onboarding_meetings`, `onboarding_calendar_invites`, `onboarding_calendar_provider_links`, `onboarding_email_previews`, `onboarding_send_attempts`, `onboarding_audit_events`). Grep: `^CREATE TABLE onboarding_(clients|meetings|calendar_invites|calendar_provider_links|email_previews|send_attempts|audit_events)`.

2. **Verify zero Supabase leakage.** Grep the SQL file for the regex `\b(auth|storage|supabase_realtime|vault|service_role|auth\.uid|current_setting\('role'\))\b`; the validator should fail if any match occurs in uncommented lines. (Comments may mention these by name to *exclude* them — they must be flagged for human review.)

3. **Verify ID columns are `varchar(40) NOT NULL` and PRIMARY KEYs.** Grep `PRIMARY KEY` and confirm each table has exactly one PK and it is a `text`/`varchar` column, not a `uuid` with a `gen_random_uuid()` default.

4. **Verify CHECK constraints cover the enums.** Grep `CHECK` and confirm the literal sets for `event_source`, `invite_source`, `entity_type`, `run_mode`, `status`, and `send_status` match the PRD lists exactly.

5. **Verify FK ON DELETE clauses.** Grep `REFERENCES` and confirm every FK is followed by `ON DELETE` (RESTRICT, CASCADE, or SET NULL) — no bare `REFERENCES` allowed.

6. **Verify index coverage on FKs.** For every FK column, an `INDEX` or `UNIQUE` must exist on the same column (or a leading-column composite). The validator should detect and warn.

7. **Verify `timestamptz` (not `timestamp`) usage.** Grep should find zero occurrences of `timestamp ` (with trailing space) and positive occurrences of `timestamptz`.

8. **Verify `jsonb` (not `json`) usage.** Same pattern.

9. **Verify the sample apply command matches the file path exactly.** `psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f dev/agents/artifacts/config/onboarding-automation/postgres/002_onboarding_persistence_core.sql` must reference the real path.

10. **Verify the validator script can be invoked headless.** `python3 -c "import ast; ast.parse(open('dev/agents/artifacts/script/onboarding-automation/validate_onboarding_persistence_sql.py').read())"` should pass; then a dry-run with the real SQL.

### Dependency & Ordering Issues

1. **`_ids.py` and `_redact.py` are unaccounted-for prerequisites.** The proposed ID format and redaction helper (Improvements #3 and #6) are referenced but not in the Deliverables list. Either they are out of scope and the PRD should say so, or they should be added as a `ppweb-0ka.5.1` sub-bead before the validator can be written. Current ordering is ambiguous.

2. **The validator must exist before the SQL can be validated, but the deliverables list both as parallel artifacts.** If the SQL is written first, the validator is reverse-engineered; if the validator is written first, the SQL may not satisfy it. Recommend an explicit ordering: (a) write migration notes with the column contract, (b) write the SQL, (c) write the validator against the contract, (d) iterate.

3. **ppweb-0ka.3 (`onboarding_invite_audit`) is a hard prerequisite for the migration to be chainable.** The PRD names it but does not require the implementer to verify the `001_…` migration's column types before writing `002_…`. If `001_` used `uuid` PKs and `002_` uses `varchar(40)` PKs, the audit-event union view proposed in the docs will fail. Add: "Confirm `001_onboarding_invite_audit.sql` exists in this directory and its schema is recorded in the migration notes."

4. **Supabase migration step is downstream of unverified live apply.** The PRD says the Supabase path is "future" but does not gate it. Recommend a check in the migration notes: a "Supabase readiness" checkbox list (no `auth.*`, no `storage.*`, no extensions required, no `gen_random_uuid()` default, no `pgcrypto` dependency).

5. **Bead closure criterion is too soft.** "Bead is closed only after artifacts are committed, pushed, and checkpointed in RLM" is true of every bead. The acceptance criterion should add: "and the static validator exits 0 against the committed SQL, and a tier indicator (live / syntactic / static-only) is recorded in the bead closure comment."

---

**Merge-pass input:** the seven high-severity logical issues (event/source enum split, ID format, backward compatibility, ON DELETE behavior, enum-to-column binding, apply-tier honesty, entity_type CHECK) are the load-bearing items. The other items are quality-of-life improvements that can ship in a follow-up bead without blocking `ppweb-0ka.5` closure, *provided* the static validator enforces them as warnings rather than errors in v1.

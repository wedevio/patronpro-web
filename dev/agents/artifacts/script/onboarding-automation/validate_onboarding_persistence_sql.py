#!/usr/bin/env python3
"""Static validator for the ppweb-0ka.5 onboarding persistence SQL."""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path
from typing import Iterable


DEFAULT_SQL_PATH = (
    Path(__file__).resolve().parents[2]
    / "config"
    / "onboarding-automation"
    / "postgres"
    / "002_onboarding_persistence_core.sql"
)

TABLE_PREFIXES = {
    "onboarding_clients": "cli",
    "onboarding_meetings": "mtg",
    "onboarding_calendar_invites": "inv",
    "onboarding_calendar_provider_links": "cpl",
    "onboarding_email_previews": "eml",
    "onboarding_send_attempts": "snd",
    "onboarding_audit_events": "aud",
}

REQUIRED_INDEXES = [
    "onboarding_clients_ghl_contact_id_idx",
    "onboarding_meetings_client_id_idx",
    "onboarding_meetings_ghl_appointment_id_idx",
    "onboarding_meetings_scheduled_start_at_idx",
    "onboarding_meetings_replaced_by_id_idx",
    "onboarding_calendar_invites_meeting_id_idx",
    "onboarding_provider_links_invite_id_idx",
    "onboarding_provider_links_provider_calendar_idx",
    "onboarding_email_previews_meeting_id_idx",
    "onboarding_email_previews_meeting_version_id_idx",
    "onboarding_email_previews_preview_status_idx",
    "onboarding_send_attempts_meeting_id_idx",
    "onboarding_send_attempts_invite_id_idx",
    "onboarding_send_attempts_email_preview_id_idx",
    "onboarding_send_attempts_run_mode_idx",
    "onboarding_send_attempts_status_idx",
    "onboarding_audit_events_entity_idx",
    "onboarding_audit_events_audit_source_idx",
    "onboarding_audit_events_event_type_idx",
    "onboarding_audit_events_created_at_idx",
]

REQUIRED_SNIPPETS = [
    "meeting_source in ('ghl', 'manual', 'system')",
    "invite_source in ('calendar-link', 'google-calendar-api', 'manual', 'system')",
    "audit_source in ('ghl', 'manual', 'system', 'google-calendar-api')",
    "entity_type in ('client', 'meeting', 'invite', 'provider_link', 'email_preview', 'send_attempt')",
    "run_mode in ('dry-run', 'approved-live')",
    "status in ('draft', 'queued', 'sent', 'failed', 'blocked')",
    "provider in ('google-calendar', 'calendar-link', 'manual')",
    "status in ('active', 'disconnected', 'revoked', 'error')",
    "status in ('scheduled', 'rescheduled', 'cancelled', 'completed', 'no-show', 'blocked')",
    "preview_status in ('draft', 'approved', 'superseded', 'blocked')",
    "provider in ('gmail', 'google-calendar', 'ghl', 'manual', 'system')",
]

REQUIRED_UNIQUES = [
    "onboarding_clients_ghl_contact_id_unique unique (ghl_contact_id)",
    "onboarding_meetings_ghl_appointment_id_unique unique (ghl_appointment_id)",
    "onboarding_provider_links_invite_provider_calendar_unique unique",
    "onboarding_send_attempts_meeting_attempt_unique unique (meeting_id, attempt_no)",
]

FORBIDDEN_PATTERNS = [
    (r"\bauth\.", "Supabase auth schema reference is excluded from this migration"),
    (r"\bstorage\.", "Supabase storage schema reference is excluded from this migration"),
    (r"\bvault\.", "Supabase vault schema reference is excluded from this migration"),
    (r"\bsupabase_realtime\b", "Supabase realtime reference is excluded from this migration"),
    (r"\bauth\.uid\b", "Supabase auth.uid reference is excluded from this migration"),
    (r"\bservice_role\b", "service-role references are forbidden"),
    (r"\benable\s+row\s+level\s+security\b", "RLS is excluded from this first PoC migration"),
    (r"\bcreate\s+policy\b", "RLS policies are excluded from this first PoC migration"),
    (r"\buuid\b", "UUID ID columns/defaults are excluded from this first PoC migration"),
    (r"\bgen_random_uuid\s*\(", "extension-provided UUID defaults are excluded"),
    (r"\buuid_generate_v4\s*\(", "extension-provided UUID defaults are excluded"),
    (r"\b(token|secret|api_?key|authorization|password|cookie)\b", "secret-like SQL identifier/literal found"),
    (r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "JWT-shaped literal found"),
    (r"Bearer\s+[A-Za-z0-9._-]{20,}", "Bearer credential-shaped literal found"),
    (r"sk_(test|live)_[A-Za-z0-9]{16,}", "provider-secret-shaped literal found"),
]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate onboarding persistence SQL contract.")
    parser.add_argument("--sql-path", default=str(DEFAULT_SQL_PATH))
    parser.add_argument("--strict", action="store_true", help="Promote optional validator warnings where applicable.")
    return parser.parse_args(argv)


def strip_line_comments(sql: str) -> str:
    return "\n".join(line.split("--", 1)[0] for line in sql.splitlines())


def compact(sql: str) -> str:
    return re.sub(r"\s+", " ", sql.lower()).strip()


def table_block(sql: str, table_name: str) -> str | None:
    match = re.search(
        rf"create\s+table\s+if\s+not\s+exists\s+{re.escape(table_name)}\s*\((.*?)\n\);",
        sql,
        re.IGNORECASE | re.DOTALL,
    )
    return match.group(1) if match else None


def add_failure(failures: list[str], message: str) -> None:
    failures.append(f"FAIL: {message}")


def add_warning(warnings: list[str], message: str) -> None:
    warnings.append(f"WARN: {message}")


def check_required_tables(sql: str, failures: list[str]) -> None:
    for table, prefix in TABLE_PREFIXES.items():
        block = table_block(sql, table)
        if block is None:
            add_failure(failures, f"missing table {table}")
            continue
        if not re.search(r"\bid\s+varchar\(40\)\s+primary\s+key\b", block, re.IGNORECASE):
            add_failure(failures, f"{table}.id must be varchar(40) primary key")
        if f"^{prefix}_" not in block:
            add_failure(failures, f"{table}.id must enforce {prefix}_ prefix")


def check_required_snippets(normalized: str, failures: list[str]) -> None:
    for snippet in REQUIRED_SNIPPETS:
        if compact(snippet) not in normalized:
            add_failure(failures, f"missing constraint snippet: {snippet}")
    for unique in REQUIRED_UNIQUES:
        if compact(unique) not in normalized:
            add_failure(failures, f"missing uniqueness constraint: {unique}")


def check_indexes(normalized: str, failures: list[str]) -> None:
    for index_name in REQUIRED_INDEXES:
        if index_name not in normalized:
            add_failure(failures, f"missing index {index_name}")


def check_foreign_keys(sql: str, failures: list[str]) -> None:
    for line_no, line in enumerate(sql.splitlines(), start=1):
        if " references " not in line.lower():
            continue
        if " on delete " not in line.lower():
            add_failure(failures, f"line {line_no}: FK is missing explicit ON DELETE behavior")


def check_forbidden_patterns(sql: str, failures: list[str]) -> None:
    for pattern, message in FORBIDDEN_PATTERNS:
        if re.search(pattern, sql, re.IGNORECASE):
            add_failure(failures, message)
    if re.search(r"\btimestamp\b", sql, re.IGNORECASE):
        add_failure(failures, "use timestamptz, not bare timestamp")
    if re.search(r"\bjson\b", sql, re.IGNORECASE):
        add_failure(failures, "use jsonb, not json")


def check_artifact_versions(sql: str, failures: list[str]) -> None:
    if "ppweb-0ka.5 onboarding persistence core" not in sql:
        add_failure(failures, "SQL header must identify ppweb-0ka.5")
    if "verification_tier_expected: static-only" not in sql:
        add_failure(failures, "SQL header must record expected verification tier")


def check_tooling_warnings(warnings: list[str]) -> None:
    if shutil.which("psql") is None:
        add_warning(warnings, "psql unavailable; verification tier is static-only unless another parser is used")
    try:
        __import__("pglast")
    except ImportError:
        add_warning(warnings, "pglast unavailable; no optional SQL parser tier was run")


def print_lines(lines: Iterable[str]) -> None:
    for line in lines:
        print(line)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    sql_path = Path(args.sql_path)
    if not sql_path.exists():
        print(f"FAIL: SQL file not found: {sql_path}")
        return 1

    raw_sql = sql_path.read_text(encoding="utf-8")
    executable_sql = strip_line_comments(raw_sql)
    normalized = compact(executable_sql)

    failures: list[str] = []
    warnings: list[str] = []

    check_artifact_versions(raw_sql, failures)
    check_required_tables(executable_sql, failures)
    check_required_snippets(normalized, failures)
    check_indexes(normalized, failures)
    check_foreign_keys(executable_sql, failures)
    check_forbidden_patterns(executable_sql, failures)
    check_tooling_warnings(warnings)

    if failures:
        print_lines(failures)
        print_lines(warnings)
        return 1

    print_lines(warnings)
    print("PASS: onboarding persistence SQL static validation passed")
    print("verification_tier=static-only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

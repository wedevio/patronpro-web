#!/usr/bin/env python3
"""Dry-run Google Calendar event payload builder for PatronPro onboarding.

This script intentionally does not call Google APIs. It emits the request shape
that a future, approved live adapter would send to events.insert.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Mapping, Sequence
from urllib.parse import quote
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


CONFIRMATION_ENV_VAR = "PATRONPRO_GOOGLE_MEET_LIVE_TOKEN"
PLACEHOLDER_REQUEST_IDS = {
    "fresh-unique-request-id",
    "REPLACE_BEFORE_LIVE_USE",
    "GENERATED_UUID_V4_AT_LIVE_EXECUTION_BOUNDARY",
}
SEND_UPDATES_VALUES = ("none", "all", "externalOnly")
CONFERENCE_DATA_VERSION = 1
DRY_RUN_PREFIX = "dryrun_ppweb_0ka_4"


class ContractError(ValueError):
    """Raised when a local safety or payload contract is violated."""


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a dry-run Google Calendar events.insert request for PatronPro onboarding."
    )
    parser.add_argument("--calendar-id", default="primary")
    parser.add_argument("--summary", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--start", required=True, help="Offset-aware ISO datetime, e.g. 2026-06-15T10:00:00-06:00")
    parser.add_argument("--end", required=True, help="Offset-aware ISO datetime, e.g. 2026-06-15T11:00:00-06:00")
    parser.add_argument("--timezone", required=True, help="IANA timezone, e.g. America/Mexico_City")
    parser.add_argument("--attendee-email", required=True)
    parser.add_argument("--attendee-name", required=True)
    parser.add_argument("--ghl-appointment-id", required=True)
    parser.add_argument("--patronpro-onboarding-id", required=True)
    parser.add_argument("--request-id", default=None, help="Testing override; never use placeholders for live mode.")
    parser.add_argument("--send-updates", choices=SEND_UPDATES_VALUES, default="none")
    parser.add_argument("--conference-data-version", type=int, default=CONFERENCE_DATA_VERSION)
    parser.add_argument("--dry-run", action="store_true", help="Explicitly mark dry-run mode. This is the default.")
    parser.add_argument("--execute", action="store_true", help="Future live mode guard. This bead still refuses network calls.")
    parser.add_argument("--confirm-live", action="store_true")
    parser.add_argument("--credentials-path")
    parser.add_argument("--token-path")
    parser.add_argument("--allow-send-updates", action="store_true")
    parser.add_argument("--show-pii", action="store_true", help="Show attendee emails locally; never commit this output.")
    return parser.parse_args(argv)


def parse_offset_datetime(value: str, field_name: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ContractError(f"{field_name} must be an ISO datetime: {value}") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ContractError(f"{field_name} must include a numeric UTC offset: {value}")
    return parsed


def validate_time_window(start: str, end: str, timezone: str) -> None:
    try:
        zone = ZoneInfo(timezone)
    except ZoneInfoNotFoundError as exc:
        raise ContractError(f"timezone must be a valid IANA timezone: {timezone}") from exc

    start_dt = parse_offset_datetime(start, "start")
    end_dt = parse_offset_datetime(end, "end")
    if end_dt <= start_dt:
        raise ContractError("end must be after start")

    for label, dt in (("start", start_dt), ("end", end_dt)):
        wall_time_in_zone = dt.replace(tzinfo=None).replace(tzinfo=zone)
        expected_offset = wall_time_in_zone.utcoffset()
        if expected_offset != dt.utcoffset():
            raise ContractError(
                f"{label} offset {dt.utcoffset()} does not match {timezone} offset {expected_offset}"
            )


def redact_email(email: str) -> str:
    if "@" not in email:
        raise ContractError("attendee email must contain @")
    return "***@***"


def build_dry_run_request_id(inputs: Mapping[str, str]) -> str:
    seed_keys = (
        "calendarId",
        "start",
        "end",
        "timezone",
        "ghlAppointmentId",
        "patronproOnboardingId",
    )
    seed = "|".join(inputs.get(key, "") for key in seed_keys)
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:24]
    return f"{DRY_RUN_PREFIX}_{digest}"


def build_live_request_id() -> str:
    return str(uuid.uuid4())


def validate_request_id(request_id: str, execute: bool) -> None:
    if not request_id:
        raise ContractError("requestId must be non-empty")
    if request_id in PLACEHOLDER_REQUEST_IDS:
        raise ContractError(f"requestId placeholder is not allowed: {request_id}")
    if execute:
        if request_id.startswith(DRY_RUN_PREFIX):
            raise ContractError("live mode must not reuse a dry-run requestId")
        try:
            uuid.UUID(request_id, version=4)
        except ValueError as exc:
            raise ContractError("live mode requires a UUIDv4-style requestId") from exc


def build_request_metadata(calendar_id: str, send_updates: str) -> dict[str, Any]:
    if send_updates not in SEND_UPDATES_VALUES:
        raise ContractError(f"sendUpdates must be one of {SEND_UPDATES_VALUES}")
    escaped_calendar_id = quote(calendar_id, safe="")
    return {
        "method": "POST",
        "url": f"https://www.googleapis.com/calendar/v3/calendars/{escaped_calendar_id}/events",
        "query": {
            "conferenceDataVersion": CONFERENCE_DATA_VERSION,
            "sendUpdates": send_updates,
        },
    }


def build_event_payload(args: argparse.Namespace, request_id: str, redact_pii: bool) -> dict[str, Any]:
    if args.conference_data_version != CONFERENCE_DATA_VERSION:
        raise ContractError("conferenceDataVersion must be exactly integer 1")
    validate_request_id(request_id, execute=args.execute)

    attendee_email = redact_email(args.attendee_email) if redact_pii else args.attendee_email
    return {
        "summary": args.summary,
        "description": args.description,
        "start": {"dateTime": args.start, "timeZone": args.timezone},
        "end": {"dateTime": args.end, "timeZone": args.timezone},
        "attendees": [
            {
                "email": attendee_email,
                "displayName": args.attendee_name,
            }
        ],
        "transparency": "opaque",
        "guestsCanInviteOthers": False,
        "guestsCanModify": False,
        "guestsCanSeeOtherGuests": False,
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 1440},
                {"method": "popup", "minutes": 60},
            ],
        },
        "extendedProperties": {
            "private": {
                "patronproSource": "onboarding-automation",
                "patronproBead": "ppweb-0ka.4",
                "ghlAppointmentId": args.ghl_appointment_id,
                "patronproOnboardingId": args.patronpro_onboarding_id,
            }
        },
        "conferenceData": {
            "createRequest": {
                "requestId": request_id,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }


def ensure_local_secret_path(path_value: str | None, label: str) -> None:
    if not path_value:
        raise ContractError(f"{label} is required for live mode")
    path = Path(path_value).expanduser()
    if not path.exists() or not path.is_file():
        raise ContractError(f"{label} must point to an existing local file")
    repo_root = Path(__file__).resolve().parents[5]
    try:
        path.resolve().relative_to(repo_root)
    except ValueError:
        return
    raise ContractError(f"{label} must live outside the repository")


def validate_live_guards(args: argparse.Namespace, env: Mapping[str, str]) -> None:
    if args.send_updates != "none" and not args.allow_send_updates:
        raise ContractError("--allow-send-updates is required when --send-updates is not none")

    if not args.execute:
        return

    if not args.confirm_live:
        raise ContractError("--confirm-live is required with --execute")
    ensure_local_secret_path(args.credentials_path, "--credentials-path")
    ensure_local_secret_path(args.token_path, "--token-path")
    if not env.get(CONFIRMATION_ENV_VAR):
        raise ContractError(f"{CONFIRMATION_ENV_VAR} must be set for live mode")


def build_output(args: argparse.Namespace) -> dict[str, Any]:
    validate_time_window(args.start, args.end, args.timezone)
    validate_live_guards(args, os.environ)
    request_id = args.request_id
    if request_id is None:
        request_id = build_live_request_id() if args.execute else build_dry_run_request_id(
            {
                "calendarId": args.calendar_id,
                "start": args.start,
                "end": args.end,
                "timezone": args.timezone,
                "ghlAppointmentId": args.ghl_appointment_id,
                "patronproOnboardingId": args.patronpro_onboarding_id,
            }
        )

    pii_redacted = not args.show_pii
    return {
        "mode": "live-not-implemented" if args.execute else "dry-run",
        "piiRedacted": pii_redacted,
        "request": build_request_metadata(args.calendar_id, args.send_updates),
        "event": build_event_payload(args, request_id, pii_redacted),
        "liveGuards": {
            "executeRequired": True,
            "confirmLiveRequired": True,
            "credentialsPathRequired": True,
            "tokenPathRequired": True,
            "confirmationEnvVar": CONFIRMATION_ENV_VAR,
            "allowSendUpdatesRequiredForNonNone": True,
        },
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        payload = build_output(args)
        if args.execute:
            raise ContractError("live Google Calendar execution is out of scope for ppweb-0ka.4")
    except ContractError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

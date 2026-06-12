# PatronPro Onboarding GHL Workflow Map

Date: 2026-06-12T19:39:35.037Z
Bead: `ppweb-0ka.1`
Branch: `feature/onboarding-automation`
Location: `hHLZC7FaTtUINPf3cbHd`
Artifact role: read-only workflow evidence

## Summary

- API probe: `success_read_only_api_metadata` (200)
- Workflows observed by API: 10
- Target statuses: 0 proven, 4 partial, 0 blocked, 0 not_found
- No-mutation proof: `hashes_match_after_read_only_gets`
- No live GHL mutation was performed. No Save, Publish, Send, Delete, Submit, Approve, or mutation-capable UI action was used.
- Profile 9 UI evidence was not attempted in this pass; it requires explicit approval and an authenticated WSL Profile 9 CDP connection.

## Target Workflows

### 1. Onboaring Link Send

- Representation status: `partial`
- Evidence source: `api`
- Observed name: `1. Onboaring Link Send`
- Workflow id: `96da67c8-2351-467c-ada7-3852a0839614`
- Published/status: `true` / `published`
- Version: `15`
- Created: `2026-05-22T12:48:38.219Z`
- Updated: `2026-06-11T12:08:45.307Z`
- Trigger summary: `blocked_by_profile9_ui`
- Action/send boundary: `blocked_by_profile9_ui`
- Appointment/calendar dependency: `blocked_by_profile9_ui`
- Meeting-invite gap: `gap_partial`
- Next proof needed: Profile 9 UI or separately approved export is needed to inspect triggers/actions.
- Safety note: Read-only GET metadata only; no live GHL mutation performed.

### 2. Onboarding Email Automation

- Representation status: `partial`
- Evidence source: `api`
- Observed name: `2. Onboarding Email Automation`
- Workflow id: `92b193be-e388-41b1-ab71-7b99ebf6efa0`
- Published/status: `true` / `published`
- Version: `28`
- Created: `2026-05-21T15:55:44.225Z`
- Updated: `2026-06-11T11:19:25.242Z`
- Trigger summary: `blocked_by_profile9_ui`
- Action/send boundary: `blocked_by_profile9_ui`
- Appointment/calendar dependency: `blocked_by_profile9_ui`
- Meeting-invite gap: `gap_partial`
- Next proof needed: Profile 9 UI or separately approved export is needed to inspect triggers/actions.
- Safety note: Read-only GET metadata only; no live GHL mutation performed.

### 2.5 Onboarding Appointment Completed

- Representation status: `partial`
- Evidence source: `api`
- Observed name: `2.5 Onboarding Appointment Completed`
- Workflow id: `b8ee04e6-5235-4adb-b097-21f7d9fa6e43`
- Published/status: `true` / `published`
- Version: `6`
- Created: `2026-06-08T19:33:53.802Z`
- Updated: `2026-06-11T11:04:48.742Z`
- Trigger summary: `blocked_by_profile9_ui`
- Action/send boundary: `blocked_by_profile9_ui`
- Appointment/calendar dependency: `blocked_by_profile9_ui`
- Meeting-invite gap: `gap_partial`
- Next proof needed: Profile 9 UI or separately approved export is needed to inspect triggers/actions.
- Safety note: Read-only GET metadata only; no live GHL mutation performed.

### 3. Onboarding Meeting Requirements Email

- Representation status: `partial`
- Evidence source: `api`
- Observed name: `3. Onboarding Meeting Requirements Email`
- Workflow id: `beb223dc-236b-4082-8b07-f915c8906801`
- Published/status: `true` / `published`
- Version: `12`
- Created: `2026-06-05T17:47:06.219Z`
- Updated: `2026-06-11T12:05:02.971Z`
- Trigger summary: `blocked_by_profile9_ui`
- Action/send boundary: `blocked_by_profile9_ui`
- Appointment/calendar dependency: `blocked_by_profile9_ui`
- Meeting-invite gap: `gap_partial`
- Next proof needed: Profile 9 UI or separately approved export is needed to inspect triggers/actions.
- Safety note: Read-only GET metadata only; no live GHL mutation performed.

## Future Ownership

- `ppweb-0ka.2` owns deterministic universal invite generation: ICS plus provider-specific add-to-calendar links.
- `ppweb-0ka.3` owns the Monday PoC panel for operator preview/download/test without GHL mutation.
- `ppweb-0ka.4` is the follow-up path for token scope or Google Meet research.

## Validation

- Validator status: `PASS`.
- Validation command: `bun dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts --json dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflows-api-probe-2026-06-12.json --md dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md`

## Observed Workflow Names

- 1. Onboaring Link Send
- 2. Onboarding Email Automation
- 2.5 Onboarding Appointment Completed
- 3. Onboarding Meeting Requirements Email
- Apuntados al Seminario
- Patron Pro General Seminar Invite Campaign V.2
- Patron Pro Seminar Invite Campaign
- Post Seminar
- Precheckout Consent Capture
- Seminar Invitation via Email and

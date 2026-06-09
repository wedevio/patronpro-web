# Liverpool Digital PatronPro Automation Report

Date: 2026-06-09
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Epic bead: `ppweb-elk`

## Summary

The new isolated worktree is set up and the dry-run automation system is in place. No live GHL, Supabase, or PatronPro panel changes were made.

Built artifacts:

- Source index of repo-backed PatronPro panel/GHL setup behavior.
- Required pre-change setup checklist.
- Dry-run QC/plan/export-docs harness.
- FSN1 runbook and env template.
- Quality-loop review and merge report.

## Current Status

Approved for dry-run QC and planning. Not approved for live writes.

The current local dry run reports all live checks as blocked because this shell has no Supabase or GHL credentials. That is expected and safe.

## Next Required Input

To export actual panel documentation and run real QC, provide either:

- Supabase `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, plus a non-rotating GHL token; or
- An authenticated panel session/API path that can read `/api/panel/docs`.

Live setup changes should wait until the dry-run QC report has real evidence for Liverpool Digital.

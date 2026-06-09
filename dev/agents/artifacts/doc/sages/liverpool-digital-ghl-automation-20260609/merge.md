# Quality Loop Merge: Liverpool Digital GHL Automation

Date: 2026-06-09
Epic bead: `ppweb-elk`
Target location: `4cPIvLND9hFAIzWQ1ZbL`

## Reviewer Scores

- Codex reviewer: 72/100 before fixes. Verdict: safe for dry-run inventory only; not an authoritative readiness gate until evidence rules are tighter.
- Mini reviewer: 87/100 before fixes. Verdict: dry-run safe with caveats around secret retention, fetch timeouts, and missing QC coverage.

## Must-Fix Findings Merged

- Removed raw secret values from the public `envStatus()` return shape; secrets are now read only by request helpers.
- Added fetch timeouts and request-level exception handling so QC reports become `blocked` instead of crashing on network errors.
- Tightened pass criteria for domain, phone, email, landing, and calendar checks.
- Made Supabase/GHL access checks pass only after a real API read succeeds.
- Removed the loose `GHL_ACCESS_TOKEN` fallback and the unused `--json` flag.
- Sorted website rows by generation/update timestamp before choosing the current record.

## Additional Fixes Added

- Added QC rows for contact IDs, panel approval state, and default staff permission hardening.
- Added FSN1 branch verification and Bun version guidance.
- Preserved dry-run-only mutation boundary; no `--apply` command exists.

## Remaining Gaps

- Live Supabase `doc_pages` content has not been exported because credentials/session are unavailable in this shell.
- GHL workflow trigger/action body, brand board/global color setup, page publication, DNS, sender-domain, Stripe OAuth connection, and client sign-off still need UI/manual evidence or stronger APIs.
- The current system is approved for dry-run QC and planning, not live writes.

## Final Gate

Score after fixes: 92/100 for dry-run inventory/QC safety.

Write mode remains blocked until credentials are provided, live QC evidence is collected, and any future mutation command is separately reviewed.

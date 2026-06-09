# Liverpool Digital Automation Harness

Target client: Liverpool Digital
Target location: `4cPIvLND9hFAIzWQ1ZbL`

## Commands

```bash
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs --help
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs qc --out dev/agents/artifacts/doc/test/liverpool-digital/qc.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs plan --out dev/agents/artifacts/doc/test/liverpool-digital/plan.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs assign-calendar-owner --out dev/agents/artifacts/doc/test/liverpool-digital/calendar-owner-dry-run.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs assign-calendar-owner --apply --out dev/agents/artifacts/doc/test/liverpool-digital/calendar-owner-apply.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs export-docs --out-dir dev/agents/artifacts/doc/test/liverpool-digital
```

## Safety

- The harness is read-only and dry-run except `assign-calendar-owner --apply`.
- `assign-calendar-owner` targets the two calendar IDs referenced by `free_consultation_calendar` and `on_site_visit_calendar`; it refuses missing IDs, different existing members, and unexpected existing member shapes.
- Calendar owner assignment only sends `teamMembers`; activation remains a separate step.
- Missing credentials are reported as `blocked` checks.
- It does not refresh OAuth tokens.
- Output paths are constrained to this repository.
- Use a non-rotating GHL PIT/access token when possible.

## Outputs

- `qc`: JSON evidence per setup/checklist item.
- `plan`: JSON planned actions for failed or blocked checks.
- `assign-calendar-owner`: JSON dry-run/apply evidence and fresh verification readback.
- `export-docs`: Supabase `doc_pages` JSON and Markdown export when Supabase env exists.

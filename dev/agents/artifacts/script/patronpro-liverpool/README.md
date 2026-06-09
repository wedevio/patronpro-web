# Liverpool Digital Automation Harness

Target client: Liverpool Digital
Target location: `4cPIvLND9hFAIzWQ1ZbL`

## Commands

```bash
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs --help
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs qc --out dev/agents/artifacts/doc/test/liverpool-digital/qc.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs plan --out dev/agents/artifacts/doc/test/liverpool-digital/plan.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs export-docs --out-dir dev/agents/artifacts/doc/test/liverpool-digital
```

## Safety

- The harness is read-only and dry-run.
- Missing credentials are reported as `blocked` checks.
- It does not refresh OAuth tokens and does not perform live mutation.
- Use a non-rotating GHL PIT/access token when possible.

## Outputs

- `qc`: JSON evidence per setup/checklist item.
- `plan`: JSON planned actions for failed or blocked checks.
- `export-docs`: Supabase `doc_pages` JSON and Markdown export when Supabase env exists.

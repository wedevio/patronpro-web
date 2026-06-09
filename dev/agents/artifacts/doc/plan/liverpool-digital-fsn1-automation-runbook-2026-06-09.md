# Liverpool Digital FSN1 Automation Runbook

Date: 2026-06-09
Repo: `wedevio/patronpro-web`
Branch: `feature/liverpool-digital-docs-automation`
Epic bead: `ppweb-elk`
Target location: `4cPIvLND9hFAIzWQ1ZbL`
Target client: Liverpool Digital
Artifact role: FSN1 runbook
Artifact status: current draft

## Runtime Layout

Suggested FSN1 paths:

- App checkout: `/opt/patron-pro/liverpool-digital-automation`
- Env file: `/etc/patron-pro/liverpool-digital-automation.env`
- Data output: `/var/lib/patron-pro/liverpool-digital-automation`
- Logs: `/var/log/patron-pro/liverpool-digital-automation`

Do not store real secrets inside the git repo. Use `dev/agents/artifacts/config/liverpool-digital-automation.env.example` only as a template.

## Install / Sync

```bash
cd /opt/patron-pro/liverpool-digital-automation
git fetch origin
git rev-parse --verify origin/feature/liverpool-digital-docs-automation
git checkout feature/liverpool-digital-docs-automation
bun --version
bun install
```

Use Bun 1.2 or newer. If this is only a script runner and the production app is deployed elsewhere, `bun install` is enough; do not run a heavy production build unless explicitly needed.

## Load Env

```bash
set -a
source /etc/patron-pro/liverpool-digital-automation.env
set +a
```

Required for live QC:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- One non-rotating GHL token variable: `GHL_LOCATION_PIT`, `GHL_MCP`, or `GHL_AGENCY_ACCESS_TOKEN`

## Dry-Run QC

```bash
mkdir -p /var/lib/patron-pro/liverpool-digital-automation/reports

bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs \
  qc \
  --location 4cPIvLND9hFAIzWQ1ZbL \
  --out /var/lib/patron-pro/liverpool-digital-automation/reports/qc-$(date +%Y%m%d-%H%M%S).json \
  > /var/log/patron-pro/liverpool-digital-automation/qc.log 2>&1
```

## Dry-Run Planned Actions

```bash
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs \
  plan \
  --location 4cPIvLND9hFAIzWQ1ZbL \
  --out /var/lib/patron-pro/liverpool-digital-automation/reports/plan-$(date +%Y%m%d-%H%M%S).json \
  > /var/log/patron-pro/liverpool-digital-automation/plan.log 2>&1
```

## Export Panel Docs

```bash
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs \
  export-docs \
  --out-dir /var/lib/patron-pro/liverpool-digital-automation/panel-docs \
  > /var/log/patron-pro/liverpool-digital-automation/export-docs.log 2>&1
```

After export, store the Markdown in RLM from an authorized shell:

```bash
rlm store \
  --title "PatronPro Panel Docs Export Liverpool Digital $(date +%Y-%m-%d)" \
  --tags "project:patron-pro,repo:wedevio/patronpro-web,client:liverpool-digital,location:4cPIvLND9hFAIzWQ1ZbL,artifact_role:panel-docs-export,artifact_status:current" \
  --project "patron-pro" \
  --category "docs/patronpro-web" \
  < /var/lib/patron-pro/liverpool-digital-automation/panel-docs/doc-pages/doc-pages.md
```

## GHL Automation Hook

Use the harness as a read-only post-step QC job after a GHL workflow or manual setup step. The script should not be placed directly in a public webhook path unless wrapped by an authenticated worker.

Recommended pattern:

1. GHL workflow does its normal action.
2. Internal worker schedules `qc`.
3. Worker stores JSON report under `/var/lib/.../reports`.
4. Worker notifies the operator when any item is `fail` or `blocked`.

## Current Mutation Policy

The current harness performs no live writes. Any future write command must:

- Keep dry-run as the default.
- Require an explicit `--apply`.
- Print planned operations before applying.
- Never print secrets.
- Emit a QC report after applying.

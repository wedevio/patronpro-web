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
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs activate-calendars --out dev/agents/artifacts/doc/test/liverpool-digital/calendar-activation-dry-run.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs activate-calendars --apply --out dev/agents/artifacts/doc/test/liverpool-digital/calendar-activation-apply.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs calendar-availability-qa --out dev/agents/artifacts/doc/test/liverpool-digital/calendar-availability-qa.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs website-assets --out dev/agents/artifacts/doc/test/liverpool-digital/website-assets.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs apply-brand-board --out dev/agents/artifacts/doc/test/liverpool-digital/brand-board-dry-run.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs apply-brand-board --apply --out dev/agents/artifacts/doc/test/liverpool-digital/brand-board-apply.json
bun dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs export-docs --out-dir dev/agents/artifacts/doc/test/liverpool-digital
```

Browser-only GHL Website Builder commands must run from Windows Node when Profile 9 CDP is bound to Windows `127.0.0.1`:

```bash
powershell.exe -NoProfile -Command "node '\\wsl.localhost\Ubuntu\home\oz\projects\2026\patronpro-web-docs-automation\dev\agents\artifacts\script\patronpro-liverpool\ghl-profile9-website-builder.mjs' map --out 'dev/agents/artifacts/doc/test/liverpool-digital/ghl-profile9-website-builder-map.json'"
powershell.exe -NoProfile -Command "node '\\wsl.localhost\Ubuntu\home\oz\projects\2026\patronpro-web-docs-automation\dev\agents\artifacts\script\patronpro-liverpool\ghl-profile9-website-builder.mjs' preview-qa --out 'dev/agents/artifacts/doc/test/liverpool-digital/ghl-profile9-preview-qa.json'"
powershell.exe -NoProfile -Command "node '\\wsl.localhost\Ubuntu\home\oz\projects\2026\patronpro-web-docs-automation\dev\agents\artifacts\script\patronpro-liverpool\ghl-profile9-website-builder.mjs' save-visible-modal --apply --coordinate-fallback --screenshot 'C:\Users\alast\AppData\Local\Temp\patronpro-after-save.png'"
powershell.exe -NoProfile -Command "node '\\wsl.localhost\Ubuntu\home\oz\projects\2026\patronpro-web-docs-automation\dev\agents\artifacts\script\patronpro-liverpool\ghl-profile9-website-builder.mjs' save-html --apply"
```

## Safety

- The harness is read-only and dry-run except `assign-calendar-owner --apply`, `activate-calendars --apply`, and `apply-brand-board --apply`.
- `assign-calendar-owner` targets the two calendar IDs referenced by `free_consultation_calendar` and `on_site_visit_calendar`; it refuses missing IDs, different existing members, and unexpected existing member shapes.
- Calendar owner assignment only sends `teamMembers`; activation remains a separate step.
- `activate-calendars` targets those same exact calendar IDs and sends only `isActive: true`; owner/team members remain unchanged.
- `calendar-availability-qa` is read-only. It verifies required schedule fields and calls `GET /calendars/{calendarId}/free-slots` with a 14-day default window. `openHoursCount: 0` is treated as a warning, not a blocker, when free slots are returned.
- `activate-calendars --apply` includes the same free-slot smoke result in its verification payload.
- `website-assets` is read-only; it proves generated HTML/images and GHL website/page inventory but does not publish or edit the GHL page.
- `apply-brand-board` derives the palette from the generated website HTML and verifies by reading `/brand-boards/{locationId}` after the write.
- Brand Board list reads can omit `colors`; hydrate candidates with `GET /brand-boards/{locationId}/{brandBoardId}` before QA.
- `ghl-profile9-website-builder.mjs map` and `preview-qa` are read-only.
- `ghl-profile9-website-builder.mjs save-visible-modal --apply` only clicks the visible modal Save and builder save icon; use `--coordinate-fallback` only when the headed browser visibly shows the expected Save controls but CDP selector access is flaky.
- `ghl-profile9-website-builder.mjs save-html --apply` writes generated HTML into the existing GHL Custom HTML block and clicks builder Save. It does not click Publish.
- Never use browser scripts to read or store cookies, headers, passwords, tokens, localStorage, or Google account state.
- The top-level GHL `Publish` button remains manual/operator-approved until domain, phone, email, Twilio, and final QA gates are ready.
- Missing credentials are reported as `blocked` checks.
- It does not refresh OAuth tokens.
- Output paths are constrained to this repository.
- Use a non-rotating GHL PIT/access token when possible.

## Outputs

- `qc`: JSON evidence per setup/checklist item.
- `plan`: JSON planned actions for failed or blocked checks.
- `assign-calendar-owner`: JSON dry-run/apply evidence and fresh verification readback.
- `activate-calendars`: JSON dry-run/apply evidence and fresh activation verification readback.
- `calendar-availability-qa`: JSON read-only schedule checks and free-slot smoke results.
- `website-assets`: JSON generated HTML/images plus read-only GHL website/page inventory.
- `apply-brand-board`: JSON dry-run/apply evidence and fresh Brand Board readback.
- `export-docs`: Supabase `doc_pages` JSON and Markdown export when Supabase env exists.
- `ghl-profile9-website-builder map`: JSON UI map of the current Profile 9 page-builder state.
- `ghl-profile9-website-builder preview-qa`: JSON public preview marker check.
- `ghl-profile9-website-builder save-visible-modal`: JSON evidence for closing/saving a visible Custom HTML modal.
- `ghl-profile9-website-builder save-html`: JSON evidence for setting the generated Custom HTML in the GHL page builder.

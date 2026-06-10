# PatronPro Web Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo Workflow

- Use `bun` for package commands.
- Keep automation artifacts under `dev/agents/artifacts/`.
- Keep finalized reports under `doc/reports/<YYYY>/<MM>/`.
- Default GHL and panel scripts to dry-run mode.
- Do not make live GHL, Supabase, or PatronPro panel mutations without explicit user approval.

## GHL Browser Automation Profile Policy

- For PatronPro/GHL browser automation in this worktree, use the WSL Chrome profile labeled `Profile 9` / `devio/patron-pro [my job]` when the user says "profile 9".
- `Profile 9` is the WSL Chrome profile for the `@getpatronpro.com` / PatronPro panel login. It is not the Oscar `oscar.betancourt@picturelle.com` profile.
- If the exact WSL Profile 9 path is not already running/known, use a dedicated PatronPro-only WSL user-data directory such as `/home/oz/.config/chrome-patronpro-profile9` and have the user log in with the `@getpatronpro.com` account before automation.
- Do not use `/home/oz/.config/chrome-oscar-flow` or `/home/oz/.config/chrome-oscar-flow-2` for PatronPro Profile 9 work; those are Oscar `@picturelle.com` WSL sessions and should be treated as Profile 6 / personal Google sessions.
- Do not use or attach to Oscar's Windows Chrome Profile 9 unless the user explicitly says to use the Windows profile for that pass.
- Historical Liverpool website HTML copy artifacts mention Windows Chrome Profile 9 because WSL could not reach Windows-local CDP. Treat that as historical evidence, not the default path.
- Preferred workflow: API probe first, then WSL Profile 9 browser automation through Chrome CDP, then document the selector/endpoint pattern and QA proof under `dev/agents/artifacts/`.
- Never read, print, store, commit, or include in RLM browser cookies, localStorage, session headers, passwords, Google account state, or GHL tokens.
- If WSL Profile 9 is not running or not authenticated, stop and report the exact blocker. Do not silently fall back to Windows Chrome.

## Task Tracking

- This worktree uses Beads with the `ppweb` prefix.
- Use `bd create`, `bd show`, `bd update`, and `bd sync` for implementation tracking.

## Landing the Plane

When ending a work session, complete these steps before handing off:

1. File beads for remaining work.
2. Run the smallest viable quality gates if code changed.
3. Update bead status for finished or blocked items.
4. Pull/rebase, run `bd sync`, push the branch, and confirm `git status`.
5. Hand off the active branch, changed files, verification, and next steps.

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

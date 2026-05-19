# Skill Registry — patronpro-web

Generated: 2026-05-19

## Project Conventions Files

| File | Role |
|------|------|
| `AGENTS.md` | Main agent instructions (Next.js breaking-change warning) |
| `CLAUDE.md` | References `@AGENTS.md` |

### AGENTS.md Key Rule
> This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing any code.

---

## Available Skills

### SDD Workflow Skills

| Skill | Trigger |
|-------|---------|
| `sdd-init` | Initialize SDD context in a project |
| `sdd-explore` | Investigate/think through a feature |
| `sdd-propose` | Create a change proposal |
| `sdd-spec` | Write specifications with Given/When/Then scenarios |
| `sdd-design` | Create technical design document |
| `sdd-tasks` | Break down a change into a task checklist |
| `sdd-apply` | Implement tasks from the change |
| `sdd-verify` | Validate implementation against specs |
| `sdd-archive` | Sync delta specs to main specs and archive |
| `sdd-onboard` | Guided SDD walkthrough |

### Utility Skills

| Skill | Trigger |
|-------|---------|
| `branch-pr` | Creating a pull request or preparing changes for review |
| `issue-creation` | Creating a GitHub issue, reporting a bug, requesting a feature |
| `judgment-day` | Adversarial dual review — "judgment day", "juzgar", "doble review" |
| `skill-creator` | Creating new AI agent skills |
| `skill-registry` | Update the skill registry |

### Project-Specific Skills

| Skill | Trigger |
|-------|---------|
| `laura-recasens-brand` | Laura Recasens Nutrición brand identity on any output |
| `go-testing` | Go tests, Bubbletea TUI testing |

---

## Stack Context

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 (PostCSS)
- **Runtime**: React 19
- **Deploy**: git push to main → production
- **No test suite** — Strict TDD Mode: ❌ disabled

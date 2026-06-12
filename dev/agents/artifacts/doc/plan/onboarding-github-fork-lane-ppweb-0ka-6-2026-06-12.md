# PRD: GitHub fork/copy lane for PatronPro experiment repo

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.6`
Date: 2026-06-12
Status: Draft for quality loop

## Goal

Define a safe GitHub fork/copy strategy for moving Carlos Antón's confirmed PatronPro panel/app repo into Oscar's GitHub space for experimentation, using FSN1 as the intended execution host once destination identifiers are confirmed.

This bead must not create a fork, rewrite remotes, push to Carlos' repo, or mutate FSN1. The deliverable is an executable runbook and blocker register that prevents accidental main-branch changes.

## Confirmed Facts

- User confirmed on 2026-06-12 that `wedevio/patronpro-web` is the Carlos/source repo for the PatronPro panel/app lane.
- Current local origin is `https://github.com/wedevio/patronpro-web.git`.
- GitHub metadata reports `wedevio/patronpro-web` is not a fork and its default branch is `main`.
- Oscar's GitHub username is `mensajerokaos`.
- `https://github.com/mensajerokaos` exists.
- A private repo `mensajerokaos/patron-pro` already exists, has default branch `global`, and is not a fork. Treat it as an existing Oscar workspace, not automatically as the panel fork destination.
- User direction on 2026-06-12: use the FSN1 server to make the fork/copy of the panel for the PatronPro experiment lane.
- Local SSH config has FSN1-style hosts pointing to `178.105.13.63`: `picturelle-pro-fsn1`, `code2`, and `af-fsn1`.

## Unknowns / Blockers

Do not perform remote actions until these are confirmed:

1. Whether the destination should be:
   - a GitHub fork,
   - a new private copy/mirror,
   - a branch inside existing `mensajerokaos/patron-pro`,
   - or a separate new repo such as `mensajerokaos/patronpro-panel-experiment`.
2. Exact destination repo slug/name if not using existing `mensajerokaos/patron-pro`.
3. Whether Carlos expects future work as a PR to `wedevio/patronpro-web` or as a patch/branch handoff outside GitHub.
4. Which FSN1 host alias and filesystem path are approved for this PatronPro panel lane.

## Proposed Default Strategy

Preferred strategy once destination is confirmed:

1. Use FSN1 as the remote execution machine.
2. Create a fresh FSN1 work directory, for example:
   - `/opt/patronpro/experiments/panel-fork`
   - or `/srv/patronpro/experiments/panel-fork`
3. Clone `wedevio/patronpro-web` read-only into FSN1.
4. Add remotes without rewriting Carlos' repo:
   - `upstream`: `https://github.com/wedevio/patronpro-web.git`.
   - `origin`: Oscar destination repo under `mensajerokaos`.
5. Create a dedicated branch:
   - `feature/onboarding-automation-poc`
6. Push only to Oscar's destination repo.
7. Never push to Carlos' `main`.
8. Preserve a clean handoff path back to Carlos:
   - PR from Oscar branch to Carlos repo if it is a true fork,
   - or patch branch/bundle if the destination is a private copy.

## Repo Strategy Matrix

| Strategy | When to use | Pros | Risk | Required confirmation |
| --- | --- | --- | --- | --- |
| GitHub fork into `mensajerokaos` | `wedevio/patronpro-web` is accessible and GitHub permits fork | Native upstream relationship and PR path | May expose repo relationship; fork permissions may fail for private repos | Carlos/Oscar permission and fork destination name |
| Private mirror/copy into new `mensajerokaos/*` repo | Fork not allowed or Carlos wants an isolated experiment | Clean separation and no accidental PR noise | No native fork PR relationship | Destination repo name and privacy |
| Branch inside existing `mensajerokaos/patron-pro` | Existing repo is the intended Oscar workspace | Reuses current private repo | Could mix unrelated PatronPro global notes/code | Confirm repo role and branch policy |
| Current `wedevio/patronpro-web` only | This repo is already Carlos/company source | No new clone needed locally | Not Oscar-owned; direct pushes could affect team repo | Explicit approval before any remote changes |

## Safe FSN1 Command Template

These commands are a template only. Do not run until the unknowns are resolved.

```bash
ssh picturelle-pro-fsn1
mkdir -p /opt/patronpro/experiments
cd /opt/patronpro/experiments
git clone --origin upstream https://github.com/wedevio/patronpro-web.git panel-fork
cd panel-fork
git switch -c feature/onboarding-automation-poc
git remote add origin <OSCAR_DESTINATION_REPO_URL>
git remote -v
git branch --show-current
git status --short --branch
```

If the destination is a true GitHub fork:

```bash
gh repo fork wedevio/patronpro-web --clone=false --remote=false --fork-name <DESTINATION_NAME>
```

If the destination is a new private copy:

```bash
gh repo create mensajerokaos/<DESTINATION_NAME> --private --source . --remote origin --push
```

Both commands require explicit confirmation before use.

## Safety Rules

- Do not push to Carlos' `main`.
- Do not force-push.
- Do not overwrite `origin`/`upstream` without printing and reviewing `git remote -v`.
- Do not copy secrets, `.env`, credentials, cookies, localStorage, or deployment keys into the destination.
- Run a secret scan before the first push.
- Keep the branch name separate from this automation worktree unless explicitly asked.
- Record the exact source URL, destination URL, FSN1 path, branch, commit, and rollback command in RLM after execution.

## Acceptance Criteria

- Documents confirmed identifiers and unknown blockers.
- Defines FSN1 as the intended execution host without mutating it.
- Defines safe remote names, branch name, destination options, and no-main-branch rule.
- Gives command templates for true fork and private copy paths.
- Updates `ppweb-0ka.6` status honestly:
  - close only if source/destination are confirmed and the strategy is complete without needing remote mutation,
  - otherwise mark/update as blocked on final destination repo decision and FSN1 execution path.

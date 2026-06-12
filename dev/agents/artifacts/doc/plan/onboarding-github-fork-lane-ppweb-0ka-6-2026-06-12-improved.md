# PRD: GitHub fork/copy lane for PatronPro experiment repo

Project: PatronPro onboarding automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.6`
Date: 2026-06-12
Status: Approved strategy/runbook, then executed after explicit user approval

## Goal

Define a safe GitHub fork/copy lane for moving Carlos Anton's confirmed PatronPro panel/app repo into Oscar's GitHub namespace for experimentation, then record the explicitly approved fork execution.

The original CE-approved runbook was strategy-only. After the runbook landed, the user explicitly approved the true fork into `mensajerokaos`, so the GitHub-side fork was created from FSN1 and verified. No clone, branch push, local remote rewrite, Carlos main-branch change, or `mensajerokaos/patron-pro` mutation was performed.

Execution proof is stored in:

`dev/agents/artifacts/doc/test/onboarding-automation/github-fork-execution-ppweb-0ka-6-2026-06-12.md`

## Scope Boundaries

In scope for `ppweb-0ka.6` after the post-PRD approval:

- Record confirmed GitHub facts and unresolved blockers.
- Recommend the safest destination strategy.
- Provide an executable but gated FSN1 runbook.
- Provide preflight, verification, rollback, and acceptance criteria.
- Make branch/remotes unambiguous so Carlos' source repo is protected.
- Execute the explicitly approved GitHub-side fork into `mensajerokaos/patronpro-web`.
- Record sanitized execution evidence.

Out of scope for `ppweb-0ka.6`:

- Pushing any branch.
- Rewriting local or remote Git remotes.
- Mutating `mensajerokaos/patron-pro`.
- Deleting any GitHub repo or FSN1 directory.
- Creating an FSN1 working clone before a filesystem path and first-push plan are separately approved.

## Confirmed Facts

- User confirmed on 2026-06-12 that `wedevio/patronpro-web` is the Carlos/source repo for the PatronPro panel/app lane.
- Current local origin is `https://github.com/wedevio/patronpro-web.git`.
- GitHub metadata after user correction:
  - source repo: `wedevio/patronpro-web`;
  - visibility: public;
  - default branch: `main`;
  - viewer permission: `WRITE`;
  - fork status: not a fork;
  - license metadata: none reported by GitHub.
- Oscar's GitHub username is `mensajerokaos`.
- `https://github.com/mensajerokaos` exists.
- `mensajerokaos/patronpro-web` was available before execution and is now the created fork destination.
- A private repo `mensajerokaos/patron-pro` already exists, has default branch `global`, and is not a fork. Treat it as a different Oscar workspace by default, not as the PatronPro panel destination.
- User direction on 2026-06-12: use the FSN1 server to make the fork/copy of the panel for the PatronPro experiment lane.
- Local SSH config has FSN1-style hosts pointing to `178.105.13.63`: `picturelle-pro-fsn1`, `code2`, and `af-fsn1`.
- FSN1 alias used for the approved fork operation: `picturelle-pro-fsn1`.

## Post-Approval Execution Record

On 2026-06-12, after the user wrote "i approve the fork in mensajerokaos", FSN1 executed the GitHub API fork operation.

Verified output:

```text
fsn1_github_login=mensajerokaos
source=wedevio/patronpro-web main false false
create_status=202
destination=mensajerokaos/patronpro-web https://github.com/mensajerokaos/patronpro-web true wedevio/patronpro-web main false
```

Additional verification:

```text
GitHub REST: mensajerokaos/patronpro-web https://github.com/mensajerokaos/patronpro-web true wedevio/patronpro-web main false
FSN1 git ls-remote HEAD: 6a2549e5fd2e4eda250f38146158567ff0770b2d
```

Execution boundaries:

- FSN1 did not have `gh` installed, so the fork used `curl` against GitHub's REST API from FSN1 with a transient token piped over SSH.
- The token was not printed, stored in an artifact, or committed.
- No FSN1 clone was created.
- No branch was pushed.
- No local Git remotes were changed.
- No push was made to `wedevio/patronpro-web`.
- Existing `mensajerokaos/patron-pro` was not touched.

## Decision Order

Resolve blockers in this order before any execution:

1. License/compliance permission: GitHub reports no source license metadata, so copy/fork permission is not machine-verifiable.
2. Destination strategy: true fork/copy destination versus private mirror/copy.
3. Destination slug: recommended `mensajerokaos/patronpro-web`; fallback `mensajerokaos/patronpro-web-experiment`.
4. Carlos handoff model: future PR to source repo, patch bundle, or isolated experiment only.
5. FSN1 execution host and path: recommended alias `picturelle-pro-fsn1`; approved path must be confirmed.
6. Follow-up execution bead/session: only after items 1-5 are recorded.

## Unknowns / Blockers

Do not perform remote actions until these are confirmed:

1. Whether the destination should be:
   - a true GitHub fork/copy at `mensajerokaos/patronpro-web`;
   - a private mirror/copy at `mensajerokaos/patronpro-web-experiment`;
   - or another destination explicitly named by the user.
2. Whether Carlos expects future work as:
   - a PR to `wedevio/patronpro-web`;
   - a patch/branch handoff outside GitHub;
   - or an isolated experiment with no upstream PR path.
3. Which FSN1 host alias and filesystem path are approved for this PatronPro panel lane.
4. Whether the source repo's lack of GitHub license metadata is acceptable for an Oscar namespace fork/copy under stakeholder direction.
5. Whether Git LFS, submodules, CODEOWNERS, protected branches, or large history objects require special handling before the first push.

## Recommended Destination Strategy

Preferred strategy after explicit approval:

1. Create or use a true GitHub fork/copy destination named `mensajerokaos/patronpro-web`.
2. Use FSN1 only as the execution host.
3. Clone Carlos' source repo into a fresh FSN1 working directory.
4. Preserve remotes as:
   - `upstream`: `https://github.com/wedevio/patronpro-web.git`;
   - `origin`: `https://github.com/mensajerokaos/patronpro-web.git`.
5. Create an experiment branch named `feature/onboarding-automation-poc`.
6. Push only `feature/onboarding-automation-poc` to Oscar's destination repo.
7. Never push to Carlos' `main`.

Fallback strategy:

- Use private mirror/copy `mensajerokaos/patronpro-web-experiment` only if a true fork/copy into `mensajerokaos/patronpro-web` is not desired or GitHub fork constraints block it.

Avoid by default:

- Do not use existing `mensajerokaos/patron-pro` unless the user explicitly confirms it is the PatronPro panel workspace. Its default branch `global` indicates a different product line or workspace, so using it for panel experimentation risks contaminating unrelated code paths and complicating rollback.

## Branch Naming

- Current local planning worktree branch: `feature/onboarding-automation`.
- Future FSN1 experiment branch: `feature/onboarding-automation-poc`.

The `-poc` suffix is intentional. It separates the execution experiment from the current planning/automation branch and makes accidental cross-pushes easier to spot.

## Repo Strategy Matrix

| Strategy | When to use | Pros | Risk | Required confirmation |
| --- | --- | --- | --- | --- |
| True GitHub fork/copy into `mensajerokaos/patronpro-web` | Approved default if Carlos/Oscar want a native upstream relationship | Natural destination name, clean Oscar namespace, future PR path if desired | Fork/copy may expose repo relationship and source metadata; license metadata is absent | User approval, permission/licensing acceptance, source visibility/permission check |
| Private mirror/copy into `mensajerokaos/patronpro-web-experiment` | Fork is not desired or GitHub blocks the fork path | Isolated experiment, low PR noise | No native fork relationship; handoff may require patch/bundle | Destination slug, privacy, handoff model |
| Branch inside existing `mensajerokaos/patron-pro` | Only if user explicitly says this repo is the panel workspace | Reuses an existing private repo | Default branch `global` indicates a different product line; risk of contaminating unrelated code paths and complicating rollback | Confirm `global` branch scope, branch protection, repo role, and branch naming |
| Current `wedevio/patronpro-web` only | Only if Carlos/company source remains the execution workspace | No new repo required | Not Oscar-owned; direct pushes could affect the source team | Explicit approval before clone/write/push and before any source remote mutation |

## FSN1 Runbook Template

These commands are a template only. Do not run until the blockers are resolved and the user explicitly approves FSN1 execution.

Assumptions for the approved execution pass:

- Host alias: `picturelle-pro-fsn1`.
- Working parent: `/opt/patronpro/experiments` or another approved path.
- Destination repo: `mensajerokaos/patronpro-web` unless the user approves a fallback.
- Branch to push: `feature/onboarding-automation-poc`.

### Phase 0: Operator approval gate

Before running any command, record:

```text
Approved source:      https://github.com/wedevio/patronpro-web.git
Approved destination: https://github.com/mensajerokaos/patronpro-web.git
Approved FSN1 host:   picturelle-pro-fsn1
Approved FSN1 path:   /opt/patronpro/experiments/panel-fork
Approved branch:      feature/onboarding-automation-poc
Approved mode:        true fork/copy OR private mirror/copy
Approved rollback:    local cleanup only OR GitHub destination deletion allowed after confirmation
```

### Phase 1: FSN1 preflight

```bash
ssh picturelle-pro-fsn1

# PRE-FLIGHT: all checks must pass before clone/fork/copy work.
set -euo pipefail

APPROVED_PARENT="/opt/patronpro/experiments"
SOURCE_REPO="wedevio/patronpro-web"
SOURCE_URL="https://github.com/wedevio/patronpro-web.git"
DEST_REPO="mensajerokaos/patronpro-web"
DEST_URL="https://github.com/mensajerokaos/patronpro-web.git"
POC_BRANCH="feature/onboarding-automation-poc"

gh auth status 2>&1 | tee /tmp/ppweb-gh-auth-status.txt
gh api user --jq .login | grep -Fx "mensajerokaos"

git ls-remote "$SOURCE_URL" HEAD >/dev/null
gh repo view "$SOURCE_REPO" --json nameWithOwner,visibility,defaultBranchRef,viewerPermission,isFork,licenseInfo \
  --jq '{repo: .nameWithOwner, visibility: .visibility, default_branch: .defaultBranchRef.name, viewer_permission: .viewerPermission, is_fork: .isFork, license: .licenseInfo}'

# Destination availability check: this should fail before initial fork/copy creation.
if gh repo view "$DEST_REPO" >/tmp/ppweb-dest-view.txt 2>&1; then
  echo "Destination already exists: $DEST_REPO"
  echo "Stop and confirm whether to reuse it before continuing."
  exit 1
else
  echo "Destination appears available: $DEST_REPO"
fi

df -h "$APPROVED_PARENT" || df -h "$(dirname "$APPROVED_PARENT")"
df -i "$APPROVED_PARENT" || df -i "$(dirname "$APPROVED_PARENT")"

# Optional GitHub SSH diagnostic. HTTPS auth via gh is acceptable, but this helps identify key drift.
ssh -T git@github.com 2>&1 | head -1 || true
```

### Phase 2: Create or identify destination

True fork/copy path, if approved:

```bash
# Creates the GitHub-side fork/copy only; does not clone or wire local remotes.
gh repo fork wedevio/patronpro-web --clone=false --remote=false --fork-name patronpro-web

# Capture the actual GitHub URL after creation instead of guessing.
DEST_URL="$(gh repo view mensajerokaos/patronpro-web --json url -q .url).git"
echo "$DEST_URL"
```

Private mirror/copy fallback, if approved:

```bash
# Do not use one-shot gh repo creation that publishes the current clone.
# Create the empty private destination first, then push only the approved POC branch later.
gh repo create mensajerokaos/patronpro-web-experiment --private --description "PatronPro panel experiment copy"
DEST_URL="$(gh repo view mensajerokaos/patronpro-web-experiment --json url -q .url).git"
echo "$DEST_URL"
```

### Phase 3: Clone source read-only and prepare branch

```bash
mkdir -p "$APPROVED_PARENT"
cd "$APPROVED_PARENT"

test ! -e panel-fork || { echo "panel-fork already exists; stop and inspect"; exit 1; }

git clone --origin upstream "$SOURCE_URL" panel-fork
cd panel-fork

git switch main
git branch --set-upstream-to=upstream/main main
git status --short --branch

git remote -v
git remote add origin "$DEST_URL"
git remote -v

git switch -c "$POC_BRANCH"
git status --short --branch
```

### Phase 4: Repository shape checks

```bash
git log --oneline -5
git count-objects -vH
du -sh .git

if command -v git-lfs >/dev/null 2>&1; then
  git lfs install --local
  git lfs ls-files || true
else
  echo "git-lfs not installed; inspect pointer files before first push."
  git grep -n "version https://git-lfs.github.com/spec/v1" || true
fi

git submodule status || true
test -f CODEOWNERS && sed -n '1,120p' CODEOWNERS || true
test -f .github/CODEOWNERS && sed -n '1,120p' .github/CODEOWNERS || true
test -f LICENSE && sed -n '1,80p' LICENSE || echo "No LICENSE file found at repo root."
test -f NOTICE && sed -n '1,80p' NOTICE || true
```

### Phase 5: Mandatory pre-push review

Run this immediately before any push. If any line is surprising, stop.

```bash
echo "About to push branch: $(git branch --show-current)"
echo "Destination origin: $(git remote get-url origin)"
echo "Source upstream: $(git remote get-url upstream)"

git remote -v
git branch --show-current
git status --short --branch
git log --oneline -5

echo "Secret scan: preferred tools"
if command -v trufflehog >/dev/null 2>&1; then
  trufflehog git file://. --only-verified --no-history
elif command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --no-banner --redact
else
  echo "Install trufflehog or gitleaks before approved execution."
  echo "Fallback grep is advisory only and does not replace a real secret scanner."
  git log -p --all | grep -E '(BEGIN [A-Z]+ PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9_-]{20,})' && exit 1 || true
fi

echo "Files that must not be present before push:"
find . -name '.env*' -o -name '*.pem' -o -name '*.key' -o -name 'id_rsa*' -o -name 'secrets.*' -o -name '*cookie*' -o -name '*localStorage*'
```

### Phase 6: Approved push only

Run only after the pre-push review is clean and the user has explicitly approved the push.

```bash
test "$(git branch --show-current)" = "$POC_BRANCH"
git push -u origin feature/onboarding-automation-poc
git status --short --branch
```

## Rollback Commands

Rollback is also gated. Do not run deletion commands without explicit confirmation.

Local remote rollback inside the FSN1 clone:

```bash
cd /opt/patronpro/experiments/panel-fork
git remote -v
git remote remove origin
git remote -v
```

FSN1 working directory rollback:

```bash
# Safer first step: quarantine instead of immediate deletion.
cd /opt/patronpro/experiments
mv panel-fork "panel-fork.rollback.$(date +%Y%m%d-%H%M%S)"

# Only after explicit confirmation that the quarantined copy is disposable:
rm -rf /opt/patronpro/experiments/panel-fork.rollback.<TIMESTAMP>
```

Mistaken GitHub destination rollback:

```bash
# Destructive. Run only after explicit confirmation naming the repo to delete.
gh repo delete mensajerokaos/<DESTINATION_NAME> --yes
```

## Safety Rules

- Do not push to Carlos' `main`.
- Do not force-push.
- Do not use one-shot repo creation that publishes the current clone from a cloned source repo.
- Do not overwrite `origin` or `upstream` without printing and reviewing `git remote -v`.
- Do not use `mensajerokaos/patron-pro` unless the user explicitly names it as the panel destination.
- Do not copy secrets, `.env`, credentials, API keys, cookies, localStorage, deployment keys, browser profile files, or session dumps into the destination.
- Run a real secret scan before the first push:
  - preferred: `trufflehog git file://. --only-verified --no-history`;
  - fallback: `gitleaks detect --no-banner --redact`;
  - grep fallback is advisory only and must not be treated as equivalent to a scanner.
- Inspect Git LFS pointers and submodules before pushing; LFS objects and private submodule URLs can leak or fail after copy.
- Inspect CODEOWNERS before pushing; a fork/copy may expose team/reviewer metadata.
- Treat commit author emails, timestamps, and full source history as metadata that may be exposed by the destination.
- Record source URL, destination URL, FSN1 path, branch, pushed commit, rollback command, and currentness metadata after each execution phase. For the completed fork phase, record the fork URL and no-push boundaries.

## Acceptance Criteria

`ppweb-0ka.6` can close when all of these are true:

- The quality-loop runbook is approved as the strategy artifact.
- The recommended destination is recorded as `mensajerokaos/patronpro-web`.
- The fallback destination is recorded as `mensajerokaos/patronpro-web-experiment`.
- Existing `mensajerokaos/patron-pro` is explicitly marked "avoid unless user overrides."
- The user-approved fork execution is recorded with sanitized evidence.
- The GitHub REST API verifies `mensajerokaos/patronpro-web` is a fork of `wedevio/patronpro-web`.
- FSN1 verifies the fork is reachable by `git ls-remote`.
- The no-push boundary is recorded: no branch push, no local remote rewrite, no Carlos main-branch change, no FSN1 working clone, and no `mensajerokaos/patron-pro` mutation.

The next execution step can proceed only when:

- FSN1 filesystem path is approved for a working clone.
- Pre-push review and secret scan pass in the clone.
- The active branch is confirmed as `feature/onboarding-automation-poc`.
- User explicitly approves the first push.

## Verification Plan

These checks verify the PRD/runbook artifact without mutating remotes:

| Given | When | Then |
| --- | --- | --- |
| The improved PRD is reviewed | Search for `mensajerokaos/patronpro-web` | It appears as the recommended destination and executed fork |
| The improved PRD is reviewed | Search for `mensajerokaos/patron-pro` | It is marked avoid-by-default with the `global` branch risk |
| The runbook is reviewed | Inspect command blocks | No command uses one-shot repo creation with `--source` and `--push` |
| The runbook is reviewed | Inspect push commands | Only `git push -u origin feature/onboarding-automation-poc` is allowed |
| The safety section is reviewed | Search for `license` and `secret scan` | License blocker and scanner requirements are explicit |
| The rollback section is reviewed | Search for `gh repo delete` | It is marked destructive and gated by explicit confirmation |
| The acceptance criteria are reviewed | Compare fork versus push criteria | `ppweb-0ka.6` records the approved fork, and clone/push execution remains gated |

Non-mutating local verification commands:

```bash
grep -n "mensajerokaos/patronpro-web" dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12-improved.md
grep -n "^gh repo create .*--source .*--push" dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12-improved.md && exit 1 || true
grep -n "git push -u origin.*feature/onboarding-automation-poc" dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12-improved.md
grep -n "Post-Approval Execution Record" dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12-improved.md
```

## Handoff To Next Execution Step

Create a separate follow-up bead or later-session task with this minimum description:

```text
Continue approved PatronPro panel fork/copy runbook from ppweb-0ka.6.
Source: wedevio/patronpro-web
Created fork destination: mensajerokaos/patronpro-web
Fallback destination: mensajerokaos/patronpro-web-experiment
FSN1 alias/path: <approved alias/path>
Branch: feature/onboarding-automation-poc
Preconditions: approved FSN1 working path, disk/inode checks, LFS/submodule/CODEOWNERS inspection, secret scan, explicit push approval.
```

## Final Self-Assessment

| Dimension | Score | Rationale |
| --- | ---: | --- |
| Completeness | 10 | Covers confirmed GitHub facts, destination strategy, blockers, FSN1 preflight, LFS, submodules, CODEOWNERS, license metadata, rollback, and execution handoff. |
| Clarity | 9 | Separates the completed fork phase from future clone/push execution and distinguishes current branch from future POC branch. |
| Actionability | 10 | Provides ordered, copy-ready runbook blocks with approval gates, concrete remote names, branch names, and verification commands. |
| Testability | 9 | Adds given/when/then checks plus non-mutating grep verification for the safety-critical assertions. |
| Safety | 10 | Prevents source pushes, avoids unsafe one-shot repo creation, gates all mutations, adds secret scan, metadata warnings, and rollback steps. |
| Total | 48/50 | Approved target met. |

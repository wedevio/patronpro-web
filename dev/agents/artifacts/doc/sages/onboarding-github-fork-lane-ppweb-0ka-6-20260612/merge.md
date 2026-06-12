# Merge: ppweb-0ka.6 GitHub fork/copy lane

Input PRD: `dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12.md`
Mini rerun: `dev/agents/artifacts/doc/sages/onboarding-github-fork-lane-ppweb-0ka-6-20260612/sage-mini-rerun.md`
Mini rerun score: 38/50

## MUST FIX

1. Add concrete GitHub facts discovered after user correction:
   - Source repo: `wedevio/patronpro-web`.
   - GitHub metadata: public repo, default branch `main`, viewer permission `WRITE`, no license metadata.
   - `mensajerokaos/patronpro-web` does not currently exist and is therefore available as the natural fork destination name.
   - `mensajerokaos/patron-pro` exists but default branch `global` suggests a different workspace; do not use it as the panel destination by default.

2. Split strategy bead from execution:
   - `ppweb-0ka.6` should close on approved runbook/strategy and recorded recommended destination.
   - Actual FSN1 fork/copy execution requires explicit user approval and should be a separate follow-up bead or later session.

3. Recommended destination strategy:
   - Preferred: true GitHub fork/copy destination `mensajerokaos/patronpro-web` if approved.
   - Fallback: private mirror/copy `mensajerokaos/patronpro-web-experiment` only if fork is not desired.
   - Avoid existing `mensajerokaos/patron-pro` unless user explicitly says it is the panel workspace.

4. Add FSN1 preflight checks:
   - `gh auth status`, expected user `mensajerokaos`.
   - `git ls-remote https://github.com/wedevio/patronpro-web.git HEAD`.
   - source metadata `gh repo view wedevio/patronpro-web`.
   - destination availability `gh repo view mensajerokaos/patronpro-web` should fail before creation/fork.
   - disk/inode checks for the approved FSN1 path.
   - optional SSH test to GitHub.

5. Fix command safety:
   - Set tracking for local `main` against `upstream/main`.
   - Do not use `gh repo create --push` as a one-shot from a cloned repo.
   - Add mandatory pre-push review with `remote -v`, current branch, log, status, and secret scan.
   - Push only `feature/onboarding-automation-poc` to the Oscar destination with `git push -u origin feature/onboarding-automation-poc`.

6. Add rollback commands:
   - remove mistaken local remote.
   - remove FSN1 working directory.
   - delete mistaken GitHub destination only after explicit confirmation.

7. Add license/compliance blocker:
   - Source repo has no GitHub license metadata. Copy/fork may still be operationally allowed by stakeholder direction, but document that license/legal permission is not machine-verifiable from repo metadata.

## SHOULD FIX

1. Recommend `picturelle-pro-fsn1` as the default FSN1 alias, pending explicit execution approval.
2. Add Git LFS and submodule checks.
3. Add CODEOWNERS/history metadata leakage warning.
4. Make branch naming distinct: `feature/onboarding-automation-poc` is the experiment branch; current worktree branch remains `feature/onboarding-automation`.

## NOT FIXING

1. Do not create a fork or destination repo in this bead.
2. Do not SSH to FSN1 or mutate remote filesystem in this bead.
3. Do not delete or alter existing `mensajerokaos/patron-pro`.
4. Do not try to infer license approval beyond the fact that GitHub reports no license metadata.

## Approval Target

CE merge must produce an improved PRD scored at least 46/50 and ready for implementation as a final runbook/research artifact. The implementation should update `ppweb-0ka.6` as resolved strategy-only, with execution deferred until explicit approval.

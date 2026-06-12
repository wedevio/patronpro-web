## Sage: MiniMax (Depth & Rigor)

### Score: 38/50

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 7/10 | Covers strategy matrix and command templates well; missing license/compliance, LFS, submodule, and SSH-key edge cases. |
| Clarity | 8/10 | Strong separation of "confirmed" vs. "unknown"; some ambiguous phrasing around `feature/onboarding-automation-poc` branch ownership. |
| Actionability | 7/10 | Templates are executable in isolation, but lack pre-flight checks (gh auth, SSH key, network egress) and post-clone verification. |
| Testability | 6/10 | Acceptance criteria are process-shaped, not test-shaped. No given/when/then or verification commands to confirm "safe runbook produced". |
| Safety | 10/10 | Excellent guard rails: no-main-branch, no force-push, secret scan requirement, rollback in RLM, all commands explicitly marked template-only. |

### Strengths (keep these)
- **Confirmed Facts / Unknowns split** (top of file): the explicit "Do not perform remote actions until these are confirmed" guard before any commands is exactly the right hygiene for a depth-first reviewer.
- **Repo Strategy Matrix**: 4-row matrix is comprehensive, including a "do nothing" row, which is rare and good.
- **Safety Rules** section: the prohibition on copying `.env`, cookies, localStorage, deployment keys, plus the secret-scan requirement, is materially better than a typical fork plan.
- **Both `gh repo fork` and `gh repo create` templates** are scoped to mutually exclusive paths, avoiding the common bug of running both.
- **The `git remote -v` and `git status --short --branch` lines in the template** are a small but crucial pre-push sanity gate.
- **Acceptance Criteria** correctly distinguishes "close" from "blocked" — that prevents the classic false-completion bug.

### Logical Issues

| Issue | Severity | Section | Why It's Wrong | Fix |
|-------|----------|---------|----------------|-----|
| `git switch -c feature/onboarding-automation-poc` has no `-u`/push to set upstream tracking | High | Safe FSN1 Command Template | After `git remote add origin`, the new branch is local-only and has no `upstream` tracking ref. Future `git pull`/`git status` will be confusing. | Add `git push -u origin feature/onboarding-automation-poc` after the remote add, gated by a pre-push review step. |
| `git clone --origin upstream` does not set branch tracking for `upstream/main` | Medium | Safe FSN1 Command Template | `--origin` only renames the remote; `origin/main` becomes `upstream/main`, but the local `main` branch's `branch.upstream` config is not set automatically in older git. | Add `git branch --set-upstream-to=upstream/main main` (or use `git branch -u upstream/main`) explicitly. |
| `--remote=false` in `gh repo fork` contradicts the runbook's "Add remotes" step | Medium | Safe FSN1 Command Template | The fork command creates the GitHub-side fork without wiring any local remote. The subsequent `git remote add origin <OSCAR_DESTINATION_REPO_URL>` must know the auto-generated fork URL (`https://github.com/mensajerokaos/<name>.git`), which is not deterministic from the source. | Document that after `gh repo fork` you must `gh repo view <fork> --json url -q .url` to capture the actual fork URL before the `git remote add`. |
| Acceptance criterion "close only if … without needing remote mutation" is self-contradictory | High | Acceptance Criteria | If the strategy is "complete without needing remote mutation", there is nothing to execute on FSN1. The bead should close when the runbook is approved, not when forks are created. The current wording will cause premature close attempts. | Split into two criteria: (a) "runbook approved and destination chosen → close this bead", (b) "execution is a separate downstream bead". |
| "Branch inside existing `mensajerokaos/patron-pro`" risk is understated | Medium | Repo Strategy Matrix, Row 3 | Says "Could mix unrelated PatronPro global notes/code" — but the existing repo's default branch is `global`, which strongly suggests it's a different scope (likely the global config app, not panel). Mixing could silently break the global app. | Replace risk text with: "Existing repo's `global` default branch indicates a different product line; using it as panel workspace risks contaminating unrelated code paths and complicating rollback." |
| Three FSN1 host aliases listed but none recommended | Low | Confirmed Facts | `picturelle-pro-fsn1`, `code2`, and `af-fsn1` are all listed as "FSN1-style hosts". A new operator has no way to know which is correct for this lane; the host may differ in disk quota, network egress, or auth keys. | Add a single-line "Use: `<alias>` — pending confirmation" line, and call it out as a blocker (#4 already says this, but the host choice should be narrowed). |
| No rollback command in the template | Medium | Safe FSN1 Command Template | The runbook says "Record … rollback command in RLM" but the template itself shows no rollback. If the operator runs it and breaks something, the cleanup (`git remote remove origin`, `rm -rf panel-fork`, removing the GitHub fork via `gh repo delete`) is undocumented. | Add a parallel "Rollback Commands" block gated on the same preconditions. |
| The bead's own branch name `feature/onboarding-automation` does not match the runbook branch `feature/onboarding-automation-poc` | Low | Goal / Proposed Default Strategy | Without a mapping, downstream readers will be unsure whether `poc` is intended, or whether it's a typo. | Either justify the `-poc` suffix ("proof of concept vs. ongoing automation") or align the two names. |
| Strategy Matrix row 4 ("Current `wedevio/patronpro-web` only") contradicts the "Do not perform remote actions" guard | Low | Repo Strategy Matrix | Row 4's risk column says "Not Oscar-owned; direct pushes could affect team repo" but does not say "explicit approval is also required before any read or clone, not just writes." Even `git clone` of a private repo can leak access via local logs. | Add to the Required confirmation column: "Confirm clone is permitted even if no push will occur." |
| `gh repo create … --push` will push all current commits, including any uncommitted WIP that came from the clone | High | Safe FSN1 Command Template, second block | The template clones `main` (with history), then `gh repo create --push` pushes the whole `main` branch to a new repo named as the destination. This effectively ships Carlos' `main` snapshot to a fresh repo, which may not be the intent. | Add `git checkout --orphan main-clean && git rm -rf .` (or equivalent) and a comment explaining that `--push` should target a feature branch, not the cloned `main`. At minimum, add a `git log --oneline -5` verification step. |

### Missing Edge Cases

| Edge Case | Impact | Where to Add | Suggested Implementation |
|-----------|--------|--------------|--------------------------|
| Carlos' repo is private and Oscar lacks fork permission | High | Unknowns / Blockers, item #1 | Add explicit permission check: `gh repo view wedevio/patronpro-web --json isPrivate,viewerPermission -q '{isPrivate,perm}'`. Forking a private repo requires `ADMIN` on the source, which Oscar may not have. |
| Source has Git LFS pointers | Medium | Safe FSN1 Command Template | Add `git lfs install && git lfs fetch --all` to the template, and a note that the secret scan must also cover LFS objects (which are not in regular git history). |
| Source has submodules with private URLs | Medium | Safe FSN1 Command Template | Add `git submodule status` check after clone; submodules may fail to clone if the FSN1 host has no credentials, breaking downstream builds. |
| `gh` CLI not authenticated on FSN1 | High | Safety Rules / Pre-flight | Add a mandatory pre-flight line: `gh auth status 2>&1 | head -5` and refuse to proceed if not logged in as `mensajerokaos`. |
| License on Carlos' repo is restrictive (e.g., proprietary, AGPL, or no LICENSE file) | Medium | Unknowns / Blockers | Add a fifth blocker: "Confirm license permits downstream copy/fork into Oscar's namespace; document license in RLM." |
| Disk usage and inode budget on FSN1 | Low | Safe FSN1 Command Template | Add `df -h /opt/patronpro` and `df -i /opt/patronpro` pre-flight. |
| Network egress from FSN1 to github.com | Low | Pre-flight | Add `curl -sI https://github.com | head -1` or `git ls-remote https://github.com/wedevio/patronpro-web.git HEAD` as a connectivity check. |
| Branch protection on `mensajerokaos/patron-pro` `global` branch | Medium | Strategy Matrix Row 3 | If the existing repo has protected branches, pushing a new branch with the same name as an existing one is impossible. Add a `git ls-remote https://github.com/mensajerokaos/patron-pro.git` check. |
| SSH key on FSN1 for github.com | High | Safety Rules | The plan assumes `gh` will work; if FSN1 is using HTTPS-only auth, `gh repo fork` may fail with auth errors. Add `ssh -T git@github.com 2>&1 | head -1` check. |
| Carlos' repo has a `CODEOWNERS` file | Low | Strategy Matrix Row 1 | A fork inherits `CODEOWNERS` and may auto-assign reviewers, which can leak Carlos' team structure. Document this side-effect explicitly. |
| Source has large file history (e.g., committed binaries) | Low | Safe FSN1 Command Template | Add `git count-objects -vH` and `du -sh .git` to the runbook to detect large clones that may exhaust FSN1 quota. |
| Operator runs the template as root on FSN1 | Low | Safe FSN1 Command Template | The template does not specify the user. `mkdir -p /opt/...` typically requires root. Add a "user assumed" line. |
| Time zone / commit metadata leakage | Low | Safety Rules | Pushing the cloned history to a new repo exposes commit author emails and timestamps. If the panel is proprietary, this leaks Carlos team's contributor list. Add a note. |

### Concrete Improvements

1. **Add pre-flight block to template** (Section: Safe FSN1 Command Template)
   CURRENT:
   ```bash
   ssh picturelle-pro-fsn1
   mkdir -p /opt/patronpro/experiments
   cd /opt/patronpro/experiments
   git clone --origin upstream https://github.com/wedevio/patronpro-web.git panel-fork
   ```
   PROPOSED:
   ```bash
   ssh picturelle-pro-fsn1
   # PRE-FLIGHT (must all pass before continuing)
   gh auth status 2>&1 | grep -q 'mensajerokaos' || { echo "gh not authed as mensajerokaos"; exit 1; }
   ssh -T git@github.com 2>&1 | head -1
   git ls-remote https://github.com/wedevio/patronpro-web.git HEAD >/dev/null || { echo "Cannot reach source"; exit 1; }
   df -h /opt/patronpro | tail -1
   df -i /opt/patronpro | tail -1
   gh repo view wedevio/patronpro-web --json isPrivate,viewerPermission -q '{isPrivate: .isPrivate, perm: .viewerPermission}'
   # END PRE-FLIGHT
   mkdir -p /opt/patronpro/experiments
   cd /opt/patronpro/experiments
   git clone --origin upstream https://github.com/wedevio/patronpro-web.git panel-fork
   ```

2. **Add tracking branch setup and push** (Section: Safe FSN1 Command Template, after `git remote add origin`)
   CURRENT:
   ```bash
   git remote add origin <OSCAR_DESTINATION_REPO_URL>
   git remote -v
   git branch --show-current
   git status --short --branch
   ```
   PROPOSED:
   ```bash
   git remote add origin <OSCAR_DESTINATION_REPO_URL>
   git remote -v
   git branch --set-upstream-to=upstream/main main
   git branch --show-current
   git status --short --branch
   # PRE-PUSH REVIEW (mandatory)
   echo "About to push: $(git branch --show-current) -> $(git remote get-url origin)"
   echo "Source upstream: $(git remote get-url upstream)"
   echo "Last 5 commits to be pushed:"
   git log --oneline -5
   echo "Secret scan (must be clean):"
   trufflehog git file://. --only-verified --no-history 2>/dev/null || gitleaks detect --no-banner --redact || echo "Install trufflehog or gitleaks and re-run"
   git push -u origin feature/onboarding-automation-poc
   ```

3. **Add explicit rollback block** (Section: Safe FSN1 Command Template, end of file)
   CURRENT: (none)
   PROPOSED:
   ```bash
   # ROLLBACK (run only if push failed or destination was wrong)
   git remote remove origin
   cd ..
   rm -rf panel-fork
   # To delete the GitHub-side fork if one was created:
   gh repo delete mensajerokaos/<DESTINATION_NAME> --yes
   ```

4. **Split acceptance criteria to remove contradiction** (Section: Acceptance Criteria)
   CURRENT:
   - Updates `ppweb-0ka.6` status honestly:
     - close only if source/destination are confirmed and the strategy is complete without needing remote mutation,
     - otherwise mark/update as blocked on final destination repo decision and FSN1 execution path.
   PROPOSED:
   - Updates `ppweb-0ka.6` status honestly:
     - close this bead when (a) the runbook is approved, (b) the destination repo decision is recorded, and (c) the FSN1 path is approved,
     - record any unresolved items as a new blocking bead (e.g., `ppweb-0ka.7`) for the actual fork/copy execution,
     - do not mark this bead as "in execution"; this bead is strategy-only.

5. **Tighten Strategy Matrix Row 3 risk** (Section: Repo Strategy Matrix)
   CURRENT:
   | Branch inside existing `mensajerokaos/patron-pro` | Existing repo is the intended Oscar workspace | Reuses current private repo | Could mix unrelated PatronPro global notes/code | Confirm repo role and branch policy |
   PROPOSED:
   | Branch inside existing `mensajerokaos/patron-pro` | Existing repo is the intended Oscar workspace | Reuses current private repo | Default branch `global` indicates a different product line; risk of contaminating unrelated PatronPro global code paths and complicating rollback | Confirm `global` branch scope, branch protection, and that this repo is not the global PatronPro app |

6. **Add license/compliance blocker** (Section: Unknowns / Blockers, after item #4)
   CURRENT:
   4. Which FSN1 host alias and filesystem path are approved for this PatronPro panel lane.
   PROPOSED:
   4. Which FSN1 host alias and filesystem path are approved for this PatronPro panel lane.
   5. Whether the source repo's license permits a downstream copy/fork into `mensajerokaos` and whether the destination should preserve `LICENSE`/`NOTICE` files.

7. **Add secret-scan command to Safety Rules** (Section: Safety Rules)
   CURRENT:
   - Run a secret scan before the first push.
   PROPOSED:
   - Run a secret scan before the first push. Acceptable tools (run from FSN1 inside the clone):
     - `trufflehog git file://. --only-verified --no-history`
     - `gitleaks detect --no-banner --redact`
     - Fallback: `git log -p | grep -E '(BEGIN [A-Z]+ PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36})' || echo "no obvious secrets"`
   - Scan must cover `.env*`, `*.pem`, `*.key`, `id_rsa*`, `secrets.*`, and any `localStorage`/cookie dumps if they exist in the source.

8. **Recommend a single FSN1 alias** (Section: Confirmed Facts)
   CURRENT:
   - Local SSH config has FSN1-style hosts pointing to `178.105.13.63`: `picturelle-pro-fsn1`, `code2`, and `af-fsn1`.
   PROPOSED:
   - Local SSH config has FSN1-style hosts pointing to `178.105.13.63`: `picturelle-pro-fsn1`, `code2`, and `af-fsn1`. **Recommended default for this lane: `picturelle-pro-fsn1`** (pending explicit approval in blocker #4).

### Implementation Correctness

**Verified commands (no change needed):**
- `git clone --origin upstream <url> <dir>` — valid in git 2.x+; renames the default `origin` to `upstream`. FILE: Safe FSN1 Command Template, line 1 of bash block.
- `git switch -c feature/onboarding-automation-poc` — valid; creates a new branch from HEAD with checkout. FILE: same block.
- `git remote add origin <url>` — valid; fails if `origin` already exists, which is the desired safety property here. FILE: same block.
- `gh repo fork wedevio/patronpro-web --clone=false --remote=false --fork-name <DESTINATION_NAME>` — valid syntax; verified against `gh repo fork --help` (clone=false, remote=false, fork-name all real flags). FILE: same block, second bash block.
- `gh repo create mensajerokaos/<DESTINATION_NAME> --private --source . --remote origin --push` — valid syntax; `--source .` requires being inside an existing repo, `--remote origin` sets the local remote, `--push` pushes the current branch. FILE: same block, third bash block.

**Commands that need fixes (already covered in Concrete Improvements):**
- Missing `git branch --set-upstream-to=upstream/main main` after clone.
- Missing `git push -u origin feature/onboarding-automation-poc` after the template's "review" lines.
- `--push` flag in `gh repo create` will ship the cloned `main` history to a brand-new repo; needs an explicit "push only the feature branch" guard.

**Subtle but correct detail:**
- `git status --short --branch` correctly shows `[ahead/behind]` info once tracking is set up. It will show nothing useful if tracking isn't set — another reason to add the `--set-upstream-to` line.

**No FILE:LINE references possible** because the document does not have line numbers and is a single-file markdown PRD; all references are by section heading above.

### Dependency & Ordering Issues

1. **Decision order is implicit, not explicit.** The document lists four blockers but does not state which must be resolved first. Recommended order:
   1. License/permission on source (blocks everything else).
   2. Destination choice (blocker #1) — once decided, blockers #2 and #3 become deterministic.
   3. Carlos handoff model (blocker #3) — informs whether to set up `upstream` PR path.
   4. FSN1 host + path (blocker #4) — only matters once a destination exists to push to.

2. **Pre-flight must precede mkdir.** Currently the template goes straight to `mkdir -p` after `ssh`. If `gh` is not authenticated, the subsequent `gh repo create` will fail *after* the directory is created, leaving a half-set-up state. Add the pre-flight block first (see Concrete Improvement #1).

3. **The "Confirmed Facts" entry for `mensajerokaos/patron-pro` (private, default branch `global`)** is mentioned but never referenced again in the ordering. It should be made a precondition: "If destination is `mensajerokaos/patron-pro`, first verify that the new feature branch will not collide with existing `feature/onboarding-automation-poc`."

4. **The bead `ppweb-0ka.6` itself has no parent bead named.** If there is a parent epic `ppweb-0ka`, the relationship should be stated in the Goal section so a reviewer can verify scope fit.

5. **Two-phase split is implied but not named.** The strategy-phase (this bead) and execution-phase (a follow-up bead) should be explicitly named, with the handoff documented. Otherwise, downstream operators will treat this bead as actionable.

---

**Bottom line for the merge pass:** the document is *safe-by-default* and *explicitly non-executing*, which is the right posture. The main risks are (a) the `gh repo create --push` accidentally shipping the cloned `main`, (b) the contradiction in the acceptance criteria that could cause premature close, and (c) the missing permission/license pre-flight that could let an operator discover too late that the fork is blocked. All three are addressable with the proposed text replacements above. Score: **38/50** — solid draft, three concrete fixes away from ship-ready.

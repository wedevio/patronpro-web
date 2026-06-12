## Sage: MiniMax (Depth & Rigor)

### Score: 38/50

Re-scored across the 5-dimension rubric:

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Completeness | 7/10 | Covers goals, blockers, strategies, and command templates. Missing: rollback procedure, prerequisites on FSN1 (`gh` auth, SSH keys, LFS), submodule handling, branch collision check. |
| Clarity | 8/10 | Well-structured with matrices, tables, and explicit "do not run" callouts. Naming inconsistency between `feature/onboarding-automation` and `feature/onboarding-automation-poc` causes confusion. |
| Actionability | 7/10 | Templates are concrete, but several placeholders (`<CARLOS_SOURCE_REPO_URL>`, `<OSCAR_DESTINATION_REPO_URL>`, `<CARLOS_OWNER>/<CARLOS_REPO>`, `<DESTINATION_NAME>`) need a checklist for which decisions unlock which template. |
| Testability | 7/10 | "Acceptance Criteria" is a checklist, but no dry-run / verification commands for the runbook itself, no negative-test cases, and no idempotency check for the `mkdir -p` + `git clone` sequence. |
| Safety | 9/10 | Strong on no-main-push, no force-push, secret scan reminder, no remote mutation. Slight gap: no explicit pre-flight `git remote -v` printout, no `--dry-run` for `gh repo fork`. |

---

### Strengths (keep these)

- **Section "Unknowns / Blockers"** is excellent — explicitly enumerates 5 prerequisites that gate all remote action. This is the single most important safety property in the document.
- **Section "Repo Strategy Matrix"** is well-designed: 4 strategies × 4 columns (When/Pros/Risk/Confirmation) makes the decision path explicit and auditable.
- **Section "Safety Rules"** has 7 concrete guardrails (no main push, no force-push, no secret copying, mandatory secret scan, branch isolation, RLM trace). Particularly strong: "Run a secret scan before the first push" — this is often forgotten.
- **Section "Goal"** correctly scopes the bead to "executable runbook and blocker register" rather than execution itself. This prevents scope creep.
- **Section "Acceptance Criteria"** has a subtle but valuable distinction: it allows the bead to close *if* the strategy is complete *without* remote mutation, separating documentation completion from execution completion.

---

### Logical Issues

| Issue | Severity | Section | Why It's Wrong | Fix |
|-------|----------|---------|----------------|-----|
| Branch header mismatch | Medium | Header vs. "Proposed Default Strategy" | The document's frontmatter declares `Branch: feature/onboarding-automation`, but the proposed new branch is `feature/onboarding-automation-poc`. The two are not equivalent — readers will assume they're the same. | Add an explicit "Note: the automation worktree branch (`feature/onboarding-automation`) is distinct from the experimental branch (`feature/onboarding-automation-poc`) that the runbook creates on FSN1." |
| SSH host assumed in template | High | "Safe FSN1 Command Template" | The template hard-codes `ssh picturelle-pro-fsn1` while Unknown #5 explicitly says "Which FSN1 host alias is the approved execution alias" is unconfirmed. The template contradicts the unknown. | Replace the literal `picturelle-pro-fsn1` with a `<FSN1_ALIAS>` placeholder, or add a banner: "Substitute the confirmed alias; do not run with `picturelle-pro-fsn1` until Unknown #5 is resolved." |
| `gh repo fork` may fail silently for private repos | High | "Safe FSN1 Command Template" (fork block) | If Carlos' source repo is private, `gh repo fork` requires the FSN1 user to have read access. The strategy matrix acknowledges this risk in the "fork" row, but the template does not include a permission check. | Add a pre-flight: `gh repo view <CARLOS_OWNER>/<CARLOS_REPO>` before `gh repo fork`, and a documented failure path. |
| `gh repo fork --remote=false` then manual `git remote add origin` | Medium | Same | The template clones from `upstream` (Carlos' URL) but pushes to a manually-added `origin`. This works *only* if the manually-added `origin` is the fork URL. If the operator copy-pastes the source URL twice, the first push will go to Carlos' repo. The current `Safety Rules` do not call this out. | Add a safety rule: "After `git remote add origin`, immediately run `git remote -v` and confirm Oscar's URL appears ONLY in the `origin (push)` line." |
| Acceptance criterion "close only if strategy is complete without needing remote mutation" is self-contradictory | Medium | "Acceptance Criteria" | If the strategy is complete, the bead is done — but the strategy *exists to* enable future remote mutation. The criterion conflates "document is final" with "no future work is needed." | Rephrase: "close if source/destination are confirmed AND the runbook is complete AND no remote mutation is required *as part of closing this bead*; otherwise mark blocked." |
| `mkdir -p` + `git clone` is not idempotent | Low | "Safe FSN1 Command Template" | If `/opt/patronpro/experiments/panel-fork` already exists (e.g., from a prior aborted run), `mkdir -p` succeeds but `git clone` fails with "destination path already exists." No rollback is described. | Add: `test -d panel-fork && echo "ABORT: existing dir" && exit 1` before clone, or add a documented `rm -rf` step with confirmation. |
| Path requires root | Medium | "Proposed Default Strategy" | `/opt/...` and `/srv/...` both typically require root on a hardened FSN1. The document does not address sudo / ownership. | Add a note: "Both `/opt` and `/srv` require root on most FSN1 layouts. Prefer a user-owned path such as `~/patronpro/experiments/panel-fork` unless sudo is explicitly authorized." |

---

### Missing Edge Cases

| Edge Case | Impact | Where to Add | Suggested Implementation |
|-----------|--------|--------------|--------------------------|
| `gh` CLI not installed / unauthenticated on FSN1 | High — `gh repo fork` / `gh repo create` fail with cryptic error | Add a "Prerequisites" section before "Safe FSN1 Command Template" | Insert: `command -v gh && gh auth status` as a pre-flight check; document install path if missing. |
| SSH key access from FSN1 to GitHub | High — clone fails with permission denied | "Prerequisites" section | Insert: `ssh -T git@github.com` to verify key is loaded; if not, document `ssh-add` and key forwarding. |
| Submodules in Carlos' source repo | Medium — incomplete checkout | Inside the `git clone` line or as a follow-up | Add a follow-up: `git submodule update --init --recursive` and note that nested submodules may have their own secrets. |
| Git LFS in source repo | Medium — `git clone` succeeds but pointer files are checked out, not blobs | "Prerequisites" section | Add: `git lfs install` (once per user) before clone, and `git lfs fetch --all` after clone. |
| Branch `feature/onboarding-automation-poc` already exists in destination | Low — `git switch -c` fails, requires `-C` or cleanup | Inside the `git switch` line | Add: `git ls-remote origin refs/heads/feature/onboarding-automation-poc` before the switch; if present, abort or use a suffixed name. |
| Existing `mensajerokaos/patron-pro` already has a `main` with content | Medium — `gh repo create` with `--source .` will reject (destination not empty) only in the *new* repo case, but a *branch* into existing repo is fine; the doc doesn't disambiguate | "Repo Strategy Matrix" + fork flow | Add a row in the matrix: "Pre-check: `git ls-remote <DESTINATION>` to confirm `main` is empty or expected." |
| Carlos' repo requires 2FA / signed commits | Low — `git push` rejected | "Safety Rules" or runbook footer | Add a rule: "Confirm commit signing policy on destination before first push." |
| `git push` without `--set-upstream` fails on first push | Low — operator confusion | `git push` line (currently missing) | The template does not include a `git push` line at all. Add: `git push -u origin feature/onboarding-automation-poc` *only after* `git remote -v` confirms Oscar's URL. |
| `gh repo fork` rate limit / fork network depth | Low — fork may not be allowed by repo policy | Fork strategy row in matrix | Add a Risk column entry: "GitHub may refuse to fork if the source's fork network is full or has policy restrictions." |
| Network egress from FSN1 to `github.com:443` and `git://` | Low — clone hangs | "Prerequisites" | Add: `curl -sI https://github.com` to verify egress. |

---

### Concrete Improvements

1. **Add a "Prerequisites" section** (insert before "Safe FSN1 Command Template")
   CURRENT: (no such section; the template starts immediately after the strategy)
   PROPOSED:
   ```markdown
   ## Prerequisites on FSN1

   Run these checks before any clone. All must succeed.

   ```bash
   # 1. Confirm the approved alias (replaces Unknown #5).
   ssh <FSN1_ALIAS> "echo connected"

   # 2. Confirm gh CLI is installed and authenticated.
   command -v gh && gh auth status

   # 3. Confirm SSH key for GitHub is loaded.
   ssh -T git@github.com

   # 4. Confirm egress to GitHub.
   curl -sI https://github.com | head -n1

   # 5. Confirm Git LFS is configured (only if source uses LFS).
   git lfs version
   ```

   Abort the runbook if any check fails. Do not proceed with `gh repo fork` or
   `gh repo create` if `gh auth status` is non-zero.
   ```

2. **Replace the literal SSH host with a placeholder** (Section: "Safe FSN1 Command Template")
   CURRENT:
   ```bash
   ssh picturelle-pro-fsn1
   mkdir -p /opt/patronpro/experiments
   cd /opt/patronpro/experiments
   git clone --origin upstream <CARLOS_SOURCE_REPO_URL> panel-fork
   cd panel-fork
   git switch -c feature/onboarding-automation-poc
   git remote add origin <OSCAR_DESTINATION_REPO_URL>
   git remote -v
   git branch --show-current
   git status --short --branch
   ```
   PROPOSED:
   ```bash
   # Substitute the alias confirmed by Unknown #5. Do not hard-code.
   ssh <FSN1_ALIAS>
   mkdir -p ~/patronpro/experiments
   cd ~/patronpro/experiments
   test -d panel-fork && { echo "ABORT: panel-fork already exists"; exit 1; }
   git clone --origin upstream <CARLOS_SOURCE_REPO_URL> panel-fork
   cd panel-fork
   git switch -c feature/onboarding-automation-poc
   # MANDATORY: confirm the URL below is OSCAR's, not Carlos'.
   git remote add origin <OSCAR_DESTINATION_REPO_URL>
   git remote -v
   git branch --show-current
   git status --short --branch
   # Pre-push verification: ensure origin (push) is Oscar's URL.
   git remote get-url --push origin
   ```

3. **Disambiguate the two branch names** (Section: Frontmatter "Branch" + "Proposed Default Strategy")
   CURRENT:
   ```
   Branch: `feature/onboarding-automation`
   ```
   PROPOSED:
   ```
   Branch: `feature/onboarding-automation` *(this PRD's worktree — not the experimental branch)*

   Experimental branch to be created on FSN1: `feature/onboarding-automation-poc`
   ```

4. **Rephrase the contradictory acceptance criterion** (Section: "Acceptance Criteria")
   CURRENT:
   ```
   - close only if source/destination are confirmed and the strategy is complete without needing remote mutation,
   - otherwise mark/update as blocked on exact Carlos source URL and final destination repo decision.
   ```
   PROPOSED:
   ```
   - close if source/destination are confirmed AND the runbook is final AND no remote mutation is required *as part of closing this bead*,
   - otherwise mark/update as blocked on exact Carlos source URL and final destination repo decision.
   ```

5. **Add an explicit `git push` line with safety check** (Section: "Safe FSN1 Command Template" — append after the existing block)
   CURRENT: (no push line in template)
   PROPOSED:
   ```bash
   # Run secret scan before first push.
   # (Document the scanner choice — e.g., gitleaks detect --no-git)
   # Only push after confirming:
   #   1. origin (push) is Oscar's URL
   #   2. current branch is feature/onboarding-automation-poc
   #   3. secret scan is clean
   #   4. no secrets, .env, credentials, cookies in diff
   git push -u origin feature/onboarding-automation-poc
   ```

---

### Implementation Correctness

- **VERIFY command for blocker status**: The doc declares blockers but provides no scripted verification. Suggested:
  ```bash
  # Run from the PRD's worktree; should print UNRESOLVED for each open unknown.
  grep -E '^[0-9]+\.' dev/agents/artifacts/doc/plan/onboarding-github-fork-lane-ppweb-0ka-6-2026-06-12.md | head -n5
  ```
  No FILE:LINE check is needed because the PRD is a static document; the verification is human.

- **`git clone --origin upstream <URL> panel-fork`**: Correct. `--origin` sets the cloned remote's name to `upstream` instead of the default `origin`. This is the right call because the cloned repo *is* Carlos' upstream.

- **`git switch -c feature/onboarding-automation-poc`**: Correct. Creates and switches. Does not fail if branch exists on the server but not locally; only fails if branch exists locally. The missing edge case (existing local branch) is addressed in the "Missing Edge Cases" table above.

- **`gh repo fork --clone=false --remote=false --fork-name <DESTINATION_NAME>`**: Correct syntax (gh 2.x). `--remote=false` is the right choice because we will add `origin` manually to point to the fork URL. However, the operator must retrieve the fork URL after this command:
  ```bash
  gh repo fork wedevio/patronpro-web --clone=false --remote=false --fork-name patronpro-panel-experiment
  gh repo view mensajerokaos/patronpro-panel-experiment --json url -q .url
  ```
  This follow-up is **not** in the document and should be added.

- **`gh repo create mensajerokaos/<DESTINATION_NAME> --private --source . --remote origin --push`**: Correct. `--source .` uses the current directory as the initial commit source; `--push` pushes the local default branch. **Risk**: this will push the default branch of the *just-cloned* repo (which will be Carlos' default, likely `main`). The doc must explicitly say: "After this command, immediately delete the default branch on the destination or rename it to avoid exposing Carlos' `main` history verbatim." This is a real correctness gap.

- **BEFORE/AFTER diff example for safety rules**: Currently the doc says "Run a secret scan before the first push" but does not name a tool or command. Replace with:
  ```bash
  gitleaks detect --no-git --source . -v
  # or, if gitleaks unavailable:
  grep -rE '(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36})' .
  ```

---

### Dependency & Ordering Issues

1. **Ordering problem**: Unknowns are listed 1–5, but the runbook needs them in a different order:
   - Unknown #5 (FSN1 alias) is the **first** gate (must be resolved before even SSHing).
   - Unknown #1 (Carlos source URL) is the **second** gate (must be resolved before clone).
   - Unknown #2 (what is `wedevio/patronpro-web`?) is actually a **meta-unknown** that may invalidate Unknowns #1 and #3 — if `wedevio/patronpro-web` *is* Carlos' repo, then we already have the source URL.
   - Unknowns #3 and #4 can be partially resolved in parallel with #1 and #5.

   **Fix**: Add a "Resolution Order" subsection inside "Unknowns / Blockers" that explicitly sequences the gates: `#5 → #2 → #1 → #3 → #4`.

2. **Missing prerequisite for `gh repo fork`**: The doc does not state that the operator must be a member of the `mensajerokaos` GitHub org (or owner of `mensajerokaos`) for `gh repo create mensajerokaos/...` to succeed. Add this to Unknowns as #6: "Operator has `mensajerokaos` org membership with `repo` scope."

3. **Implicit ordering assumption**: The doc assumes `ppweb-0ka.6` can be closed *before* the fork/copy is executed. This is correct for a documentation bead but should be made explicit: "This bead is documentation only. The first executable bead is `ppweb-0ka.7` (or successor), which will run the verified runbook."

4. **Branch isolation rule is underspecified**: "Keep the branch name separate from this automation worktree unless explicitly asked" — the automation worktree is `feature/onboarding-automation` and the proposed experimental branch is `feature/onboarding-automation-poc`. These are *already* separate, so the rule reads as a no-op. Clarify: "Do not push `feature/onboarding-automation` (this worktree's branch) to any remote. The experimental branch `feature/onboarding-automation-poc` lives only on FSN1 and Oscar's destination repo."

5. **Strategy matrix ordering vs. bead close criterion**: The matrix lists "GitHub fork" first as the preferred default, but the "Acceptance Criteria" allow closing on a *private copy*. These are consistent (default ≠ required), but a reader could conflate them. Add a one-line note: "Default strategy is the fork path; private copy is the fallback if fork is denied."

---

### Final Notes

The PRD is solid and the safety posture is strong. The primary failure modes are: (a) template uses a hard-coded SSH host that contradicts an open unknown, (b) the `gh repo fork` flow is missing a post-fork URL retrieval step that breaks the manual `git remote add origin` step, and (c) the `gh repo create --push` flow will push Carlos' `main` history verbatim unless mitigated. None of these are fatal — all are addressable with the edits above. The bead should remain **blocked** until at least Unknowns #1, #2, and #5 are resolved.

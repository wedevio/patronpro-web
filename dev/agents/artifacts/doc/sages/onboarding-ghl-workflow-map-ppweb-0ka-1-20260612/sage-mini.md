# Mini Sage Review — `onboarding-ghl-workflow-map-ppweb-0ka-1-2026-06-12`

## Score: 35 / 50 (BLOCKING — well below the 46/50 self-set threshold)

| Dim | Score | Rationale |
|---|---|---|
| Completeness | 7/10 | 4 wf + 4 status + 4 evidence + 5 fail modes; weak on `approved-export` path, RLM-prior summaries, meeting-invite gap definition, `ppweb-0ka.2/3` scope |
| Clarity | 8/10 | IDs/branch/schema explicit; weak on auth method, "metadata-only" judgment owner, "approved-export" approval mechanism, response-body PII scrub |
| Actionability | 6/10 | Paths concrete; weak on actual CLI invocations (curl/`bun`/1Password), CDP-availability probe, JSON shape for redacted probe, screenshot redaction procedure |
| Testability | 6/10 | 4-status taxonomy checkable; weak on "machine-checkable" claim (no validator, no fixture), subjective "explicit"/"clearly" language, no replay path |
| Safety | 8/10 | No-mutation + no-secrets + Profile-9-only + "stop and report" rules explicit; weak on no-mutation *proof* artifact, "approved-export" loophole, screenshot scrub, 1Password CLI log-leak, response-body PII |

---

## Must-Fix (gate the score ≥ 46)

**M1. "Approved-export" is a loophole, not a path.** Schema names `approved-export` as a valid evidence source but PRD never defines (a) how the export is produced (GHL UI Workflows → Export), (b) who approves it, (c) where the resulting file is stored, (d) what the parser does with it. Either flesh it out or drop the value from the schema and require Profile-9 UI for non-API evidence.

**M2. "Meeting-invite gap" is asserted, not defined.** Goal says the map must show "where the missing meeting-invite/calendar-add flow belongs" but the schema field `meeting-invite gap assessment` has no rubric. State explicitly: which trigger is missing the calendar-create action, what GHL capability is absent (workflow action? native calendar event? SMTP `.ics`?), and which workflow slot the future `ppweb-0ka.2/.3` slice will own.

**M3. RLM-prior evidence is unnamed.** Two prior pattern files are listed by path but the PRD does not summarize which of the 4 workflows each one already proves. Without that, the "RLM-prior" status could be assigned to fields the prior never actually established. Add a one-line "what this proves / what is still open" per prior, and a reconciliation rule when fresh API evidence contradicts the prior.

**M4. Auth method and 1Password injection path are unspecified.** "If GHL credentials can be injected safely" is hand-wavy. Specify: token type (Bearer / `Authorization: Bearer` / `Token-...`?), injection mechanism (`op read "op://Picturelle/GHL - PatronPro - api key - MAIN/credential" | xargs curl -H @- …` or a bun helper), and the log-scrubbing rule for the surrounding shell. Without this, "metadata-only" is not auditable.

**M5. No command-level API probe in Implementation Plan §1.** "Run a read-only API probe for `GET /workflows/?locationId=…`" — with what? curl? a `bun` script? prior harness? Provide the exact invocation, the timeout, the user-agent header, and the response-body truncation rule (e.g., "first 2 KiB of each workflow object, no inner action arrays").

**M6. "Screenshot safe" is undefined.** Optional UI work captures one screenshot per workflow page. What is "safe"? Define a redaction procedure: scrub URL bar, command palette, profile avatar menu, any drawer that may surface `accountId`/`userId`. Either build the redactor into a `safe-screenshot` bun helper or rule screenshots out entirely.

**M7. No no-mutation *proof* artifact.** "No live GHL mutation" is asserted but the artifact set has no pre/post `GET /workflows/` hash diff. A future reviewer cannot verify the no-mutation claim from artifacts alone. Add `ghl-onboarding-workflows-api-probe-precheck-2026-06-12.json` (or include a `preRunHash` and `postRunHash` field in the probe JSON) so the claim is checkable, not asserted.

---

## Should-Fix (raise quality, do not gate)

**S1. Typo carried silently.** Workflow 1 is "Onboaring Link Send". If the GHL workflow is named that way the report must say so explicitly and explain the typo (likely source: the original workflow was hand-typed). If the API returns "Onboarding …", the report must record both spellings and which is canonical. Currently the PRD neither flags nor normalizes.

**S2. `ppweb-0ka.2/.3` referenced but undefined.** Acceptance criteria ties the gap to "future `ppweb-0ka.2` and `ppweb-0ka.3` slices" but the epic scope for those is absent. Add a single sentence each: "`ppweb-0ka.2` = …; `ppweb-0ka.3` = …" or a one-line "see epic `ppweb-0ka`" if they exist in `.beads/issues.jsonl`.

**S3. `not_found` vs `blocked` is unambiguous, but the close-bead rule for each is not.** Acceptance §1 says all four must be "represented" but PRD §Implementation §7 says "close it only if the workflow map clearly separates proven metadata from blocked internals." What if all four are `not_found`? Or three are `blocked`? Specify: close, keep-open, or open a follow-up bead per terminal state.

**S4. Response-body PII not in scope of "no secrets".** Workflow objects may carry `createdBy`, `accountId`, `locationId`, user display names, email addresses of internal staff. The guardrail says no tokens/cookies but not no-PII. Add a scrub list (or call out that workflow objects are PII-light and the rule is intentional).

**S5. Failure mode "rate limiting" leaves a judgment call.** "Store status and rate-limit headers if safe" — define "safe" (no tokens, no `Set-Cookie`, no `Authorization` echo, no user-id-bearing headers). Or: scrub the headers to status code only.

**S6. CDP-availability check is undefined.** Implementation §4 says "Attempt Profile 9 only if CDP is already available". Add the check: `curl -fsS http://localhost:9222/json/version` (or whatever port the WSL Profile-9 helper uses) and what to do with the output.

**S7. CHANGELOG entry shape is unspecified.** §Implementation §6 says "Update `CHANGELOG.md` with the read-only result" — give the template so the entry is diffable and machine-parseable: e.g., `- Read-only GHL workflow probe for location hHLZC7FaTtUINPf3cbHd: N proven, M partial, K blocked, J not_found. Artifacts: …`.

**S8. CHANGELOG context collision.** 2026-06-10 entry shows a prior pass *did* mutate GHL (Add Contact form, language/DND) via UI. The current PRD correctly restricts to read-only, but a future reviewer skimming the changelog could conflate the two. State the read-only boundary in the bead close note and the CHANGELOG entry so the distinction is explicit.

**S9. No "what to do if RLM-prior is the only source" verification.** If the API probe fails for any reason and the map is RLM-prior-only, the four workflows are still in the map but with `evidence_source: rlm-prior` on every field. Define: does the report still close the bead, or is the bead kept open pending live proof?

**S10. `dev/agents/artifacts/doc/test/onboarding-automation/` is new.** First artifact written there. State retention policy (matches the L5 finding in the prior sage-mini review) — is this directory gitignored, git-tracked, ephemeral, archived on close?

---

## Residual Risks (not necessarily fixable in this PRD, but documented for the operator)

- **GHL response shape drift.** `GET /workflows/` v3 is documented but field names can change without notice. The PRD acknowledges "endpoint shape drift" as a failure mode but the recovery is "store top-level keys, mark parsing blocked" — which means the map is potentially thin on first run.
- **Profile-9 authentication drift.** PatronPro main-account token may not authorize subaccount/location reads. The PRD does not test for this; a 401 from `GET /workflows/?locationId=…` against a company-level token is plausible.
- **1Password CLI not on PATH.** `op` may be missing on the operator's WSL shell. The PRD assumes the CLI exists; if it does not, the "metadata-only" path collapses to RLM-prior-only silently.
- **CDP port collision.** Prior Liverpool work used port 9229. If the operator's session is mid-run, the new probe may inherit the wrong browser tab. PRD does not say to verify the target URL of the CDP-attached tab before reading.
- **Screenshot PII leakage via web fonts / favicon URL.** Even with the page body redacted, the URL bar may include `?locationId=hHLZC7FaTtUINPf3cbHd` and operator name. Worth a one-line redaction rule.
- **CHANGELOG is in the repo but the new artifacts directory is potentially git-ignored.** If `dev/agents/artifacts/` is ignored, the CHANGELOG will reference artifacts that are not in git history. Confirm `.gitignore` status before close.
- **"Monday onboarding invite PoC" deadline.** The goal is to feed a Monday PoC. If the first read-only pass returns `blocked` on all four workflows, the PoC is blocked on a follow-up plan04, not the original timeline. State the contingency in the bead close note.

---

## Verdict: **BLOCK**

- Score 35/50 — does not meet the 46/50 self-target.
- PRD is well-scoped and safety-aware, but the operational surface (commands, auth path, screenshot scrub, no-mutation proof, RLM-prior summaries, meeting-invite gap definition) is under-specified.
- **Path to unblock**: address M1–M7, re-run Mini review. If 38–45, one CE improvement pass per the quality-loop protocol. If ≥ 46, proceed to implementation.

No file edits made. Output retained in this transcript per user instruction.

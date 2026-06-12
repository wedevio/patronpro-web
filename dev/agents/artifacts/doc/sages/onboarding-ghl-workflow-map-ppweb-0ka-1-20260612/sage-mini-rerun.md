# Mini Re-Review — `onboarding-ghl-workflow-map-ppweb-0ka-1-2026-06-12`

## Verdict: **44/50 — RECOMMEND ONE CE IMPROVEMENT PASS** (quality-loop band 40-45)

All 7 must-fixes from prior Mini review (M1-M7) are addressed. No blocking must-fixes remain. Score lands in the 80-90% band per quality-loop protocol — one CE improvement pass to push to >= 46.

## M-Fix Closure Audit

| ID | Status | Evidence |
|---|---|---|
| M1 approved-export loophole | **Fixed** | Schema evidence values = `api`/`profile9-ui`/`rlm-prior` only. Guardrail §6: "Approved export is not an execution path for this pass" + follow-up bead requirement |
| M2 gap rubric | **Fixed** | 4-value rubric `gap_proven`/`partial`/`not_applicable`/`blocked` + `ppweb-0ka.2/.3` ownership defined |
| M3 RLM-prior summaries | **Fixed** | Each prior has "Proves:" / "Still open:" + reconciliation rule (`fresh_api_contradicts_rlm_prior`) |
| M4 auth/1Password path | **Fixed** | §2: `op read "op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken"` + `op item get ... \| jq` fallback + "never echo" |
| M5 command-level probe | **Fixed** | §3: full `GHL_LOCATION_PIT=... bun ... --location ... --out ...` invocation, 15s timeout, headers explicit |
| M6 screenshot redaction | **Fixed** | §7: screenshots out of scope this pass unless explicit authorize + redaction helper |
| M7 no-mutation proof | **Fixed** | §5: `preRunHash`/`postRunHash` of normalized metadata + `noMutationProof.status` enum + acceptance §7 |

## Score Breakdown

| Dim | Score | Why |
|---|---|---|
| Completeness | **9/10** | 4 wf × 4 status × 4 evidence × 4 gap × 6 fail modes; reconciliation + retention + scope tie-in. -1: 1Password field `api tonken` reads as typo, no note flagging it as known |
| Clarity | **9/10** | IDs/branch/location/schema/auth/gap rubric all explicit. -1: `api tonken` literal copy creates ambiguity; close-criteria branches "Keep open if ... prior-evidence-only" could be one canonical decision tree |
| Actionability | **9/10** | Concrete op/bun/curl invocations, headers, timeouts, output paths. -1: no JSON validator script or fixture; redacted shape described but not enforced |
| Testability | **8/10** | Hashes, 4×4×4 taxonomies, CHANGELOG template = diffable. -1: no machine-checkable assertion (e.g., `bun run validate-workflow-map.ts`); hash diffing needs canonicalization note |
| Safety | **9/10** | No-mutation proof + secrets rule + Profile-9-only + CDP gate + PII scrub list + screenshot exclusion. -1: rate-limit "if safe" still undefined (S5 unresolved) |

**Total: 44/50**

## Remaining Must-Fixes

**None.** All seven prior gate items closed. No new blocking issues introduced.

## Should-Fixes (raise to 46+, do not gate further)

- **SF1. Verify `api tonken` 1Password field name.** The path `op://Picturelle/GHL - PatronPro - api key - MAIN/api tonken` carries what looks like a real-world typo. Either confirm it is literal (and add a one-line "known typo, do not normalize") or fall back to `op item get ... | jq '.fields[].label'` to discover the real field. Without this, the first run blocks on `op read` failure.
- **SF2. Define "safe" for rate-limit headers.** Failure Modes "Rate limiting" still says "if safe". Specify: store `x-ratelimit-remaining`/`x-ratelimit-limit` only; redact `x-request-id` and any header containing account/contact/user id substrings; otherwise store status code only.
- **SF3. CHANGELOG entry should contrast with prior UI mutation.** The 2026-06-10 changelog entry shows a UI-driven Add Contact / language / DND pass. The new entry template does not disambiguate. Add: "Read-only pass; no UI navigation of mutation-capable controls (cf. 2026-06-10 entry)."
- **SF4. Add a JSON validator script.** Schema is well-described but not enforced. Add `dev/agents/artifacts/script/onboarding-automation/validate-workflow-map.ts` that asserts: 4 workflow entries, allowed status/evidence/gap enums, presence of `noMutationProof`, presence of redacted-only fields, hash shape. Acceptance criterion should require green validator.
- **SF5. Canonicalization rule for hash diff.** `preRunHash`/`postRunHash` need a stated canonical form: sort workflow array by `id`, JSON-stringify with sorted keys, sha256. Without this, two reads returning same data with different key ordering produce different hashes and false-positive mutation.
- **SF6. Profile-9 subaccount auth risk documented but unhandled.** PRD guards against Windows fallback but not against the case where a valid token cannot read the PatronPro main-location workflows (subaccount scope). Add a 401/403 contingency that explicitly names the follow-up: "Open `ppweb-0ka.4` to request a location-scoped token from the GHL agency."
- **SF7. Close-criteria decision tree for terminal status combos.** What if 4 × `blocked`? 3 × `not_found` + 1 × `proven`? Currently "Keep open if ... no source at all can represent the four workflows" — clarify the per-status close rule and the follow-up bead trigger.

## Residual Risks

- **1Password CLI not on PATH or signed in.** `op` may be missing on operator's WSL shell. Path collapses silently to RLM-prior-only. Mitigation: add §probe-precondition check `command -v op && op whoami` before probe.
- **`api tonken` field typo.** First run will fail `op read`; operator must inspect field names. Documented in fallback but adds operator friction.
- **GHL response shape drift.** `GET /workflows/` v3 documented, but field naming unstable. "Endpoint shape drift" failure mode acknowledges this; thin map on first run is plausible.
- **Profile-9 token scope.** A Picturelle/agency-level token may not authorize reads on the PatronPro main location. 401 plausible. No mitigation in PRD beyond "store status code".
- **CDP port collision.** Liverpool prior used 9229. If a Profile-9 CDP session is mid-run, new probe may inherit the wrong tab. Mitigation: state "verify CDP-attached tab URL contains `app.gohighlevel.com` and `locationId=hHLZC7FaTtUINPf3cbHd` before reading".
- **`.gitignore` status of `dev/agents/artifacts/doc/test/onboarding-automation/`.** New directory. PRD says "git-tracked unless flagged" but unverified. Confirm with `git check-ignore` before close, or CHANGELOG references files not in git history.
- **Monday PoC deadline coupling.** If first read-only pass returns `blocked` on all four, the PoC is blocked on a follow-up plan04, not the original Monday timeline. State contingency in bead close note.
- **Screenshot PII via URL/query strings.** Ruled out for this pass — safe — but if a later pass re-enables UI evidence, the URL bar may carry `?locationId=...` and account hints. One-line redaction rule should accompany any future re-enable.

## Approval/Blocking Verdict

**APPROVE-WITH-CONDITIONS** (operationally, not blocking):

- Score 44/50 — within 80-90% band; quality-loop protocol calls for one CE improvement pass.
- All 7 prior must-fixes closed. No new must-fixes introduced.
- 7 should-fixes (SF1-SF7) are well-scoped and addressable in a single CE pass.
- CE pass should focus on: SF1 (1Password field verification), SF2 (rate-limit "safe" definition), SF3 (CHANGELOG disambiguation), SF4 (validator script), SF5 (hash canonicalization), SF6 (subaccount scope contingency), SF7 (close-criteria decision tree).
- After CE pass, expect score 47-49/50 → proceed to implementation per quality-loop protocol.

**Not blocking for `ppweb-0ka.1` implementation start** — the PRD is safe and concrete enough to execute. Recommend running the CE improvement pass in parallel with the first API probe to converge on the next iteration.

---

No file edits made. Review retained in this transcript per user instruction.

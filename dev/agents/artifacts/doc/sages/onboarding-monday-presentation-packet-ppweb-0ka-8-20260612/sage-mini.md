# PRD Review: ppweb-0ka.8 Monday Presentation Packet

## Scores

| Dim | Score | Notes |
|-----|-------|-------|
| Completeness | 6/10 | 13 sections listed, but **demo script, presentation timing, audience, and contingency plan are missing** |
| Clarity | 6/10 | Structure is clean, but "exact operator steps", "Mini reviews the packet", and "Monday-ready" are **undefined** |
| Actionability | 5/10 | Target paths + acceptance criteria given, but **no template, no commands, no actual sample data, no presentation outline** |
| Testability | 5/10 | `git diff --check` is concrete; everything else (Mini pass, CE merge, per-claim evidence) **lacks pass/fail criteria** |
| Safety | 8/10 | Strong explicit "no live mutations" boundary, license notes, fork approval carved out; missing rollback/incident response |
| **Total** | **30/50** | **60% — well below 92% gate (46/50)** |

## MUST FIX (blockers for quality gate)

1. **No actual demo script** — section 4 says "create demo script with deterministic sample data and exact operator steps" but provides neither. Add inline sample input (GHL contact, appointment record), expected ICS output, exact panel navigation steps, and an environment preflight (Profile 9 CDP up, panel running at port, supabase reachable).
2. **Presentation format undefined** — "Monday-ready" is not specified. State: audience (Oscar solo vs. Carlos + stakeholders), duration, format (slides vs. doc walkthrough vs. live demo), and whether the packet itself is the deliverable or feeds slides.
3. **Per-bead evidence map missing** — section 8 says "verification evidence by bead" but no mapping. Provide table: `ppweb-0ka.1` → RLM checkpoint path + commit hash + verification command, repeated for 0ka.2–0ka.7.
4. **Mini review pass/fail criteria absent** — acceptance criterion "Mini reviews the packet before close" is unfalsifiable. Define: which sections Mini must approve, what scoring rubric, what to do on disagreement.
5. **CE merge fallback unspecified** — "CE merge is retried if quota is available" leaves the gate to chance. Specify: if CE unavailable, do X (sages-only path? deferred merge?), and explicitly state the published score.
6. **No live-mutation discovery procedure** — if review finds that a "dry-run" component actually fired against live GHL/Google, what is the rollback/incident path? Currently the safety section is one-directional (declare clean) without a discover-and-respond loop.
7. **Google Meet setup is not a setup** — section 10 is listed but acceptance criteria only says "includes". Spell out: OAuth scope requirements, who holds credentials, dry-run vs. live cutoff, what changes once approval lands.

## SHOULD FIX

1. Format/length budget per section (target: 1-page exec summary, 2-page demo script, etc.)
2. Pre-flight checklist for the operator on Monday morning (CDP up, env vars set, panel responsive, supabase reachable, GHL read-only token valid)
3. License note linkage to architecture decision — explicitly state which ICS library path is chosen and why
4. Fork lane section needs the PR/branch URL for `mensajerokaos/patronpro-web` (verify the fork actually exists and is reachable)
5. Bead-to-content cross-reference: e.g. "0ka.1 evidence: see Appendix A; demo step 3 uses 0ka.2 output"
6. Dry-run/live boundary matrix (section 6) needs columns for: action, system, current state, gate to flip to live, owner
7. Add explicit rollback if the published packet contains a wrong claim (CHANGELOG entry + errata process)

## Focus area verdict

| Area | Sufficient? | Gap |
|------|------------|-----|
| Monday presentation readiness | ❌ | No format, timing, audience, or rehearsal step |
| Demo usability | ❌ | Script is a placeholder, no sample data, no env preflight |
| Dry-run/live boundaries | ⚠️ | Listed as section, but no matrix template, no discovery procedure |
| License notes | ✅ | Three licenses named with status; needs chosen-path commitment |
| Google Meet setup | ❌ | "Includes it" ≠ specifies it |
| Fork lane | ⚠️ | Section exists, but fork existence/URL not verified in PRD |
| Verification evidence | ❌ | Per-bead map missing; no commands listed |
| Blockers | ⚠️ | Section listed; current state has no blockers (sage-mini.md is empty — first sage still needs to run) |
| Next queue | ❌ | Section listed but no content; depends on per-bead status |
| Final report path/content | ⚠️ | Path is correct (`doc/reports/2026/06/...`); content is checklist, not payload |

## Final Score: 30/50 (60%)

**Verdict**: Below 92% quality gate. PRD is a **checklist, not a spec**. The 7 prior PRDs each have original + `-improved.md` artifacts in the same dir, so the expected flow is: this PRD → sages → CE merge → `-improved.md`. Given that no sage has run yet (`sage-mini.md` is 0 bytes) and the PRD is currently a meta-spec with no demo script, target **2 CE improvement passes** before the 46/50 gate can clear.

**Recommended next action**: launch `/ce` against this PRD with the MUST FIX list as gap analysis, since the underlying content (0ka.1–0ka.7 artifacts + commits) already exists and just needs to be assembled into the packet.

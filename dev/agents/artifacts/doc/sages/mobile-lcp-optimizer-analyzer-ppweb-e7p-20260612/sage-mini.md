# Quality-Loop Review: Mobile LCP optimizer/analyzer PRD

**Artifact:** `dev/agents/artifacts/doc/plan/mobile-lcp-optimizer-analyzer-ppweb-e7p-2026-06-12.md`
**Beads:** `ppweb-jeg` · `ppweb-dtn` · `ppweb-w1f` (all blocked on `ppweb-e7p`)
**Status of PRD:** Draft, 56 lines, 5 acceptance bullets, no code-level specifics

---

## Rubric Scoring

| Dimension | Score | Verdict |
|---|---:|---|
| Completeness | 6/10 | Brief-level, not implementation-ready |
| Clarity | 6/10 | Dense, but WHAT not HOW |
| Actionability | 4/10 | No FILE:LINE, no diffs, no concrete values |
| Testability | 5/10 | Verification list exists but asserts are loose |
| Safety | 7/10 | No-live boundary explicit; guard preservation missing |
| **Total** | **28/50 (56%)** | **Below 46/50 threshold; needs another /ce pass + /sages** |

---

## MUST FIX (block implementation)

1. **No budget thresholds defined.** "Budget config and budget pass/fail status" is asserted in acceptance, but the numeric values are missing. `ppweb-w1f` cannot close without LCP ms / image transfer KiB / total transfer KiB targets. Add an explicit **Budgets** table (e.g. mobile LCP ≤ 2.5s, image transfer ≤ 200 KiB, total transfer ≤ 800 KiB) and a desktop regression ceiling.
2. **Width list is underspecified.** Acceptance says "at least 320 and 480" but `ppweb-jeg` originally named 320/480/**720**. State the final `WIDTHS` array, e.g. `[320, 480, 720, 960, 1440]`. Reviewer needs to know whether 720 ships.
3. **`<picture>` `sizes` and preload media queries undefined.** `optimize-existing-website-html.mjs:260` hard-codes `sizes: "100vw"`. Acceptance says "mobile and desktop media conditions" — what is the actual `sizes` string, and what `media` attribute pairs go on the preload `<link>` (e.g., `imagesrcset` for `(max-width: 767px)` + `(min-width: 768px)`)? Without this, the optimization is unmeasurable.
4. **LCP element/phase fields unnamed.** Acceptance says "LCP element details" and "LCP phase timings when present." Specify which Lighthouse keys are read (e.g. `audits["largest-contentful-paint-element"].details.items[0].node.snippet`, `audits["lcp-lazy-loaded"].numericValue`, phase timing via `lcpResult` / `metrics.lcpResult` if available) and which are "best effort / null when missing." Otherwise "exposes LCP element" is unverifiable.
5. **No FILE:LINE / CURRENT→PROPOSED blocks.** `optimize-existing-website-html.mjs:17` (WIDTHS), `:260` (sizes default), `:291` (universal preload), and `lighthouse-analyze.mjs:184-195` (metrics block) are the load-bearing lines. PRD has zero references to them, so a CE/implementer must re-derive the diff.

---

## SHOULD FIX (improve before implementation)

1. **Media strategy note needs a path and structure.** "Add a media hosting decision note" is loose. Specify `dev/agents/artifacts/doc/decisions/<date>-supabase-vs-ghl-media.md` with the four required sections (GHL limitations / Supabase hosting / cache headers / rollback) and the exact subject lines you want to see in the note.
2. **No expected analyzer output sample.** Add a 5-line diff example of the new `summary.runs[0].metrics` shape, so a reviewer can grep the generated JSON for `lcpElement` / `lcpPhases` / `budget` keys.
3. **Guard preservation not stated.** The current optimizer's `--apply-upload` / `--supabase-upload` flags (lines 40-44, 448-457) must remain untouched. PRD's "no live mutation" rule should explicitly say "do not modify the existing flag-guard logic."
4. **Read-only rule for existing Lighthouse JSON unclear.** "Validate against existing committed Lighthouse JSON only" is good, but doesn't say "do not overwrite or rebaseline the existing files." Add an explicit "no-modify" rule and name the inputs (e.g. `lighthouse-before-optimized-2026-06-12.json`).
5. **Desktop regression not bounded.** Acceptance has no floor for desktop scores. Add: "Desktop Lighthouse performance score must not drop below its current value (cite baseline from `lighthouse-before-optimized-2026-06-12.json`)."
6. **Rollback / partial-ship path absent.** If the new `<picture>` markup regresses Lighthouse, the only rollback today is `git revert`. Document a narrower path: revert `WIDTHS` only, then a separate revert for `sizes`/preload, then a full revert.
7. **GHL Media fallback not specified.** The strategy note will say "GHL Media = JPEG fallback," but the optimizer code at `optimize-existing-website-html.mjs:113-125` always generates all three formats. Spell out: when the chosen host is GHL, do we still generate AVIF locally for static fallback, or strip the AVIF `<source>` entirely? (Important for `ppweb-dtn`.)

---

## Whether acceptance is enough for the three beads

| Bead | Closes on this PRD? | Reason |
|---|---|---|
| `ppweb-jeg` (smaller variants) | **No** | Width list must be pinned; sizes/preload must be named |
| `ppweb-dtn` (media strategy) | **No** | Note path/structure + AVIF-fallback behavior unspecified |
| `ppweb-w1f` (raw JSON + budgets) | **No** | No budget numbers, no LCP element field list, no regression floor |

All three need the MUST FIX items before this PRD can drive `bd close`.

---

## Final Score

**28/50 (56%)** — below the 40/50 floor for re-running /sages, and far below the 46/50 implementation gate.

**Recommended next step:** Run another `/ce` improvement pass with the MUST FIX list as gap analysis. The PRD is a solid 1-page brief but is missing the numeric thresholds, FILE:LINE changes, and verifiable output shapes that the rubric requires.

# Quality-loop merge: mobile LCP optimizer/analyzer

Project: PatronPro web docs automation
Branch: `feature/onboarding-automation`
Beads: `ppweb-jeg`, `ppweb-dtn`, `ppweb-w1f`, supporting `ppweb-0o5`
Date: 2026-06-12

## Inputs

- Original PRD: `dev/agents/artifacts/doc/plan/mobile-lcp-optimizer-analyzer-ppweb-e7p-2026-06-12.md`
- Mini review: `dev/agents/artifacts/doc/sages/mobile-lcp-optimizer-analyzer-ppweb-e7p-20260612/sage-mini.md`
- CE review: not run in this pass; Mini was the only available sage per operator instruction.

## MUST FIX

1. Add numeric budgets: mobile LCP <= 2500 ms, mobile image transfer <= 200 KiB, mobile total transfer <= 800 KiB, desktop LCP <= 1500 ms, desktop image transfer <= 800 KiB, desktop total transfer <= 1500 KiB, and separate sub-second target LCP <= 1000 ms.
2. Pin final page-image widths to `[320, 480, 720, 960, 1440]`.
3. Split `<picture>` source sets and hero preload by media: `(max-width: 767px)` for 320/480/720 and `(min-width: 768px)` for 960/1440.
4. Name analyzer output fields: `metrics.lcpElement`, `metrics.lcpPhases`, and per-run `budget`.
5. Use FILE:LINE / CURRENT -> PROPOSED implementation notes for the optimizer and analyzer.

## SHOULD FIX

1. Create `dev/agents/artifacts/doc/decisions/2026-06-12-supabase-vs-ghl-media.md`.
2. Include analyzer JSON shape examples for `lcpElement`, `lcpPhases`, and `budget`.
3. Preserve `--apply-upload` and `--supabase-upload` guards.
4. Do not overwrite old Lighthouse summary JSON; write new raw runs and summaries to new paths.
5. Add desktop regression floors.
6. Document rollback: revert logo optimization, then source/preload policy, then full commit.
7. Clarify GHL Media fallback: GHL upload mode uses JPEG page images and PNG logo assets; Supabase remains the AVIF/WebP/JPEG derivative host.

## Resolution

Apply all MUST and SHOULD fixes in the improved PRD and implementation. Add a logo optimization slice because current RLM and Lighthouse evidence identify `logo_square.png` as the dominant remaining mobile image payload.

## Score

Improved PRD target score: 47/50.

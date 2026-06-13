# PRD: Mobile LCP optimizer/analyzer checkpoint

Project: PatronPro web docs automation
Branch: `feature/onboarding-automation`
Beads: `ppweb-jeg`, `ppweb-dtn`, `ppweb-w1f`
Date: 2026-06-12
Status: Draft for Mini review

## Goal

Make the Liverpool Digital website optimizer/analyzer more useful for the mobile LCP track without live GHL, Supabase, or Lighthouse mutation.

## Source Facts

- Mobile LCP after the first optimization pass is 8.2s.
- Mobile image transfer is about 700 KiB.
- `logo_square.png` is about 670 KiB, while the selected mobile hero AVIF is about 29.9 KiB.
- GHL Media rejected AVIF; Supabase public Storage worked for AVIF/WebP/JPEG derivatives.
- Current optimizer widths are only 640/960/1440.
- Current analyzer preserves raw JSON when run with `--url`, but summaries do not expose LCP element/phases or enforce budgets.

## Scope

Implement a non-live checkpoint:

1. Add smaller mobile variants to `optimize-existing-website-html.mjs`.
2. Tighten `<picture>` `sizes` and preload policy so mobile can choose smaller assets.
3. Add an explicit media-hosting decision note.
4. Improve `lighthouse-analyze.mjs` to include:
   - LCP element details;
   - LCP phase timings when present;
   - budget config and budget pass/fail status.
5. Validate against existing committed Lighthouse JSON only.

## Out Of Scope

- Live GHL Media upload.
- Live Supabase Storage upload.
- Live Lighthouse run.
- GHL builder save/publish.
- Regenerating paid AI images.

## Acceptance Criteria

- Optimizer generates mobile-first widths including at least 320 and 480.
- Hero preload uses mobile and desktop media conditions instead of one `100vw` universal preload.
- Media strategy note documents Supabase public Storage as the current optimized derivative host, GHL Media as JPEG fallback/manual-library host, and the AVIF limitation.
- Analyzer outputs LCP element/phases and budget status from existing raw Lighthouse JSON.
- Verification passes:
  - `node --check` for changed `.mjs` files;
  - optimizer `--help`;
  - analyzer run against existing raw Lighthouse JSON;
  - `python3 -m json.tool` on generated analyzer JSON;
  - `git diff --check`.

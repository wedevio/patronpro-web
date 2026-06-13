# Decision: Supabase vs GHL Media for optimized website assets

Project: PatronPro web docs automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-dtn`
Date: 2026-06-12
Status: current decision

## Decision

Use Supabase public Storage as the primary host for optimized AVIF/WebP/JPEG website derivatives. Use GHL Media as the client-visible/manual-library host and JPEG/PNG fallback lane.

## GHL Media limitations

- GHL Media rejected AVIF during the prior optimizer pass.
- GHL Media is useful for assets the client expects to see in the GHL Media Library.
- For automated generated HTML, GHL upload mode should not attempt AVIF. It should upload/use JPEG page images and PNG logo files only unless GHL file-type behavior changes and is re-tested.

## Supabase public Storage

- Supabase public Storage successfully served AVIF/WebP/JPEG derivatives in the prior pass.
- Supabase URLs are suitable for generated `<picture>` markup where browser format negotiation matters.
- Store derivatives under a stable account/stamp path, for example:
  `website-assets/<locationId>/optimized/<stamp>/<filename>`.

## Client visibility and Carlos app UX

- Supabase-hosted optimized derivatives will not appear in the client's GHL Media Library.
- Carlos' panel should show optimized asset metadata directly: subject, format, width, bytes, URL, SHA-256, generated timestamp, and source image URL.
- The app should expose a "reuse existing images and optimize" path separately from any paid image-regeneration path, so operators do not accidentally regenerate AI images just to refresh responsive derivatives.
- The UI should make the active host explicit: Supabase optimized derivatives vs GHL fallback/manual assets.

## Cache and URL stability

- Stamp derivative paths instead of overwriting objects in place. This gives deterministic rollback and avoids stale CDN ambiguity.
- Keep the 960w JPEG fallback custom value populated for older HTML or non-`<picture>` consumers.
- Do not delete prior optimized objects during an experiment; mark superseded manifests instead.

## Rollback

1. Repoint generated HTML or custom values to the previous 960w JPEG fallback.
2. Revert the HTML custom-code save if a page-level regression occurs.
3. Keep old Supabase derivative paths available until the operator confirms the new page is stable.

## Follow-up

Retest GHL Media accepted types before changing this decision. If GHL begins accepting AVIF and WebP reliably, the product can choose whether library visibility is worth moving more derivatives into GHL.

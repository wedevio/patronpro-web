# Lighthouse Image Performance Summary

Source: `/mnt/m/picturelle/devio/onboarding/doc/test-website`
Generated: `2026-06-09T23:45:01.596609Z`

## Mobile - api.getpatronpro.com-20260609T162555.json

- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz?notrack=true`
- Fetch time: `2026-06-09T22:25:55.794Z`
- Lighthouse: `13.2.0`
- Screen emulation: mobile=`True`, width=`412`, height=`823`
- Scores: performance `65`, accessibility `94`, best practices `77`, SEO `58`
- FCP: `4.2 s`
- LCP: `31.2 s`
- Speed Index: `4.2 s`
- TBT: `50 ms`
- CLS: `0.001`

- LCP element: not present in this Lighthouse JSON export.

### Payload

- Total transfer: `8455.6 KiB`
- Image transfer: `8062.2 KiB` (95.3% of total)

### Image Requests

- `image/png` `669.5 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/logos/logos/4cPIvLND9hFAIzWQ1ZbL/logo_square.png
- `image/png` `2606.8 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/a9230b5c-e7cd-4972-97d5-b182ab3c60a6.png
- `image/png` `2489.2 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/403ea364-599e-4e7e-8a6c-1c579aedcffb.png
- `image/png` `2296.7 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/ef75b2b6-6c49-4a00-9854-b46884ab27b1.png
- `image/x-icon` `0.2 KiB` - https://stcdn.leadconnectorhq.com/funnel/icon/favicon.ico

## Desktop - api.getpatronpro.com-20260609T163042.json

- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz?notrack=true`
- Fetch time: `2026-06-09T22:30:42.132Z`
- Lighthouse: `13.2.0`
- Screen emulation: mobile=`True`, width=`412`, height=`823`
- Scores: performance `74`, accessibility `93`, best practices `77`, SEO `58`
- FCP: `1.3 s`
- LCP: `4.4 s`
- Speed Index: `1.3 s`
- TBT: `0 ms`
- CLS: `0.011`

- LCP element: not present in this Lighthouse JSON export.

### Payload

- Total transfer: `8459.7 KiB`
- Image transfer: `8065.5 KiB` (95.3% of total)

### Image Requests

- `image/png` `669.5 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/logos/logos/4cPIvLND9hFAIzWQ1ZbL/logo_square.png
- `image/png` `2607.4 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/a9230b5c-e7cd-4972-97d5-b182ab3c60a6.png
- `image/png` `2491.9 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/403ea364-599e-4e7e-8a6c-1c579aedcffb.png
- `image/png` `2296.7 KiB` - https://assets.cdn.filesafe.space/4cPIvLND9hFAIzWQ1ZbL/media/ef75b2b6-6c49-4a00-9854-b46884ab27b1.png
- `image/x-icon` `0.9 KiB` - https://stcdn.leadconnectorhq.com/funnel/icon/favicon.ico

## Recommendation Implemented In Workflow

- Generate AVIF, WebP, and compressed JPEG variants at 640w, 960w, and 1440w.
- Publish HTML with AVIF `<source>` first, WebP second, and JPEG fallback `<img>` last.
- Use `loading="eager" fetchpriority="high"` only for the hero/LCP image.
- Keep below-fold images `loading="lazy" decoding="async"`.
- Keep legacy `website_*_image` custom values populated with compressed JPEG fallback so older HTML does not break.

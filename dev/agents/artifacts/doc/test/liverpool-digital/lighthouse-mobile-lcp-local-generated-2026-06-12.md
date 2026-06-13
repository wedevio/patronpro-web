# Lighthouse Automation Summary

Generated: `2026-06-13T00:05:37.593Z`

## lighthouse-desktop-20260613T000514Z.json

- URL: `http://127.0.0.1:4175/test-onboarding-account-01-optimized-2026-06-12.html`
- Fetch time: `2026-06-13T00:05:28.560Z`
- Lighthouse: `13.0.1`
- Form factor: `desktop`
- Screen emulation: mobile=`false`, width=`1350`, height=`940`
- Scores: performance `99`, accessibility `96`, best practices `96`, SEO `100`
- FCP: `0.7 s`
- LCP: `0.7 s`
- LCP element: `not reported`
- LCP selector: `not reported`
- LCP observed: `321`; phase rows: `0`
- Speed Index: `0.7 s`
- TBT: `0 ms`
- CLS: `0.001`

### Payload

- Total transfer: `310.1 KiB`
- Image transfer: `93.7 KiB` (30.2% of total)

### Budgets

- Current budget: `pass`
- Sub-second LCP target: `pass`
- `performance`: 99 >= 90 -> `pass`
- `lcpMs`: 700 ms <= 1500 ms -> `pass`
- `imageTransferBytes`: 93.7 KiB <= 800.0 KiB -> `pass`
- `totalTransferBytes`: 310.1 KiB <= 1500.0 KiB -> `pass`
- `targetLcpMs`: 700 ms <= 1000 ms -> `pass`

### Largest Image Requests

- `image/avif` `49.8 KiB` - http://127.0.0.1:4175/assets/patronpro-hero-20260613T000226Z-1440.avif
- `image/avif` `39.8 KiB` - http://127.0.0.1:4175/assets/patronpro-about-20260613T000226Z-1440.avif
- `image/png` `4.1 KiB` - http://127.0.0.1:4175/assets/patronpro-logo-20260613T000226Z-96.png

### Opportunities

- `largest-contentful-paint` (0.7 s) - Largest Contentful Paint
- `unminified-css` (Est savings of 4 KiB) - Minify CSS
- `unminified-javascript` (Est savings of 23 KiB) - Minify JavaScript

## lighthouse-mobile-20260613T000514Z.json

- URL: `http://127.0.0.1:4175/test-onboarding-account-01-optimized-2026-06-12.html`
- Fetch time: `2026-06-13T00:05:17.115Z`
- Lighthouse: `13.0.1`
- Form factor: `mobile`
- Screen emulation: mobile=`true`, width=`412`, height=`823`
- Scores: performance `91`, accessibility `96`, best practices `96`, SEO `100`
- FCP: `2.3 s`
- LCP: `3.2 s`
- LCP element: `not reported`
- LCP selector: `not reported`
- LCP observed: `397`; phase rows: `0`
- Speed Index: `2.3 s`
- TBT: `0 ms`
- CLS: `0.028`

### Payload

- Total transfer: `263.3 KiB`
- Image transfer: `47.5 KiB` (18% of total)

### Budgets

- Current budget: `fail`
- Sub-second LCP target: `fail`
- `performance`: 91 >= 70 -> `pass`
- `lcpMs`: 3166 ms <= 2500 ms -> `fail`
- `imageTransferBytes`: 47.5 KiB <= 200.0 KiB -> `pass`
- `totalTransferBytes`: 263.3 KiB <= 800.0 KiB -> `pass`
- `targetLcpMs`: 3166 ms <= 1000 ms -> `fail`

### Largest Image Requests

- `image/avif` `20.8 KiB` - http://127.0.0.1:4175/assets/patronpro-hero-20260613T000226Z-720.avif
- `image/avif` `15.4 KiB` - http://127.0.0.1:4175/assets/patronpro-about-20260613T000226Z-720.avif
- `image/png` `11.3 KiB` - http://127.0.0.1:4175/assets/patronpro-logo-20260613T000226Z-192.png

### Opportunities

- `largest-contentful-paint` (3.2 s) - Largest Contentful Paint
- `unminified-css` (Est savings of 4 KiB) - Minify CSS
- `unminified-javascript` (Est savings of 23 KiB) - Minify JavaScript

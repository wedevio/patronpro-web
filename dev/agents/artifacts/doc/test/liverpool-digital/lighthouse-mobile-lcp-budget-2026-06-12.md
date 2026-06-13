# Lighthouse Automation Summary

Generated: `2026-06-13T00:04:00.670Z`

## lighthouse-desktop-20260613T000331Z.json

- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz?notrack=true`
- Fetch time: `2026-06-13T00:03:49.478Z`
- Lighthouse: `13.0.1`
- Form factor: `desktop`
- Screen emulation: mobile=`false`, width=`1350`, height=`940`
- Scores: performance `85`, accessibility `94`, best practices `77`, SEO `58`
- FCP: `1.3 s`
- LCP: `2.1 s`
- LCP element: `not reported`
- LCP selector: `not reported`
- LCP observed: `1479`; phase rows: `0`
- Speed Index: `1.4 s`
- TBT: `0 ms`
- CLS: `0.009`

### Payload

- Total transfer: `1172.6 KiB`
- Image transfer: `776.2 KiB` (66.2% of total)

### Budgets

- Current budget: `fail`
- Sub-second LCP target: `fail`
- `performance`: 85 >= 90 -> `fail`
- `lcpMs`: 2127 ms <= 1500 ms -> `fail`
- `imageTransferBytes`: 776.2 KiB <= 800.0 KiB -> `pass`
- `totalTransferBytes`: 1172.6 KiB <= 1500.0 KiB -> `pass`
- `targetLcpMs`: 2127 ms <= 1000 ms -> `fail`

### Largest Image Requests

- `image/png` `670.1 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/logos/logos/4cPIvLND9hFAIzWQ1ZbL/logo_square.png
- `image/avif` `50.0 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/website-assets/4cPIvLND9hFAIzWQ1ZbL/optimized/20260612T042621Z/patronpro-hero-20260612T042621Z-1440.avif
- `image/avif` `40.0 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/website-assets/4cPIvLND9hFAIzWQ1ZbL/optimized/20260612T042621Z/patronpro-about-20260612T042621Z-1440.avif
- `image/avif` `16.1 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/website-assets/4cPIvLND9hFAIzWQ1ZbL/optimized/20260612T042621Z/patronpro-contact-20260612T042621Z-1440.avif
- `image/x-icon` `0.9 KiB` - https://stcdn.leadconnectorhq.com/funnel/icon/favicon.ico

### Opportunities

- `largest-contentful-paint` (2.1 s) - Largest Contentful Paint
- `unminified-javascript` (Est savings of 23 KiB) - Minify JavaScript
- `unused-javascript` (Est savings of 47 KiB) - Reduce unused JavaScript

## lighthouse-mobile-20260613T000331Z.json

- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz?notrack=true`
- Fetch time: `2026-06-13T00:03:34.974Z`
- Lighthouse: `13.0.1`
- Form factor: `mobile`
- Screen emulation: mobile=`true`, width=`412`, height=`823`
- Scores: performance `65`, accessibility `94`, best practices `77`, SEO `58`
- FCP: `4.1 s`
- LCP: `8.4 s`
- LCP element: `not reported`
- LCP selector: `not reported`
- LCP observed: `1844`; phase rows: `0`
- Speed Index: `4.1 s`
- TBT: `90 ms`
- CLS: `0`

### Payload

- Total transfer: `1096.4 KiB`
- Image transfer: `700.0 KiB` (63.8% of total)

### Budgets

- Current budget: `fail`
- Sub-second LCP target: `fail`
- `performance`: 65 >= 70 -> `fail`
- `lcpMs`: 8394 ms <= 2500 ms -> `fail`
- `imageTransferBytes`: 700.0 KiB <= 200.0 KiB -> `fail`
- `totalTransferBytes`: 1096.4 KiB <= 800.0 KiB -> `fail`
- `targetLcpMs`: 8394 ms <= 1000 ms -> `fail`

### Largest Image Requests

- `image/png` `670.1 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/logos/logos/4cPIvLND9hFAIzWQ1ZbL/logo_square.png
- `image/avif` `29.9 KiB` - https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/website-assets/4cPIvLND9hFAIzWQ1ZbL/optimized/20260612T042621Z/patronpro-hero-20260612T042621Z-960.avif
- `image/x-icon` `0.9 KiB` - https://stcdn.leadconnectorhq.com/funnel/icon/favicon.ico

### Opportunities

- `largest-contentful-paint` (8.4 s) - Largest Contentful Paint
- `unminified-javascript` (Est savings of 23 KiB) - Minify JavaScript
- `unused-javascript` (Est savings of 47 KiB) - Reduce unused JavaScript

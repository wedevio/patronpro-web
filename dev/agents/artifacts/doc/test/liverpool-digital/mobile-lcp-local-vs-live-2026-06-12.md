# Mobile LCP checkpoint: live preview vs generated local artifact

Project: PatronPro web docs automation
Branch: `feature/onboarding-automation`
Parent bead: `ppweb-e7p`
Date: 2026-06-12

## Artifacts

- Generated local optimized HTML: `dev/agents/artifacts/doc/test/liverpool-digital/optimized-website-2026-06-12-mobile-lcp/test-onboarding-account-01-optimized-2026-06-12.html`
- Generated manifest: `dev/agents/artifacts/doc/test/liverpool-digital/optimized-website-2026-06-12-mobile-lcp/test-onboarding-account-01-optimized-2026-06-12.manifest.json`
- Current live-preview Lighthouse summary: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-mobile-lcp-budget-2026-06-12.md`
- Current live-preview raw JSON: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-raw-2026-06-12-mobile-lcp/`
- Local generated Lighthouse summary: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-mobile-lcp-local-generated-2026-06-12.md`
- Local generated raw JSON: `dev/agents/artifacts/doc/test/liverpool-digital/lighthouse-raw-2026-06-12-mobile-lcp-local/`

## Mobile comparison

| Surface | Performance | LCP | Total transfer | Image transfer | Largest images | Budget result |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Current live preview | 65 | 8.4 s | 1096.4 KiB | 700.0 KiB | `logo_square.png` 670.1 KiB; hero 960 AVIF 29.9 KiB | fail: performance, LCP, image, total |
| Generated local artifact | 91 | 3.2 s | 263.3 KiB | 47.5 KiB | hero 720 AVIF 20.8 KiB; about 720 AVIF 15.4 KiB; logo 192 PNG 11.3 KiB | fail: LCP only |

## Desktop comparison

| Surface | Performance | LCP | Total transfer | Image transfer | Budget result |
| --- | ---: | ---: | ---: | ---: | --- |
| Current live preview | 85 | 2.1 s | 1172.6 KiB | 776.2 KiB | fail: performance, LCP |
| Generated local artifact | 99 | 0.7 s | 310.1 KiB | 93.7 KiB | pass, including sub-second LCP target |

## Findings

- The generated artifact removes the 670.1 KiB live `logo_square.png` request from the critical image payload and replaces it with 96/192/384 PNG candidates.
- Mobile browser selection on the local generated page chose smaller candidates, including `hero-720.avif`, `about-720.avif`, and `logo-192.png`. The temporary server logs also showed mobile requests for `hero-480.avif`, `about-480.avif`, `contact-480.avif`, and `logo-96.png` during the Lighthouse pass.
- Mobile image transfer dropped from 700.0 KiB to 47.5 KiB locally. Total transfer dropped from 1096.4 KiB to 263.3 KiB locally.
- Mobile LCP improved from 8.4 s to 3.2 s locally, but it is still not below the 1.0 s target and still misses the current 2.5 s mobile LCP budget.

## Remaining blocker

`ppweb-0o5` should remain open until the optimized HTML is saved to the GHL preview or another realistic served environment and mobile LCP is pushed below the current 2.5 s budget, then toward the sub-second target. The next likely blocker after image payload is the render path under Lighthouse mobile throttling: CSS/font loading, GHL preview wrapper/runtime, and any remaining above-fold script work.

# Changelog

## Feature: Onboarding Automation Panel Tools

- Added API-safe post-onboarding setup controls for custom values, Brand Board, and calendar configuration.
- Added website generation controls for HTML generation, image generation, asset optimization, and GHL HTML copy.
- Added optimized website image handling with WebP primary images and JPEG fallbacks.
- Added logo optimization and logo status tracking.
- Added generated website SEO/Open Graph/JSON-LD requirements.
- Set Open Graph/Twitter preview image to `{{custom_values.website_social_image}}`.
- Set `website_social_image` from the optimized hero JPEG fallback instead of generating a separate social preview image.
- Added active onboarding-link status, copy, and rotation behavior.
- Added lab-mode provider/storage paths for FSN1 proof-of-concept testing.

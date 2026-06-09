# Liverpool Digital Website Publication Attempt

Date: 2026-06-09
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Bead: `ppweb-2`
Artifact status: current API/browser access checkpoint

## HTML Source Confirmation

The generated HTML is accessible through:

`https://www.getpatronpro.com/api/website/4cPIvLND9hFAIzWQ1ZbL`

The endpoint returned the same page structure pasted by the user:

- HTML bytes: `33116`
- SHA-256: `94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd`
- Title marker present: `{{custom_values.company_name}} | Roofing en Glendale`
- Color markers present: `--primary:#471f23;`, `--accent:#f69309;`
- Hero heading present: `Tu techo, reparado o reemplazado para durar`
- Deferred form marker present: `{{custom_values.landing_form}}`
- Footer marker present: `© {{custom_values.company_name}}. Todos los derechos reservados.`

This confirms the agent can read the same generated Custom HTML that appears in the PatronPro panel onboarding flow.

## GHL Website Inventory

- Website/funnel: `Construction Company`
- Website ID: `YJXYasKPALXkQkvezVyw`
- Home page ID: `JgrAMMXugg5Yi8QAnbDz`
- Home step ID: `e7b3ea2b-65fb-47a5-aa70-176674788e11`

## API Probe Result

Official HighLevel docs in `/tmp/highlevel-api-docs/apps/funnels.json` expose:

- `GET /funnels/funnel/list`
- `GET /funnels/page`
- `GET /funnels/page/count`
- redirect create/update/delete endpoints

They do not expose a documented page-content update, page-detail content read, or publish endpoint for replacing the Custom HTML block.

Read-only probe artifacts:

- `dev/agents/artifacts/doc/test/liverpool-digital/website-publication-api-probes-2026-06-09.json`
- `dev/agents/artifacts/doc/test/liverpool-digital/website-publication-api-probes-main-token-2026-06-09.json`

Probe outcome:

- Liverpool location token can list the Home page through `GET /funnels/page?...`.
- Page detail/content guesses returned `404` or `401` with `This route is not yet supported by the IAM Service`.
- `MAIN` token does not have access to the Liverpool Digital location and did not unlock page detail routes.

## Browser Automation Status

No Chrome CDP session is listening at `localhost:9222`.

The local Chrome `Default` profile has no GHL/HighLevel cookie hosts, so it is not currently authenticated for GHL.

1Password vault `Picturelle` contains GHL API-key items, but no GHL/HighLevel username/password item was found by title search.

## Current Conclusion

The agent has the correct HTML and the target GHL page IDs, but cannot safely paste/publish it into the GHL Website editor without one of:

1. An authenticated browser session exposed through Chrome CDP on port `9222`.
2. A GHL username/password or SSO path available in 1Password.
3. A documented or validated GHL page-content write endpoint.

Supabase access is not required for this specific HTML read because the public PatronPro endpoint already returns the generated HTML. Supabase access would still be useful for panel submissions, checklist state, account approval state, and live docs exports.


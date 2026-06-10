# Liverpool Digital Website Publication Attempt

Date: 2026-06-09
Location ID: `4cPIvLND9hFAIzWQ1ZbL`
Bead: `ppweb-2`
Artifact status: current API/browser save checkpoint

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

Initial status: no Chrome CDP session was listening at `localhost:9222`, and the local Chrome `Default` profile was not authenticated for GHL.

User then logged into Windows Chrome Profile 9, mapped in RLM as `devio/patron-pro [my job]`, and exposed it through Windows CDP on port `9222`.

Important CDP gotcha: Chrome bound CDP to Windows `127.0.0.1`; WSL could not connect directly. Browser automation ran from Windows Node via PowerShell against `http://127.0.0.1:9222`.

Current profile lane update, 2026-06-10: future PatronPro/GHL browser automation should use WSL Chrome Profile 9, not Windows Chrome Profile 9. The WSL Profile 9 CDP endpoint was reachable at `http://127.0.0.1:9229` and showed the authenticated Liverpool Digital GHL session. The browser was on Contacts during this read-only check, so the fresh WSL map proves profile reachability but does not replace the 2026-06-09 builder-block proof.

## Browser Save Result

The generated HTML was saved into the existing GHL Home Custom HTML block on 2026-06-09.

Selectors and IDs used:

- Wrapper URL: `https://app.gohighlevel.com/location/4cPIvLND9hFAIzWQ1ZbL/page-builder/JgrAMMXugg5Yi8QAnbDz?source=website`
- Builder frame: `https://page-builder.leadconnectorhq.com/location/4cPIvLND9hFAIzWQ1ZbL/page-builder/JgrAMMXugg5Yi8QAnbDz`
- Existing custom-code element: `#custom-code-MTo38o_zdB`
- Settings sidebar button: `button.btn-open-editor`
- Code modal: `#hl-builder-custom-code-modal`
- CodeMirror editor: `#hl-builder-custom-code-modal .CodeMirror`
- Modal Save button text: `Save`
- Builder Save button: `#pg-website-builder__btn--save`

Save proof:

- Endpoint SHA-256 before insert: `94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd`
- Endpoint HTML length: `33116` characters (`33244` UTF-8 bytes)
- CodeMirror set verification: `33116` characters, hero marker present, `{{custom_values.landing_form}}` marker present
- Modal Save closed successfully
- Builder showed `Last saved Jun 09, 4:13 PM`
- Observed successful save calls:
  - `POST https://backend.leadconnectorhq.com/funnels/builder/element-template/sync/changes` -> `201`
  - `POST https://backend.leadconnectorhq.com/funnels/builder/prebuilt-section/sync/changes` -> `201`
  - `POST https://backend.leadconnectorhq.com/funnels/builder/autosave/JgrAMMXugg5Yi8QAnbDz` -> `201`
  - `POST https://backend.leadconnectorhq.com/funnels/builder/global-sections/YJXYasKPALXkQkvezVyw` -> `201`
- Reload verification from the builder backend:
  - Length: `33116`
  - SHA-256: `94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd`
  - Title marker present: yes
  - Hero marker present: yes
  - Deferred `landing_form` marker present in editor: yes
  - Color markers present: yes

Public preview QA:

- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz`
- Status: `200`
- Response bytes: `91272`
- Hero marker present: yes
- Color markers present: yes
- `Custom HTML/Javascript` placeholder absent: yes
- `{{custom_values.landing_form}}` absent in served preview: expected, because the GHL custom value is intentionally empty until Twilio approval

Fresh public preview QA, 2026-06-10:

- Artifact: `dev/agents/artifacts/doc/test/liverpool-digital/ghl-profile9-preview-qa-2026-06-10.json`
- URL: `https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz`
- Status: `200`
- Response bytes: `91272`
- Hero marker present: yes
- Color markers present: yes
- `Custom HTML/Javascript` placeholder absent: yes
- `{{custom_values.landing_form}}` absent in served preview: expected, because the GHL custom value is intentionally empty until Twilio approval

The top-level `Publish` button was not clicked in this pass. The GHL preview is serving the saved HTML, but final live-domain publication should wait for the operator's manual check and the remaining phone/domain/email readiness constraints.

## Current Conclusion

The API boundary remains: official/public GHL API routes did not expose page-builder content writes. The reliable path for this account is browser automation through the authenticated GHL page builder:

1. Open Sites -> Websites -> `Construction Company` -> Home -> Edit.
2. Select `#custom-code-MTo38o_zdB`.
3. Open the settings sidebar code editor.
4. Set CodeMirror value to the generated HTML from `https://www.getpatronpro.com/api/website/4cPIvLND9hFAIzWQ1ZbL`.
5. Click modal Save.
6. Click builder Save.
7. Reload and verify the CodeMirror content hash, then verify the public preview.

Supabase access is not required for this specific HTML read because the public PatronPro endpoint already returns the generated HTML. Supabase access is still needed for panel submissions, checklist state, account approval state, and live docs exports.

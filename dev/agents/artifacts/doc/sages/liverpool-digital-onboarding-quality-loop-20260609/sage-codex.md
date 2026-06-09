**Findings**

- **Critical** - `assign-calendar-owner --apply` targets calendars by broad name regex, not exact IDs or configured custom values. Any calendar matching `on[- ]?site`, `consultation`, or `consulta` can be mutated, and the checks only require `>= 2` matches. This is unsafe for a product app.
  [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:301), [line 631](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:631), [line 720](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:720)

- **High** - Calendar setup can pass without validating availability, booking rules, buffers, notice, duration, or a free-slot smoke test. The quality-loop artifact says activation is gated on availability/booking-rule QA, but the harness only checks names, custom values, owner assignment, and `isActive`.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:75), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:493)

- **High** - Twilio/Trust Center is documented as a hard gate, but the harness has no explicit Trust Center approval gate. It also treats missing `landing_form` as a generic failed landing custom value with remediation to create it, which conflicts with the documented “deferred until Twilio approval” rule.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:17), [line 128](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:128), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:549)

- **High** - Account approval can pass solely because `approved_at` exists. It does not recompute or enforce “all critical QA rows pass,” Twilio approval, landing form safety, client sign-off, or final activation criteria.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:21), [line 102](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:102), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:520)

- **High** - Landing publication proof is too weak. `location.website` is accepted as `publicationEvidence`, so the landing check can pass without proving the generated HTML/images were actually published into the correct GHL Website Home block.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:77), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:439)

- **Medium** - Domain QA can pass with any non-empty `customDomain` plus any non-empty `dominio_web`; it does not require equality/relationship, DNS resolution, SSL, or public HTTP reachability.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:76), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:405)

- **Medium** - Workflow QA is name-only. A workflow passes if its name matches `/onboarding|ob-meeting-ok|send onboarding/i`, but the artifact says trigger/action inspection is still required.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:81), [liverpool-digital-automation.mjs](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/script/patronpro-liverpool/liverpool-digital-automation.mjs:554)

- **Medium** - Productization docs are missing the app-level mutation contract: allowed commands, exact preconditions, required token scopes, approval UX, rollback behavior, idempotency keys/evidence schema, and per-step authoritative readback. The artifact has high-level quality gates, but not enough operational detail to safely turn this into an app.
  [quality-loop artifact](/home/oz/projects/2026/patronpro-web-docs-automation/dev/agents/artifacts/doc/plan/liverpool-digital-onboarding-automation-quality-loop-2026-06-09.md:130)

No edits made.

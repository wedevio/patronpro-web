# Quality Loop Merge: Onboarding GHL Workflow Map

Date: 2026-06-12
Bead: `ppweb-0ka.1`
Topic: `onboarding-ghl-workflow-map`
Council: Mini + CE only

## Mini Review Results

- First Mini pass: 35/50, blocking.
- Rerun after must-fixes: 44/50, no remaining blockers, one CE improvement pass recommended.

## Must-Fix Closure

Mini confirmed all seven original must-fixes are closed:

- Removed `approved-export` as an evidence loophole.
- Defined the meeting-invite gap rubric.
- Added RLM-prior summaries and fresh-API reconciliation.
- Specified the 1Password injection path and no-echo rule.
- Added command-level API probe shape.
- Ruled screenshots out for this pass unless separately authorized and redacted.
- Added pre/post read-only metadata hash proof.

## CE Should-Fix Targets

Apply these remaining fixes to the PRD:

1. Mark `api tonken` as a known literal 1Password field typo and add a preflight fallback that inspects field labels only.
2. Define safe rate-limit headers precisely: store only `x-ratelimit-*` values; omit request ids and anything account/contact/user-bearing.
3. Change the CHANGELOG template to explicitly contrast this read-only pass with prior UI mutation work.
4. Add a validator requirement for the generated JSON/Markdown map artifacts.
5. Define hash canonicalization: sort target workflows by id/name, sort keys recursively, JSON stringify, then SHA-256.
6. Add a 401/403 subaccount/location-token contingency and follow-up bead trigger.
7. Add close-criteria decision tree for terminal status combinations.

## Desired CE Output

Write an improved PRD at:

`dev/agents/artifacts/doc/plan/onboarding-ghl-workflow-map-ppweb-0ka-1-2026-06-12-improved.md`

The improved PRD should preserve the same scope and safety boundary, incorporate the seven should-fixes, and include a self-assessment out of 50 using Completeness, Clarity, Actionability, Testability, and Safety.

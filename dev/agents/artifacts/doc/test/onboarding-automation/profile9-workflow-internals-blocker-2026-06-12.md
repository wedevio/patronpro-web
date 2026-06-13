# Profile 9 workflow internals blocker

Project: PatronPro web docs automation
Branch: `feature/onboarding-automation`
Bead: `ppweb-0ka.1.1`
Timestamp: `2026-06-12T18:12:14-06:00`
Mode: read-only reconnaissance

## Objective

Inspect GHL onboarding workflow trigger/action/email-send internals for the four PatronPro main-account onboarding workflows without Save, Publish, Send, Delete, or any other mutation-capable UI action.

## Existing read-only API evidence

The prior API probe already documented all four target workflows from GHL metadata:

| Workflow | ID | Status | Version |
| --- | --- | --- | ---: |
| `1. Onboaring Link Send` | `96da67c8-2351-467c-ada7-3852a0839614` | published | 15 |
| `2. Onboarding Email Automation` | `92b193be-e388-41b1-ab71-7b99ebf6efa0` | published | 28 |
| `2.5 Onboarding Appointment Completed` | `b8ee04e6-5235-4adb-b097-21f7d9fa6e43` | published | 6 |
| `3. Onboarding Meeting Requirements Email` | `beb223dc-236b-4082-8b07-f915c8906801` | published | 12 |

Artifact: `dev/agents/artifacts/doc/test/onboarding-automation/ghl-onboarding-workflow-map-2026-06-12.md`.

## Browser/profile check

Required profile: WSL Chrome Profile 9 tied to the `@getpatronpro.com` / PatronPro panel login.

Process probe:

```text
ps -eo pid,ppid,stat,cmd | rg -i 'chrome|chromium|google-chrome|remote-debugging|chrome-patronpro|profile9|profile 9'
```

Result: no running Chrome/Chromium/Google Chrome Profile 9 process was found.

CDP probes:

| Port | Result |
| ---: | --- |
| 9222 | no CDP |
| 9223 | no CDP |
| 9229 | no CDP |
| 9230 | no CDP |
| 9333 | no CDP |

No cookies, localStorage, session headers, passwords, Google account state, or GHL token values were read, printed, stored, or committed.

## Boundary decision

Profile 9 UI reconnaissance is blocked because WSL Profile 9 is not running and no allowed CDP endpoint is reachable.

No fallback was attempted to:

- Windows Chrome Profile 9;
- Oscar's WSL `chrome-oscar-flow` / Profile 6 sessions;
- any personal Google browser profile.

## Next safe step

Open a dedicated PatronPro-only WSL Chrome profile such as `/home/oz/.config/chrome-patronpro-profile9` with remote debugging enabled, have the operator log in using the `@getpatronpro.com` account, then rerun this bead read-only. Do not click Save, Publish, Send, Delete, Verify, Approve, or Submit while inspecting workflow internals.

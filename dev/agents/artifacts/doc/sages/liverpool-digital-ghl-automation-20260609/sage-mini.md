# PatronPro Liverpool Digital Automation — Review

**Score: 87/100** — Solid dry-run architecture, comprehensive plan, source-traceable index. Blockers: secret retention in `envStatus()`, no fetch timeouts, several plan steps lack matching QC evidence in the script.

---

## Verdict: **Dry-Run Safe** (with caveats)

The script is **structurally incapable** of mutating GHL, Supabase, or the PatronPro panel in its current state. There is no `--apply` flag, no PUT/POST/PATCH/DELETE call, and the three commands (`qc`, `plan`, `export-docs`) only invoke GET-style Supabase REST and GHL read endpoints. Help text and plan metadata both declare `dryRun: true` / `liveMutationAllowed: false`.

**Caveats**:
- `envStatus()` returns `key: supabaseKey` and `token: ghlToken` in its raw return value. The `buildQcReport()` path strips them before writing JSON, but any future caller that serializes `envStatus()` directly will leak secrets.
- No `fetch()` timeouts — calls can hang indefinitely on slow APIs.
- `export-docs` writes to `--out-dir` without traversal protection; a malicious `outDir` of `../../etc` would write outside the intended tree.

---

## Must-Fix (4)

| # | Issue | File | Lines |
|---|-------|------|-------|
| 1 | **`envStatus()` retains secret values** in returned object. If a future refactor serializes that object directly, the report file will contain the Supabase service-role key and GHL token in plaintext. Return a `{ ok, missing }`-only shape by default; expose raw values only via a separate `envStatusRaw()` debug helper. | `liverpool-digital-automation.mjs` | 67-93 |
| 2 | **No `AbortSignal.timeout()` on `fetch` calls.** `supabaseFetch` and `ghlFetch` can hang indefinitely, blocking the QC job. Use `signal: AbortSignal.timeout(15_000)` (or similar) for both. | `liverpool-digital-automation.mjs` | 130-140, 150-160 |
| 3 | **`--json` arg is parsed but never consumed.** `args.json = true` is set in `parseArgs` (line 59) but the flag is never read in `writeOutput` or anywhere else. Either implement it (pretty-print mode toggle) or remove. Dead code erodes operator trust. | `liverpool-digital-automation.mjs` | 59, 490-500 |
| 4 | **`firstWebsite()` returns first array element** with no ordering guarantee. If Supabase returns rows in undefined order, the QC report is non-reproducible. Sort by `generated_at`/`updated_at` desc. | `liverpool-digital-automation.mjs` | 215-219 |

## Should-Fix (10)

| # | Issue | File |
|---|-------|------|
| 1 | `outDir` / `out` paths not validated against directory traversal. `resolve()` does not prevent `..` segments. | script |
| 2 | No retry/backoff for transient 429/5xx from GHL. A flaky run produces a false `fail` instead of `blocked`/`retry`. | script |
| 3 | Plan Step 19 (`accounts.approved_at` non-null) is not in the script's QC checks. The script reads `account_checklist` but not `approved_at`. | plan ↔ script |
| 4 | Plan Step 18 requires verifying workflow trigger tag `ob-meeting-ok` AND webhook body shape. Script only matches workflow name regex; cannot introspect triggers/actions. | plan ↔ script |
| 5 | Plan Step 9 (brand colors) has no script evidence path. Mark as "manual-only" explicitly in the plan, not just "Screenshot or later API proof." | plan |
| 6 | Plan Step 17 (Stripe) says "form flag alone is not proof" — script passes on `transactions > 0` only. A location with one historical test transaction would falsely pass. Require Stripe-specific endpoint or correlation. | plan ↔ script |
| 7 | Plan Step 11 (image URLs) — script checks custom values present but does not HEAD-check that the URLs resolve. | script |
| 8 | Plan Step 8 (staff permissions) — script does not check user permissions at all. Add a `ghlFetch` to `/users/` and verify the permission flags. | plan ↔ script |
| 9 | Runbook does not specify `bun` version. `bun install` will resolve whatever is available; pin `engines` in `package.json` or document minimum version. | runbook |
| 10 | Runbook has no "verify branch" step before checkout. `git checkout feature/...` fails silently if branch was renamed. Add `git fetch && git rev-parse --verify origin/feature/liverpool-digital-docs-automation`. | runbook |

---

## Missing QC Evidence (plan steps without script coverage)

Mapping each of the 21 plan steps to script coverage:

| Plan Step | Plan QC Proof | Script Coverage | Gap |
|-----------|---------------|-----------------|-----|
| 1 | doc_pages export to RLM | `export-docs` command | ✅ partial — does not push to RLM |
| 2 | Location metadata fields | `location_exists` check | ✅ |
| 3 | Client contact ID in sub-account + PatronPro | Not checked | ❌ Missing contact check |
| 4 | Signed onboarding link | Not checked | ❌ No link generation/inspection |
| 5 | account_submissions row exists | `form` check | ✅ |
| 6 | 9 custom values present | `core_custom_values` check | ✅ |
| 7 | 3 landing custom values present | `landing_custom_values` check | ✅ |
| 8 | Staff permissions disabled | Not checked | ❌ Missing user-permission QC |
| 9 | Brand boards / global colors | Not checked | ❌ Manual-only, plan should say so explicitly |
| 10 | Website status=ready, HTML non-empty | `landing` check (partial) | ⚠️ Doesn't check GHL page publication |
| 11 | 3 image custom values + URLs resolve | Custom values only, no HEAD check | ⚠️ Image URLs not verified live |
| 12 | Public URL or GHL page/funnel evidence | Not checked | ❌ Missing publication check |
| 13 | DNS records + dominio_web match | `customDomain || dominio_web` only | ⚠️ No DNS lookup |
| 14 | Phone-system number + active status | `phone` check | ✅ |
| 15 | Location email + sender-domain | `email` check (partial) | ⚠️ No DNS/MX check |
| 16 | Calendar names + booking custom values | `calendar` check | ✅ |
| 17 | Stripe connection (not just transactions) | Transaction count only | ⚠️ Weak pass criterion |
| 18 | Workflow tag trigger + webhook body | Workflow name regex only | ❌ Cannot introspect GHL workflow internals via API |
| 19 | accounts.approved_at non-null | Not checked | ❌ Missing |
| 20 | Each item maps to evidence + timestamp | Partial — metadata has timestamp | ⚠️ No per-item evidence row map |
| 21 | Manual sign-off | `client_ok` checkbox only | ✅ (as far as script can verify) |

**Net**: 9 of 21 plan steps have full script coverage. 6 have partial coverage. 6 have no script coverage at all (steps 3, 4, 8, 9, 12, 19). Step 18 is structurally hard to verify via the public GHL API.

---

## Strengths (worth preserving)

- **Source-code traceability**: Every claim in the index cites `file:line` (e.g., `src/lib/panel/store.ts:13-22`, `src/app/api/onboarding/route.ts:80-114`).
- **No mutation surface**: `supabaseFetch` and `ghlFetch` are only invoked with GET-style options. No PUT/POST/PATCH/DELETE branches exist.
- **Three-layer dry-run defense**: `dryRun: true` in metadata, `liveMutationAllowed: false` in plan, no `--apply` flag implemented. Help text is accurate.
- **`envStatus()` strips secrets from JSON output** in the current call path — only the bug in the helper function's raw return shape is a future-leak risk, not a present one.
- **`Prefer: return=representation`** on Supabase is a read hint, not a write — correctly used.
- **GHL API version pinning** — `GHL_VERSION = "2021-07-28"` is the legacy global, and the phone endpoint correctly uses `"2023-02-21"`. Good versioning awareness.
- **Parallel reads via `Promise.all`** — seven GHL/Supabase reads run concurrently.
- **`safeJson` defensive parser** — handles malformed GHL/Supabase responses without throwing.
- **Plan/Index/Runbook trio is consistent** — all three reference the same location ID, branch, and epic bead (`ppweb-elk`).
- **Runbook has explicit "do not store real secrets in git" guidance** and points to a `.env.example` template.

---

## Recommended Next Steps (priority order)

1. Fix `envStatus()` to not return raw secret values; add `AbortSignal.timeout()`.
2. Remove or implement `--json`.
3. Add deterministic ordering in `firstWebsite()`.
4. Add the 6 missing script checks (steps 3, 4, 8, 19 + strongest signal for 12, 17, 18).
5. Add `engines.bun` pin and verify-branch step to the runbook.
6. Document a rollback story in the plan (even if "no writes possible" is the answer, make it explicit).

**Approval recommendation**: **Approve for dry-run execution** against the FSN1 environment. **Block** any future `--apply` flag implementation until the must-fix items above are addressed and the missing QC evidence gaps (steps 3, 4, 8, 9, 12, 19) are either filled in the script or marked as out-of-scope for automation.

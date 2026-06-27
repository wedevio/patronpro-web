import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCollaboratorPool, queryRows } from "@/lib/collaborators/db";
import { requirePpSession } from "@/lib/auth/require-session";
import {
  ADAPTER_VERSION,
  type ClearanceJobControls,
  ClearanceControlError,
  type ClearancePlatform,
  adapterFor,
  canonicalizeUrl,
  clearanceRunId,
  idempotentControls,
  matchKey,
  parseClearanceJobControls,
  readPlatform,
  readScope,
  readString,
  stableJsonHash,
} from "@/lib/collaborators/clearance-job-controls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SocialProfileRow = {
  social_profile_id: string;
  candidate_id: string;
  platform: string;
  canonical_url: string;
  status?: string | null;
  verification_status?: string | null;
};

type ResearchJobRow = {
  job_id: string;
  status: string;
  candidate_id: string;
  platform: ClearancePlatform;
  source_url_canonical: string;
  adapter: string;
  scope: string;
  scope_level: string;
  max_records: number | string;
  idempotency_key: string;
  created_at?: string;
  updated_at?: string;
};

type JobEventRow = {
  seq: number | string;
  status: string;
  phase: string;
  attempt: number | string;
  blocker?: string | null;
  result?: string | null;
  detail_json_redacted?: Record<string, unknown> | null;
  created_at?: string;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function sanitizeJob(row: ResearchJobRow) {
  return {
    jobId: row.job_id,
    status: row.status,
    candidateId: row.candidate_id,
    platform: row.platform,
    sourceUrl: row.source_url_canonical,
    adapter: row.adapter,
    scope: row.scope,
    scopeLevel: row.scope_level,
    maxRecords: Number(row.max_records),
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadVerifiedSource(candidateId: string, platform: ClearancePlatform, requestedUrl: string | null) {
  const profiles = await queryRows<SocialProfileRow>(
    `SELECT social_profile_id, candidate_id, platform, canonical_url, status, verification_status
     FROM patronpro_collab.social_profiles
     WHERE candidate_id = $1
       AND platform = $2
       AND lower(coalesce(status, '')) !~ '^(superseded|duplicate)'
     ORDER BY
       CASE WHEN lower(coalesce(verification_status, '')) LIKE '%verified%' THEN 0 ELSE 1 END,
       captured_at DESC NULLS LAST,
       canonical_url`,
    [candidateId, platform]
  );

  if (!profiles.length) throw new ApiError(404, `No stored ${platform} profile is available for this candidate`);
  const sourceUrl = requestedUrl ?? profiles[0]?.canonical_url;
  if (!sourceUrl) throw new ApiError(400, "sourceUrl is required");
  const requestedKey = matchKey(platform, sourceUrl);
  const matched = profiles.find((profile) => matchKey(platform, profile.canonical_url) === requestedKey);
  if (!matched) throw new ApiError(400, "sourceUrl must match a stored candidate social profile before clearance can run");
  return {
    sourceUrlRaw: sourceUrl,
    sourceUrlCanonical: canonicalizeUrl(matched.canonical_url),
    profile: matched,
  };
}

function previewPayload({
  candidateId,
  platform,
  sourceUrlRaw,
  sourceUrlCanonical,
  scope,
  controls,
}: {
  candidateId: string;
  platform: ClearancePlatform;
  sourceUrlRaw: string;
  sourceUrlCanonical: string;
  scope: string;
  controls: ClearanceJobControls;
}) {
  const adapter = adapterFor(platform, scope);
  const scopeLevel = "smoke";
  const idempotencyKey = stableJsonHash({
    adapter,
    adapter_version: ADAPTER_VERSION,
    candidate_id: candidateId,
    canonical_source_url: sourceUrlCanonical,
    controls: idempotentControls(controls),
    platform,
    scope,
  });
  const runId = clearanceRunId(candidateId, platform, adapter, sourceUrlCanonical, scope, controls);
  return {
    wouldCreateJob: true,
    candidateId,
    platform,
    sourceUrlRaw,
    canonicalSourceUrl: sourceUrlCanonical,
    adapter,
    adapterVersion: ADAPTER_VERSION,
    scope,
    scopeLevel,
    maxRecords: controls.maxRecords,
    requestedScope: {
      scope,
      scopeLevel,
      dateRangePreset: controls.dateRangePreset,
      dateStart: controls.dateStart,
      dateEnd: controls.dateEnd,
      intentPreset: controls.intentPreset,
      customQuery: controls.customQuery,
      maxRecords: controls.maxRecords,
      paidRouteEnabled: controls.paidRouteEnabled,
      outreachEnabled: controls.outreachEnabled,
    },
    idempotencyKey,
    clearanceRunId: runId,
    safetyWarnings: [
      "Preview-only by default. A live job requires apply=true and cannot send outreach.",
      "Paid scraping routes are disabled for this clearance API.",
      ...(platform === "tiktok" ? ["TikTok smoke checks public metadata only; selected-video transcript review may still be required."] : []),
      ...(platform === "youtube" ? ["YouTube uses metadata-first clearance and exact-language subtitle fallback only when needed."] : []),
    ],
  };
}

function errorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status;
  if (error instanceof ClearanceControlError) return error.status;
  return 500;
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requirePpSession();
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(request.url);
    const jobId = readString(url.searchParams.get("jobId"));
    if (!jobId) throw new ApiError(400, "jobId is required");
    const [job] = await queryRows<ResearchJobRow>("SELECT * FROM patronpro_collab.research_jobs WHERE job_id = $1", [jobId]);
    if (!job) throw new ApiError(404, "job not found");
    const events = await queryRows<JobEventRow>(
      `SELECT seq, status, phase, attempt, blocker, result, detail_json_redacted, created_at
       FROM patronpro_collab.research_job_events
       WHERE job_id = $1
       ORDER BY seq`,
      [jobId]
    );
    return NextResponse.json({ ok: true, job: sanitizeJob(job), events });
  } catch (error) {
    const status = errorStatus(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requirePpSession();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const candidateId = readString(body.candidateId);
    if (!candidateId) throw new ApiError(400, "candidateId is required");
    const platform = readPlatform(body.platform);
    const scope = readScope(platform, body.scope);
    const controls = parseClearanceJobControls(body, platform);
    const source = await loadVerifiedSource(candidateId, platform, readString(body.sourceUrl));
    const preview = previewPayload({
      candidateId,
      platform,
      sourceUrlRaw: source.sourceUrlRaw,
      sourceUrlCanonical: source.sourceUrlCanonical,
      scope,
      controls,
    });

    if (!controls.apply) {
      return NextResponse.json({ ok: true, applied: false, preview });
    }

    const pool = getCollaboratorPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query<ResearchJobRow>(
        `SELECT *
         FROM patronpro_collab.research_jobs
         WHERE job_type = 'commercial_clearance'
           AND idempotency_key = $1
         ORDER BY
           CASE
             WHEN status IN ('queued', 'running', 'partial', 'failed_retryable', 'blocked_retryable') THEN 0
             WHEN status = 'completed' THEN 1
             ELSE 2
           END,
           created_at
         LIMIT 1`,
        [preview.idempotencyKey]
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return NextResponse.json({ ok: true, applied: true, reusedExisting: true, preview, job: sanitizeJob(existing.rows[0]) });
      }

      const jobId = `job_${randomUUID().replace(/-/g, "")}`;
      const payload = {
        clearance_run_id: preview.clearanceRunId,
        profile_id: source.profile.social_profile_id,
        source_url_raw: source.sourceUrlRaw,
        controls: preview.requestedScope,
        date_range: {
          preset: controls.dateRangePreset,
          start: controls.dateStart,
          end: controls.dateEnd,
        },
        intent: {
          preset: controls.intentPreset,
          custom_query: controls.customQuery,
        },
        paid_route_enabled: false,
        outreach_enabled: false,
      };
      const inserted = await client.query<ResearchJobRow>(
        `INSERT INTO patronpro_collab.research_jobs (
          job_id,
          job_type,
          candidate_id,
          status,
          platform,
          source_url_raw,
          source_url_canonical,
          adapter,
          adapter_version,
          scope,
          scope_level,
          max_records,
          payload_json,
          idempotency_key,
          created_by
        ) VALUES (
          $1, 'commercial_clearance', $2, 'queued', $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, 'nextjs-dashboard'
        )
        RETURNING *`,
        [
          jobId,
          candidateId,
          platform,
          source.sourceUrlRaw,
          source.sourceUrlCanonical,
          preview.adapter,
          ADAPTER_VERSION,
          scope,
          preview.scopeLevel,
          controls.maxRecords,
          JSON.stringify(payload),
          preview.idempotencyKey,
        ]
      );
      await client.query(
        `INSERT INTO patronpro_collab.research_job_events (
          job_id, seq, status, phase, attempt, detail_json_redacted
        ) VALUES ($1, 1, 'queued', 'queued', 0, $2::jsonb)`,
        [jobId, JSON.stringify({ platform, scope, max_records: controls.maxRecords, controls: preview.requestedScope })]
      );
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, applied: true, reusedExisting: false, preview, job: sanitizeJob(inserted.rows[0]) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const status = errorStatus(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCollaboratorPool, queryRows } from "@/lib/collaborators/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Platform = "youtube" | "tiktok";

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
  platform: Platform;
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

const ADAPTER_VERSION = "commercial-clearance-adapter-v1";
const PLATFORM_CAPS: Record<Platform, number> = {
  youtube: 25,
  tiktok: 20,
};

function readString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readPlatform(value: unknown): Platform {
  const platform = readString(value)?.toLowerCase();
  if (platform === "youtube" || platform === "tiktok") return platform;
  throw new ApiError(400, "platform must be youtube or tiktok for this clearance slice");
}

function readScope(platform: Platform, value: unknown) {
  const fallback = platform === "youtube" ? "subtitle_smoke" : "metadata_smoke";
  const scope = readString(value)?.toLowerCase() ?? fallback;
  if (platform === "youtube" && ["subtitle_smoke", "smoke"].includes(scope)) return scope;
  if (platform === "tiktok" && ["metadata_smoke", "smoke"].includes(scope)) return scope;
  throw new ApiError(400, `unsupported ${platform} clearance scope`);
}

function adapterFor(platform: Platform, scope: string) {
  if (platform === "youtube" && ["subtitle_smoke", "smoke"].includes(scope)) return "youtube_subtitles_smoke";
  if (platform === "tiktok" && ["metadata_smoke", "smoke"].includes(scope)) return "tiktok_public_metadata_smoke";
  throw new ApiError(400, "unsupported clearance adapter");
}

function canonicalizeUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ApiError(400, "sourceUrl must be an absolute URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new ApiError(400, "sourceUrl must be http(s)");
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (host.startsWith("m.")) host = host.slice(2);
  const path = parsed.pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
  return `https://${host}${path}`;
}

function matchKey(platform: Platform, url: string) {
  const canonical = canonicalizeUrl(url).toLowerCase();
  if (platform === "youtube") return canonical.replace(/\/videos$/, "");
  return canonical;
}

function stableJsonHash(payload: Record<string, unknown>) {
  const ordered = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = payload[key];
      return acc;
    }, {});
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

function clearanceRunId(candidateId: string, platform: Platform, adapter: string, canonicalUrl: string, scope: string, maxRecords: number) {
  return `clear_${candidateId.toLowerCase()}_${platform}_${stableJsonHash({ adapter, candidateId, canonicalUrl, maxRecords, platform, scope }).slice(0, 16)}`;
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

async function loadVerifiedSource(candidateId: string, platform: Platform, requestedUrl: string | null) {
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
  maxRecords,
}: {
  candidateId: string;
  platform: Platform;
  sourceUrlRaw: string;
  sourceUrlCanonical: string;
  scope: string;
  maxRecords: number;
}) {
  const adapter = adapterFor(platform, scope);
  const scopeLevel = "smoke";
  const idempotencyKey = stableJsonHash({
    adapter,
    adapter_version: ADAPTER_VERSION,
    candidate_id: candidateId,
    canonical_source_url: sourceUrlCanonical,
    max_records: maxRecords,
    platform,
    scope,
  });
  const runId = clearanceRunId(candidateId, platform, adapter, sourceUrlCanonical, scope, maxRecords);
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
    maxRecords,
    idempotencyKey,
    clearanceRunId: runId,
    safetyWarnings: platform === "tiktok" ? ["TikTok smoke checks public metadata only; selected-video transcript review may still be required."] : [],
  };
}

export async function GET(request: Request): Promise<Response> {
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
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const candidateId = readString(body.candidateId);
    if (!candidateId) throw new ApiError(400, "candidateId is required");
    const platform = readPlatform(body.platform);
    const scope = readScope(platform, body.scope);
    const requestedMaxRecords = Number(body.maxRecords ?? PLATFORM_CAPS[platform]);
    const maxRecords = Math.min(Number.isFinite(requestedMaxRecords) && requestedMaxRecords > 0 ? Math.floor(requestedMaxRecords) : PLATFORM_CAPS[platform], PLATFORM_CAPS[platform]);
    const apply = body.apply === true;
    const source = await loadVerifiedSource(candidateId, platform, readString(body.sourceUrl));
    const preview = previewPayload({
      candidateId,
      platform,
      sourceUrlRaw: source.sourceUrlRaw,
      sourceUrlCanonical: source.sourceUrlCanonical,
      scope,
      maxRecords,
    });

    if (!apply) {
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
          maxRecords,
          JSON.stringify(payload),
          preview.idempotencyKey,
        ]
      );
      await client.query(
        `INSERT INTO patronpro_collab.research_job_events (
          job_id, seq, status, phase, attempt, detail_json_redacted
        ) VALUES ($1, 1, 'queued', 'queued', 0, $2::jsonb)`,
        [jobId, JSON.stringify({ platform, scope, max_records: maxRecords })]
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
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

import { NextResponse } from "next/server";

import { queryRows } from "@/lib/collaborators/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuditRow = {
  candidate_id: string;
  canonical_name: string;
  source_lane: string;
  candidate_type: string | null;
  candidate_status: string | null;
  shortlist_status: string | null;
  opportunity_tier: string | null;
  collaboration_fit_score: number | string | null;
  evidence_confidence_score: number | string | null;
  social_profile_count: number | string | null;
  social_url_count: number | string | null;
  reach_metric_count: number | string | null;
  captured_reach_metric_count: number | string | null;
  total_accounted_reach: number | string | null;
  verified_social_count: number | string | null;
  disputed_social_count: number | string | null;
  reviewed_media_count: number | string | null;
  transcript_verified_media_count: number | string | null;
  media_domain_conflict_count: number | string | null;
  media_domain_conflict_examples: string[] | null;
  comment_evidence_count: number | string | null;
  website_count: number | string | null;
  website_screenshot_count: number | string | null;
  website_analyzed_count: number | string | null;
  contact_intelligence_count: number | string | null;
  person_relationship_count: number | string | null;
  decision_maker_count: number | string | null;
  contact_person_count: number | string | null;
  person_contact_route_count: number | string | null;
  verified_person_contact_route_count: number | string | null;
  required_question_count: number | string | null;
  answered_question_count: number | string | null;
  answers: Record<string, { answer_status?: string | null }> | null;
  public_tasks: Array<Record<string, unknown>> | null;
  clearance_runs: Array<Record<string, unknown>> | null;
  actionability_status: string | null;
  missing_fields: string[] | null;
  suggested_next_action: string | null;
};

type ActionItem = {
  code: string;
  label: string;
  severity: "P0" | "P1" | "P2";
  detail: string;
};

const REQUIRED_QUESTION_KEYS = [
  "good_fit_for_patronpro",
  "sells_or_recommends_crm",
  "decision_makers",
  "reliable_contact_routes",
  "recommended_outreach_path",
  "collaboration_angle",
];

const BASE_QUERY = `
WITH base AS (
  SELECT *
  FROM patronpro_collab.collaborator_missing_field_audit
  WHERE ($1::text IS NULL OR source_lane = $1::text)
),
media_detail AS (
  SELECT
    mi.candidate_id,
    count(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM patronpro_collab.media_analyses ma
        WHERE ma.media_item_id = mi.media_item_id
          AND coalesce(ma.analysis_status, '') IN ('ok', 'analysis_backed', 'metadata_reviewed')
      )
    ) AS reviewed_media_count,
    count(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM patronpro_collab.media_analyses ma
        WHERE ma.media_item_id = mi.media_item_id
          AND coalesce(ma.analysis_status, '') IN ('ok', 'analysis_backed', 'metadata_reviewed')
          AND coalesce(ma.transcript_status, '') NOT IN ('', 'unknown', 'missing_or_visual_only', 'audio_summary_present_unverified')
      )
    ) AS transcript_verified_media_count
  FROM patronpro_collab.media_items mi
  GROUP BY mi.candidate_id
),
candidate_domains AS (
  SELECT
    candidate_id,
    regexp_replace(lower(coalesce(primary_url, '')), '^https?://(www\\.)?([^/]+).*$', '\\2') AS host
  FROM patronpro_collab.candidates
  WHERE coalesce(primary_url, '') <> ''
),
media_text AS (
  SELECT
    mi.candidate_id,
    mi.media_item_id,
    coalesce(ma.raw_public_payload->>'owner_match_status', '') = 'confirmed' AS owner_confirmed,
    lower(concat_ws(
      ' ',
      mi.canonical_url,
      ma.hook,
      ma.seminar_potential,
      ma.visual_summary,
      ma.audio_summary,
      ma.cta,
      ma.risk_summary,
      ma.raw_public_payload::text
    )) AS searchable_text
  FROM patronpro_collab.media_items mi
  LEFT JOIN patronpro_collab.media_analyses ma ON ma.media_item_id = mi.media_item_id
),
media_external_domains AS (
  SELECT
    mt.candidate_id,
    mt.media_item_id,
    regexp_replace(lower(domain_match[1]), '^www[.]', '') AS host
  FROM media_text mt
  CROSS JOIN LATERAL regexp_matches(
    mt.searchable_text,
    '[a-z0-9][a-z0-9-]*[.][a-z0-9][a-z0-9.-]*[.][a-z]{2,}|[a-z0-9][a-z0-9-]*[.][a-z]{2,}',
    'g'
  ) AS match(domain_match)
  WHERE NOT mt.owner_confirmed
),
media_domain_conflicts AS (
  SELECT
    med.candidate_id,
    count(DISTINCT med.media_item_id)::integer AS media_domain_conflict_count,
    array_agg(DISTINCT coalesce(other.candidate_id || ':', '') || med.host ORDER BY coalesce(other.candidate_id || ':', '') || med.host) AS media_domain_conflict_examples
  FROM media_external_domains med
  LEFT JOIN candidate_domains own ON own.candidate_id = med.candidate_id
  LEFT JOIN candidate_domains other ON other.candidate_id <> med.candidate_id AND other.host = med.host
  WHERE med.host <> ''
    AND med.host NOT IN (
     'facebook.com',
     'instagram.com',
     'linkedin.com',
     'm.facebook.com',
     'tiktok.com',
     'x.com',
     'youtube.com',
     'youtu.be',
     'www.facebook.com',
     'www.instagram.com',
     'www.linkedin.com',
     'www.tiktok.com',
     'www.youtube.com'
   )
    AND regexp_replace(med.host, '^.*[.]', '') NOT IN ('gif', 'jpg', 'jpeg', 'json', 'md', 'mp4', 'png', 'txt', 'vtt', 'webp')
    AND (own.host IS NULL OR own.host = '' OR med.host <> own.host)
  GROUP BY med.candidate_id
),
website_detail AS (
  SELECT
    candidate_id,
    count(*) FILTER (
      WHERE coalesce(crawl_status, '') IN ('ok', 'analyzed', 'captured', 'complete')
         OR summary IS NOT NULL
         OR website_quality_score IS NOT NULL
    ) AS website_analyzed_count,
    coalesce(sum(jsonb_array_length(screenshot_manifest)), 0)::integer AS website_screenshot_count
  FROM patronpro_collab.websites
  GROUP BY candidate_id
),
social_detail AS (
  SELECT
    candidate_id,
    count(*) FILTER (
      WHERE coalesce(status, '') <> ''
        AND coalesce(status, '') NOT LIKE '%wrong%'
        AND coalesce(status, '') NOT LIKE '%disputed%'
        AND coalesce(status, '') NOT LIKE '%unverified%'
        AND (
          coalesce(status, '') LIKE 'active%'
          OR coalesce(status, '') LIKE '%verified%'
          OR coalesce(status, '') LIKE '%public%'
        )
    ) AS verified_social_count,
    count(*) FILTER (WHERE coalesce(status, '') IN ('disputed', 'wrong_profile', 'unverified')) AS disputed_social_count
  FROM patronpro_collab.social_profiles
  GROUP BY candidate_id
)
SELECT
  b.candidate_id,
  b.canonical_name,
  b.source_lane,
  b.candidate_type,
  b.candidate_status,
  b.shortlist_status,
  b.opportunity_tier,
  b.collaboration_fit_score,
  b.evidence_confidence_score,
  b.social_profile_count,
  b.social_url_count,
  b.reach_metric_count,
  b.captured_reach_metric_count,
  b.total_accounted_reach,
  coalesce(sd.verified_social_count, 0)::integer AS verified_social_count,
  coalesce(sd.disputed_social_count, 0)::integer AS disputed_social_count,
  coalesce(md.reviewed_media_count, b.reviewed_media_count, 0)::integer AS reviewed_media_count,
  coalesce(md.transcript_verified_media_count, 0)::integer AS transcript_verified_media_count,
  coalesce(mdc.media_domain_conflict_count, 0)::integer AS media_domain_conflict_count,
  coalesce(mdc.media_domain_conflict_examples, ARRAY[]::text[]) AS media_domain_conflict_examples,
  b.comment_evidence_count,
  b.website_count,
  coalesce(wd.website_screenshot_count, 0)::integer AS website_screenshot_count,
  coalesce(wd.website_analyzed_count, 0)::integer AS website_analyzed_count,
  b.contact_intelligence_count,
  b.person_relationship_count,
  b.decision_maker_count,
  b.contact_person_count,
  b.person_contact_route_count,
  b.verified_person_contact_route_count,
  coalesce(cas.required_question_count, 0)::integer AS required_question_count,
  coalesce(cas.answered_question_count, 0)::integer AS answered_question_count,
  cas.answers,
  cas.public_tasks,
  cas.clearance_runs,
  cas.actionability_status,
  b.missing_fields,
  b.suggested_next_action
FROM base b
LEFT JOIN media_detail md ON md.candidate_id = b.candidate_id
LEFT JOIN media_domain_conflicts mdc ON mdc.candidate_id = b.candidate_id
LEFT JOIN website_detail wd ON wd.candidate_id = b.candidate_id
LEFT JOIN social_detail sd ON sd.candidate_id = b.candidate_id
LEFT JOIN patronpro_collab.candidate_actionability_summary cas ON cas.candidate_id = b.candidate_id
ORDER BY b.source_lane, coalesce(b.collaboration_fit_score, 0) DESC, b.candidate_id
`;

function readNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readMissingFields(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function answerStatus(row: AuditRow, questionKey: string) {
  const answer = row.answers?.[questionKey];
  return typeof answer?.answer_status === "string" ? answer.answer_status : null;
}

function isMeaningfulAnswerStatus(status: string | null) {
  return Boolean(status && !["", "unknown", "missing_data", "pending", "needs_verification"].includes(status));
}

function meaningfulRequiredAnswerCount(row: AuditRow) {
  return REQUIRED_QUESTION_KEYS.filter((key) => isMeaningfulAnswerStatus(answerStatus(row, key))).length;
}

function hasMediaUnavailableReceipt(row: AuditRow) {
  const tasks = readArray(row.public_tasks);
  const clearanceRuns = readArray(row.clearance_runs);
  return (
    tasks.some(
      (task) =>
        task.task_type === "media_refresh" &&
        task.status === "blocked" &&
        typeof task.blocker_reason === "string" &&
        task.blocker_reason.toLowerCase().includes("no official owned public")
    ) ||
    clearanceRuns.some(
      (run) =>
        run.clearance_status === "blocked" &&
        run.blocked_reason === "no_public_data" &&
        typeof run.source_url === "string"
    )
  );
}

function addAction(actions: ActionItem[], code: string, label: string, severity: ActionItem["severity"], detail: string) {
  actions.push({ code, label, severity, detail });
}

function expectedMediaCount(row: AuditRow) {
  if (row.shortlist_status === "reject" || row.shortlist_status === "out_of_scope") return 0;
  if (row.source_lane === "communities") return 0;
  return 8;
}

function buildActionItems(row: AuditRow, strict: boolean) {
  const actions: ActionItem[] = [];
  const missingFields = readMissingFields(row.missing_fields);

  if (!strict) {
    for (const field of missingFields) {
      addAction(actions, `missing_${field}`, `Fill ${field.replace(/_/g, " ")}`, "P1", "Base audit field is missing.");
    }
    return actions;
  }

  const requiredMedia = expectedMediaCount(row);
  const reviewedMedia = readNumber(row.reviewed_media_count);
  const transcriptMedia = readNumber(row.transcript_verified_media_count);
  const mediaDomainConflicts = readNumber(row.media_domain_conflict_count);
  const commentEvidence = readNumber(row.comment_evidence_count);
  const socialUrls = readNumber(row.social_url_count);
  const capturedReach = readNumber(row.captured_reach_metric_count);
  const websites = readNumber(row.website_count);
  const websiteAnalyzed = readNumber(row.website_analyzed_count);
  const websiteScreenshots = readNumber(row.website_screenshot_count);
  const decisionMakers = readNumber(row.decision_maker_count);
  const verifiedRoutes = readNumber(row.verified_person_contact_route_count);
  const requiredQuestions = readNumber(row.required_question_count);
  const answeredQuestions = meaningfulRequiredAnswerCount(row);

  if (!row.shortlist_status || row.shortlist_status === "needs_review") {
    addAction(actions, "score_candidate", "Score and classify candidate", "P1", "No stable shortlist status is present.");
  }

  if (socialUrls === 0) {
    addAction(actions, "find_social_profiles", "Find verified social profiles", "P0", "No verified public social URL is registered.");
  }

  if (socialUrls > 0 && capturedReach < socialUrls) {
    addAction(
      actions,
      "capture_missing_social_metrics",
      "Capture follower/subscriber metrics",
      "P1",
      `${capturedReach}/${socialUrls} social profiles have dated reach metrics.`
    );
  }

  if (requiredMedia > 0 && reviewedMedia < requiredMedia && !hasMediaUnavailableReceipt(row)) {
    addAction(
      actions,
      "source_review_media_to_8",
      "Source and review media to 8 items",
      "P0",
      `${reviewedMedia}/${requiredMedia} reviewed media items are present.`
    );
  }

  if (reviewedMedia > 0 && transcriptMedia < reviewedMedia) {
    addAction(
      actions,
      "verify_media_transcripts",
      "Verify reviewed media with transcripts",
      "P0",
      `${transcriptMedia}/${reviewedMedia} reviewed media items are transcript-backed or explicit no-speech.`
    );
  }

  if (mediaDomainConflicts > 0) {
    const examples = readArray(row.media_domain_conflict_examples)
      .map((item) => String(item))
      .slice(0, 3)
      .join(", ");
    addAction(
      actions,
      "review_media_ownership_conflict",
      "Review possible media ownership mismatch",
      "P0",
      `${mediaDomainConflicts} reviewed media items reference another registered candidate domain${examples ? ` (${examples})` : ""}.`
    );
  }

  if (requiredMedia > 0 && reviewedMedia > 0 && commentEvidence < Math.min(reviewedMedia, requiredMedia)) {
    addAction(
      actions,
      "capture_comment_evidence",
      "Capture comment evidence",
      "P1",
      `${commentEvidence}/${Math.min(reviewedMedia, requiredMedia)} expected media/comment evidence links are present.`
    );
  }

  if (row.source_lane === "schools") {
    if (websites === 0) {
      addAction(actions, "run_deep_website_review", "Run website review", "P0", "No website crawl/review row is registered.");
    } else {
      if (websiteAnalyzed === 0) {
        addAction(actions, "complete_website_analysis", "Complete website analysis", "P0", "Website exists but no analysis summary/quality score is present.");
      }
      if (websiteScreenshots === 0) {
        addAction(actions, "capture_website_screenshots", "Capture website screenshots", "P0", "Website exists but screenshot manifest is empty.");
      }
    }
  }

  if (decisionMakers === 0 && answerStatus(row, "decision_makers") !== "not_found") {
    addAction(actions, "find_decision_maker", "Find owner/decision-maker", "P0", "No decision-maker relationship is registered.");
  }

  if (verifiedRoutes === 0) {
    addAction(actions, "verify_contact_route", "Verify contact route", "P0", "No verified contact route is registered.");
  }

  if (requiredQuestions > 0 && answeredQuestions < REQUIRED_QUESTION_KEYS.length) {
    addAction(
      actions,
      "answer_research_questions",
      "Answer Duncan actionability questions",
      "P0",
      `${answeredQuestions}/${REQUIRED_QUESTION_KEYS.length} active required research questions are meaningfully answered.`
    );
  }

  return actions;
}

function buildCaveats(row: AuditRow) {
  const caveats: string[] = [];
  const requiredMedia = expectedMediaCount(row);
  const reviewedMedia = readNumber(row.reviewed_media_count);

  if (requiredMedia > 0 && reviewedMedia < requiredMedia && hasMediaUnavailableReceipt(row)) {
    caveats.push(
      `${reviewedMedia}/${requiredMedia} reviewed media items are present, but a no-public-owned-media blocker receipt exists. Treat as a marketing/reach weakness, not an unfinished download.`
    );
  }

  if (readNumber(row.decision_maker_count) === 0 && answerStatus(row, "decision_makers") === "not_found") {
    caveats.push("No named decision maker was verified after public-source review; use the official business contact route unless a human finds a named owner/director.");
  }

  return caveats;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const lane = url.searchParams.get("lane");
    const strict = ["1", "true", "yes"].includes((url.searchParams.get("strict") ?? "").toLowerCase());
    const onlyRepair = ["1", "true", "yes"].includes((url.searchParams.get("repair") ?? "").toLowerCase());

    if (lane && !["schools", "influencers", "communities"].includes(lane)) {
      return NextResponse.json({ error: "lane must be schools, influencers, or communities" }, { status: 400 });
    }

    const rows = await queryRows<AuditRow>(BASE_QUERY, [lane || null]);
    const payloadRows = rows
      .map((row) => {
        const actionItems = buildActionItems(row, strict);
        const caveats = buildCaveats(row);
        const meaningfulAnswers = meaningfulRequiredAnswerCount(row);
        const reviewStatus = actionItems.length ? "needs_repair" : "ready_for_review";
        return {
          candidateId: row.candidate_id,
          name: row.canonical_name,
          lane: row.source_lane,
          type: row.candidate_type,
          shortlistStatus: row.shortlist_status,
          opportunityTier: row.opportunity_tier,
          fitScore: readNumber(row.collaboration_fit_score),
          evidenceConfidence: readNumber(row.evidence_confidence_score),
          actionabilityStatus: row.actionability_status,
          reviewStatus,
          counts: {
            socialUrls: readNumber(row.social_url_count),
            capturedReachMetrics: readNumber(row.captured_reach_metric_count),
            totalAccountedReach: readNumber(row.total_accounted_reach),
            verifiedSocialProfiles: readNumber(row.verified_social_count),
            disputedSocialProfiles: readNumber(row.disputed_social_count),
            reviewedMedia: readNumber(row.reviewed_media_count),
            transcriptVerifiedMedia: readNumber(row.transcript_verified_media_count),
            mediaDomainConflicts: readNumber(row.media_domain_conflict_count),
            commentEvidence: readNumber(row.comment_evidence_count),
            websites: readNumber(row.website_count),
            websiteAnalyzed: readNumber(row.website_analyzed_count),
            websiteScreenshots: readNumber(row.website_screenshot_count),
            contactIntelligence: readNumber(row.contact_intelligence_count),
            decisionMakers: readNumber(row.decision_maker_count),
            contactPeople: readNumber(row.contact_person_count),
            contactRoutes: readNumber(row.person_contact_route_count),
            verifiedContactRoutes: readNumber(row.verified_person_contact_route_count),
            requiredQuestions: readNumber(row.required_question_count),
            answeredQuestions: meaningfulAnswers,
            rawAnswerRows: readNumber(row.answered_question_count),
          },
          baseMissingFields: readMissingFields(row.missing_fields),
          suggestedNextAction: row.suggested_next_action,
          caveats,
          actionItems,
        };
      })
      .filter((row) => !onlyRepair || row.actionItems.length > 0);

    const repairCount = payloadRows.filter((row) => row.actionItems.length > 0).length;

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        lane: lane || "all",
        strict,
        rowCount: payloadRows.length,
        repairCount,
        rows: payloadRows,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown audit error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

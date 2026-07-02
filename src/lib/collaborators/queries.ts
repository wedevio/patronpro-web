import "server-only";

import { queryRows } from "./db";
import { projectCandidate, projectSummary, projectTaskReviewMetadata, type RawCandidateRow } from "./projections";
import type { CandidateTaskProjection, CollaboratorLane, CollaboratorProjection, DashboardSummary } from "./types";

const candidateSelect = `
WITH actionability_summary AS (
  SELECT *
  FROM (
    SELECT
      cas.*,
      row_number() OVER (
        PARTITION BY candidate_id
        ORDER BY
          CASE WHEN shortlist_status = 'recommend' THEN 0 WHEN shortlist_status = 'watchlist' THEN 1 WHEN shortlist_status = 'needs_review' THEN 2 ELSE 3 END,
          coalesce(collaboration_fit_score, 0) DESC,
          coalesce(evidence_confidence_score, 0) DESC,
          answered_question_count DESC
      ) AS actionability_row_rank
    FROM patronpro_collab.candidate_actionability_summary cas
  ) ranked_actionability
  WHERE actionability_row_rank = 1
),
audit_summary AS (
  SELECT *
  FROM (
    SELECT
      a.*,
      row_number() OVER (
        PARTITION BY candidate_id
        ORDER BY
          CASE WHEN shortlist_status = 'recommend' THEN 0 WHEN shortlist_status = 'watchlist' THEN 1 WHEN shortlist_status = 'needs_review' THEN 2 ELSE 3 END,
          coalesce(collaboration_fit_score, 0) DESC,
          coalesce(evidence_confidence_score, 0) DESC,
          coalesce(reach_metric_count, 0) DESC,
          coalesce(reviewed_media_count, 0) DESC
      ) AS audit_row_rank
    FROM patronpro_collab.collaborator_missing_field_audit a
  ) ranked_audit
  WHERE audit_row_rank = 1
)
SELECT
  c.candidate_id,
  c.candidate_type,
  c.source_lane,
  c.canonical_name,
  c.status,
  c.primary_url,
  c.category_tags,
  c.capture_summary,
  c.combined_reach,
  s.shortlist_status,
  s.opportunity_tier,
  s.score_version,
  s.reviewed_at,
  s.score_inputs,
  s.collaboration_fit_score,
  s.evidence_confidence_score,
  s.recommended_collaboration_angle,
  s.rank_reason,
  s.opportunities,
  s.shortcomings,
  s.risks,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(sp) ORDER BY sp.platform, sp.canonical_url)
    FROM patronpro_collab.social_profiles sp
    WHERE sp.candidate_id = c.candidate_id
      AND lower(coalesce(sp.status, '')) !~ '^(superseded|duplicate)'
  ), '[]'::jsonb) AS social_profiles,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(w) ORDER BY w.url)
    FROM patronpro_collab.websites w
    WHERE w.candidate_id = c.candidate_id
      AND lower(coalesce(w.crawl_status, '')) !~ '^(superseded|duplicate)'
  ), '[]'::jsonb) AS websites,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'media_item_id', m.media_item_id,
        'platform', m.platform,
        'canonical_url', m.canonical_url,
        'slot', m.slot,
        'selected_rank', m.selected_rank,
        'selection_bucket', m.selection_bucket,
        'selection_reason', m.selection_reason,
        'views_count', m.views_count,
        'likes_count', m.likes_count,
        'comments_count', m.comments_count,
        'shares_count', m.shares_count,
        'saves_count', m.saves_count,
        'visible_metrics', m.visible_metrics,
        'source_type', m.source_type,
        'verification_status', m.verification_status,
        'analysis_status', ma.analysis_status,
        'score_0_100', ma.score_0_100,
        'language', ma.language,
        'hook', ma.hook,
        'seminar_potential', ma.seminar_potential,
        'visual_summary', ma.visual_summary,
        'audio_summary', ma.audio_summary,
        'cta', ma.cta,
        'risk_summary', ma.risk_summary,
        'production_quality', ma.production_quality,
        'transcript_status', ma.transcript_status,
        'contact_sheet_path', ma.contact_sheet_path,
        'representative_screenshot_path', ma.representative_screenshot_path
      )
      ORDER BY m.selected_rank NULLS LAST, m.slot NULLS LAST, m.media_item_id
    )
    FROM patronpro_collab.media_items m
    LEFT JOIN patronpro_collab.media_analyses ma ON ma.media_item_id = m.media_item_id
    WHERE m.candidate_id = c.candidate_id
      AND coalesce(m.source_type, '') NOT IN ('misattributed_media', 'superseded_media')
  ), '[]'::jsonb) AS media_items,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(ci) ORDER BY ci.captured_at DESC NULLS LAST)
    FROM patronpro_collab.contact_intelligence ci
    WHERE ci.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS contact_intelligence,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(cb) ORDER BY cb.contact_book_rank)
    FROM patronpro_collab.candidate_contact_book cb
    WHERE cb.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS contact_book,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'relationship_id', cr.candidate_relationship_id,
        'relationship_type', cr.relationship_type,
        'relationship_status', cr.relationship_status,
        'confidence', cr.confidence,
        'evidence_summary', cr.evidence_summary,
        'source_urls', cr.source_urls,
        'captured_at', cr.captured_at,
        'candidate_id', tc.candidate_id,
        'candidate_name', tc.canonical_name,
        'candidate_lane', tc.source_lane,
        'candidate_type', tc.candidate_type,
        'primary_url', tc.primary_url,
        'combined_reach', tc.combined_reach,
        'shortlist_status', ts.shortlist_status,
        'collaboration_fit_score', ts.collaboration_fit_score
      )
      ORDER BY
        CASE cr.confidence WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
        tc.canonical_name
    )
    FROM patronpro_collab.candidate_relationships cr
    JOIN patronpro_collab.candidates tc ON tc.candidate_id = cr.target_candidate_id
    LEFT JOIN LATERAL (
      SELECT *
      FROM patronpro_collab.scorecards sc_rel
      WHERE sc_rel.candidate_id = tc.candidate_id
      ORDER BY sc_rel.reviewed_at DESC NULLS LAST, sc_rel.created_at DESC
      LIMIT 1
    ) ts ON true
    WHERE cr.source_candidate_id = c.candidate_id
      AND cr.is_active
      AND lower(coalesce(cr.relationship_type, '')) ~ '(external|collaborator|partner|sponsor|affiliate|featured)'
  ), '[]'::jsonb) AS external_collaborators,
  COALESCE((
    SELECT jsonb_object_agg(
      rq.question_key,
      jsonb_build_object(
        'question_id', rq.question_id,
        'label', rq.label,
        'short_label', rq.short_label,
        'answer_type', rq.answer_type,
        'display_order', rq.display_order,
        'dashboard_card_group', rq.dashboard_card_group,
        'answer_status', COALESCE(answer.payload->>'answer_status', 'missing_data'),
        'answer_value', COALESCE(answer.payload->>'answer_value', 'Missing data: this still needs verification before outreach.'),
        'answer_json', COALESCE(answer.payload->'answer_json', '{}'::jsonb),
        'confidence', COALESCE(answer.payload->>'confidence', 'missing'),
        'evidence_summary', COALESCE(answer.payload->>'evidence_summary', rq.guidance, 'No verified answer captured yet.'),
        'source_urls', COALESCE(answer.payload->'source_urls', '[]'::jsonb),
        'captured_at', answer.payload->>'captured_at',
        'reviewed_at', answer.payload->>'reviewed_at'
      )
      ORDER BY rq.display_order
    )
    FROM patronpro_collab.research_goal_sets gs
    JOIN patronpro_collab.research_questions rq ON rq.goal_set_id = gs.goal_set_id
    LEFT JOIN LATERAL (
      SELECT cas.answers -> rq.question_key AS payload
      FROM actionability_summary cas
      WHERE cas.candidate_id = c.candidate_id
    ) answer ON true
    WHERE gs.project_key = 'patron-pro-collab-prospect-research'
      AND gs.status = 'active'
  ), '{}'::jsonb) AS actionability_answers,
  COALESCE((
    SELECT cas.public_tasks
    FROM actionability_summary cas
    WHERE cas.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS public_tasks,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'task_id', t.candidate_task_id,
        'task_type', t.task_type,
        'label', t.public_label,
        'summary', t.stakeholder_summary,
        'status', t.status,
        'priority', t.priority,
        'blocker_reason', t.blocker_reason,
        'follow_up_at', t.follow_up_at,
        'completed_at', t.completed_at,
        'crm_sync_eligible', t.crm_sync_eligible,
        'manual_review_required', t.manual_review_required,
        'manual_reviewed', t.manual_reviewed,
        'manual_review_verdict', t.manual_review_verdict,
        'manual_review_notes', t.manual_review_notes,
        'manual_reviewed_at', t.manual_reviewed_at,
        'manual_reviewed_by', t.manual_reviewed_by,
        'updated_at', t.updated_at,
        'raw_public_payload', t.raw_public_payload
      )
      ORDER BY
        CASE t.priority WHEN 'P0' THEN 1 WHEN 'P1' THEN 2 WHEN 'P2' THEN 3 ELSE 4 END,
        t.updated_at DESC
    )
    FROM patronpro_collab.candidate_tasks t
    WHERE t.candidate_id = c.candidate_id
      AND t.task_type = 'manual_review'
      AND t.manual_review_required
      AND t.visibility = 'public_dashboard'
  ), '[]'::jsonb) AS manual_review_tasks,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'clearance_run_id', run.clearance_run_id,
        'platform', run.platform,
        'source_url', run.source_url,
        'run_completed_at', run.run_completed_at,
        'items_scanned', run.items_scanned,
        'subtitle_or_transcript_count', run.subtitle_or_transcript_count,
        'keyword_hit_count', run.keyword_hit_count,
        'confirmed_finding_count', run.confirmed_finding_count,
        'clearance_status', run.clearance_status,
        'blocked_reason', run.blocked_reason,
        'reviewed_at', run.reviewed_at,
        'evidence_confidence_score', run.evidence_confidence_score,
        'confirmed_findings', run.confirmed_findings,
        'false_positive_notes', run.false_positive_notes,
        'blockers', run.blockers,
        'raw_public_payload', run.raw_public_payload
      )
      ORDER BY run.run_completed_at DESC NULLS LAST
    )
    FROM (
      SELECT *
      FROM patronpro_collab.candidate_clearance_runs ccr
      WHERE ccr.candidate_id = c.candidate_id
      ORDER BY ccr.run_completed_at DESC NULLS LAST
      LIMIT 8
    ) run
  ), '[]'::jsonb) AS clearance_runs,
  COALESCE(a.missing_fields, ARRAY[]::text[]) AS missing_fields,
  a.suggested_next_action
FROM patronpro_collab.candidates c
LEFT JOIN LATERAL (
  SELECT *
  FROM patronpro_collab.scorecards sc
  WHERE sc.candidate_id = c.candidate_id
  ORDER BY sc.reviewed_at DESC NULLS LAST, sc.created_at DESC
  LIMIT 1
) s ON true
LEFT JOIN audit_summary a ON a.candidate_id = c.candidate_id
`;

const orderBy = `
ORDER BY
  CASE COALESCE(s.shortlist_status, c.status)
    WHEN 'recommend' THEN 1
    WHEN 'watchlist' THEN 2
    WHEN 'ready_for_review' THEN 3
    WHEN 'defer' THEN 4
    ELSE 9
  END,
  COALESCE(s.collaboration_fit_score, c.compatibility_score, 0) DESC,
  c.candidate_id
`;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [laneRows, readyRows, missingRows, mediaRows] = await Promise.all([
    queryRows<{ source_lane: CollaboratorLane; count: string }>(
      "SELECT source_lane, count(*) FROM patronpro_collab.candidates GROUP BY source_lane"
    ),
    queryRows<{ count: string }>(
      "SELECT count(*) FROM patronpro_collab.collaborator_missing_field_audit WHERE cardinality(missing_fields) = 0"
    ),
    queryRows<{ count: string }>(
      "SELECT count(*) FROM patronpro_collab.collaborator_missing_field_audit WHERE cardinality(missing_fields) > 0"
    ),
    queryRows<{ count: string }>("SELECT count(*) FROM patronpro_collab.media_items"),
  ]);
  return projectSummary(
    laneRows,
    Number(readyRows[0]?.count ?? 0),
    Number(missingRows[0]?.count ?? 0),
    Number(mediaRows[0]?.count ?? 0)
  );
}

export async function getCollaborators(lane?: CollaboratorLane): Promise<CollaboratorProjection[]> {
  const rows = await queryRows<RawCandidateRow>(`${candidateSelect} ${lane ? "WHERE c.source_lane = $1" : ""} ${orderBy}`, lane ? [lane] : []);
  return rows.map(projectCandidate);
}

export async function getRecommendations(): Promise<CollaboratorProjection[]> {
  const rows = await queryRows<RawCandidateRow>(`${candidateSelect}
WHERE COALESCE(s.shortlist_status, c.status) IN ('recommend', 'watchlist', 'ready_for_review')
${orderBy}
LIMIT 40`);
  return rows.map(projectCandidate);
}

export async function getCollaborator(lane: CollaboratorLane, id: string): Promise<CollaboratorProjection | null> {
  const rows = await queryRows<RawCandidateRow>(`${candidateSelect} WHERE c.source_lane = $1 AND c.candidate_id = $2 LIMIT 1`, [lane, id]);
  return rows[0] ? projectCandidate(rows[0]) : null;
}

type TaskQueueRow = {
  candidate_task_id: string;
  candidate_id: string;
  canonical_name: string;
  source_lane: CollaboratorLane;
  task_type: string;
  public_label: string;
  stakeholder_summary?: string | null;
  status?: string | null;
  priority?: string | null;
  blocker_reason?: string | null;
  follow_up_at?: string | null;
  completed_at?: string | null;
  crm_sync_eligible?: boolean | null;
  manual_review_required?: boolean | null;
  manual_reviewed?: boolean | null;
  manual_review_verdict?: CandidateTaskProjection["manualReviewVerdict"] | null;
  manual_review_notes?: string | null;
  manual_reviewed_at?: string | null;
  manual_reviewed_by?: string | null;
  updated_at?: string | null;
  raw_public_payload?: Record<string, unknown> | null;
};

export async function getCommercialReviewTasks(): Promise<CandidateTaskProjection[]> {
  const rows = await queryRows<TaskQueueRow>(`
    SELECT
      t.candidate_task_id,
      c.candidate_id,
      c.canonical_name,
      c.source_lane,
      t.task_type,
      t.public_label,
      t.stakeholder_summary,
      t.status,
      t.priority,
      t.blocker_reason,
      t.follow_up_at,
      t.completed_at,
      t.crm_sync_eligible,
      t.manual_review_required,
      t.manual_reviewed,
      t.manual_review_verdict,
      t.manual_review_notes,
      t.manual_reviewed_at,
      t.manual_reviewed_by,
      t.updated_at,
      t.raw_public_payload
    FROM patronpro_collab.candidate_tasks t
    JOIN patronpro_collab.candidates c ON c.candidate_id = t.candidate_id
    WHERE t.visibility = 'public_dashboard'
      AND t.status IN ('open', 'in_progress', 'blocked')
      AND t.manual_review_required
    ORDER BY
      CASE t.priority WHEN 'P0' THEN 1 WHEN 'P1' THEN 2 WHEN 'P2' THEN 3 ELSE 4 END,
      CASE t.status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'blocked' THEN 3 ELSE 4 END,
      c.candidate_id,
      t.updated_at DESC
  `);

  return rows.map((row) => ({
    id: row.candidate_task_id,
    candidateId: row.candidate_id,
    candidateName: row.canonical_name,
    candidateLane: row.source_lane,
    candidateHref: `/collaborators/${row.source_lane}/${row.candidate_id}`,
    type: row.task_type,
    label: row.public_label,
    summary: row.stakeholder_summary,
    status: row.status,
    priority: row.priority,
    blockerReason: row.blocker_reason,
    followUpAt: row.follow_up_at,
    completedAt: row.completed_at,
    ...projectTaskReviewMetadata(row.raw_public_payload),
    crmSyncEligible: Boolean(row.crm_sync_eligible),
    manualReviewRequired: Boolean(row.manual_review_required),
    manualReviewed: Boolean(row.manual_reviewed),
    manualReviewVerdict:
      row.manual_review_verdict === "no_conflict" ||
      row.manual_review_verdict === "conflict" ||
      row.manual_review_verdict === "needs_follow_up" ||
      row.manual_review_verdict === "not_reviewed"
        ? row.manual_review_verdict
        : "not_reviewed",
    manualReviewNotes: row.manual_review_notes,
    manualReviewedAt: row.manual_reviewed_at,
    manualReviewedBy: row.manual_reviewed_by,
    updatedAt: row.updated_at,
  }));
}

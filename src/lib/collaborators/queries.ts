import "server-only";

import { queryRows } from "./db";
import { projectCandidate, projectSummary, type RawCandidateRow } from "./projections";
import type { CollaboratorLane, CollaboratorProjection, DashboardSummary } from "./types";

const candidateSelect = `
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
  ), '[]'::jsonb) AS social_profiles,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(w) ORDER BY w.url)
    FROM patronpro_collab.websites w
    WHERE w.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS websites,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(m) || to_jsonb(ma) ORDER BY m.selected_rank NULLS LAST, m.slot NULLS LAST, m.media_item_id)
    FROM patronpro_collab.media_items m
    LEFT JOIN patronpro_collab.media_analyses ma ON ma.media_item_id = m.media_item_id
    WHERE m.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS media_items,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(ci) ORDER BY ci.captured_at DESC NULLS LAST)
    FROM patronpro_collab.contact_intelligence ci
    WHERE ci.candidate_id = c.candidate_id
  ), '[]'::jsonb) AS contact_intelligence,
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
LEFT JOIN patronpro_collab.collaborator_missing_field_audit a ON a.candidate_id = c.candidate_id
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

import { NextResponse } from "next/server";

import { requireDocsEditor } from "@/lib/auth/require-session";
import { queryRows } from "@/lib/collaborators/db";
import { projectTaskReviewMetadata } from "@/lib/collaborators/projections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verdicts = new Set(["not_reviewed", "no_conflict", "conflict", "needs_follow_up"]);

type TaskRow = {
  candidate_task_id: string;
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
  manual_review_verdict?: string | null;
  manual_review_notes?: string | null;
  manual_reviewed_at?: string | null;
  manual_reviewed_by?: string | null;
  updated_at?: string | null;
  raw_public_payload?: Record<string, unknown> | null;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function readString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function sanitizeNotes(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > 2000) throw new ApiError(422, "notes must be 2000 characters or fewer");
  if (/\/mnt\/|\/home\/|cookie|token|signed_url|api[_-]?key|secret/i.test(text)) {
    throw new ApiError(422, "notes cannot contain internal paths or secret-shaped text");
  }
  return text || null;
}

function projectTask(row: TaskRow) {
  return {
    id: row.candidate_task_id,
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
    manualReviewVerdict: row.manual_review_verdict ?? "not_reviewed",
    manualReviewNotes: row.manual_review_notes,
    manualReviewedAt: row.manual_reviewed_at,
    manualReviewedBy: row.manual_reviewed_by,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireDocsEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const taskId = readString(body.taskId);
    if (!taskId) throw new ApiError(400, "taskId is required");

    const reviewed = Boolean(body.reviewed);
    const notes = sanitizeNotes(body.notes);
    const requestedVerdict = readString(body.verdict) ?? "not_reviewed";
    if (!verdicts.has(requestedVerdict)) throw new ApiError(422, "invalid verdict");

    const verdict = reviewed ? requestedVerdict : "not_reviewed";
    if (reviewed && verdict === "not_reviewed") throw new ApiError(422, "reviewed tasks need a verdict");
    if ((verdict === "conflict" || verdict === "needs_follow_up") && !notes) {
      throw new ApiError(422, "conflict and follow-up verdicts need notes");
    }

    const status = reviewed ? (verdict === "needs_follow_up" ? "in_progress" : "done") : "open";
    const [row] = await queryRows<TaskRow>(
      `UPDATE patronpro_collab.candidate_tasks
       SET
         manual_reviewed = $2,
         manual_review_verdict = $3,
         manual_review_notes = $4,
         manual_reviewed_at = CASE WHEN $2 THEN now() ELSE NULL END,
         manual_reviewed_by = CASE WHEN $2 THEN $5 ELSE NULL END,
         status = $6,
         completed_at = CASE WHEN $6 = 'done' THEN now() ELSE NULL END,
         updated_at = now()
       WHERE candidate_task_id = $1
         AND task_type = 'manual_review'
         AND manual_review_required
         AND visibility = 'public_dashboard'
       RETURNING
         candidate_task_id,
         task_type,
         public_label,
         stakeholder_summary,
         status,
         priority,
         blocker_reason,
         follow_up_at,
         completed_at,
         crm_sync_eligible,
         manual_review_required,
         manual_reviewed,
         manual_review_verdict,
         manual_review_notes,
         manual_reviewed_at,
         manual_reviewed_by,
         updated_at,
         raw_public_payload`,
      [taskId, reviewed, verdict, notes, auth.session.email, status]
    );
    if (!row) throw new ApiError(404, "manual review task not found");

    return NextResponse.json({ ok: true, task: projectTask(row) });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

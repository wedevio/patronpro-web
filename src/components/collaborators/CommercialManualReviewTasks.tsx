"use client";

import { CheckCircle2, Circle, ExternalLink, StickyNote } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CandidateTaskProjection } from "@/lib/collaborators/types";

const verdicts = [
  ["not_reviewed", "Not reviewed"],
  ["no_conflict", "No conflict"],
  ["conflict", "Conflict"],
  ["needs_follow_up", "Needs follow-up"],
] as const;

type Verdict = (typeof verdicts)[number][0];
type TaskState = CandidateTaskProjection & {
  saving?: boolean;
  error?: string | null;
  saved?: boolean;
};

function taskStatus(task: TaskState) {
  if (task.saving) return "Saving";
  if (task.error) return task.error;
  if (task.saved) return "Saved";
  if (task.manualReviewedAt) return "Reviewed";
  return task.status ?? "Open";
}

const targetLabels: Record<string, string> = {
  social_profile_bio: "Profile / bio",
  bio_link_out: "Bio link",
  landing_page: "Landing page",
  cited_media: "Cited media",
  clearance_blocker: "Clearance blocker",
  commercial_signal_source: "Commercial source",
};

function displayUrl(url: string) {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "");
    return `${parsed.hostname}${path}`;
  } catch {
    return url;
  }
}

function targetType(task: CandidateTaskProjection) {
  return task.reviewTargetType ? (targetLabels[task.reviewTargetType] ?? task.reviewTargetType) : "Review";
}

function groupTasks(tasks: TaskState[], showCandidate: boolean) {
  const groups = new Map<string, TaskState[]>();
  for (const task of tasks) {
    const key = showCandidate ? (task.candidateName ?? task.candidateId ?? "Unassigned") : targetType(task);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return [...groups.entries()];
}

export function CommercialManualReviewTasks({ tasks, showCandidate = false }: { tasks: CandidateTaskProjection[]; showCandidate?: boolean }) {
  const [items, setItems] = useState<TaskState[]>(tasks.map((task) => ({ ...task, saved: false, error: null })));
  if (!items.length) return null;

  function updateItem(taskId: string, patch: Partial<TaskState>) {
    setItems((current) => current.map((item) => (item.id === taskId ? { ...item, ...patch, saved: false, error: null } : item)));
  }

  async function saveTask(task: TaskState, patch: Partial<TaskState>) {
    const next = { ...task, ...patch };
    updateItem(task.id, { ...patch, saving: true });
    try {
      const response = await fetch("/api/collaborators/manual-review-tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: next.id,
          reviewed: Boolean(next.manualReviewed),
          verdict: next.manualReviewVerdict ?? "not_reviewed",
          notes: next.manualReviewNotes ?? "",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; task?: CandidateTaskProjection };
      if (!response.ok || !payload.ok || !payload.task) throw new Error(payload.error ?? "Could not save review");
      setItems((current) =>
        current.map((item) => (item.id === task.id ? { ...item, ...payload.task, saving: false, saved: true, error: null } : item)),
      );
    } catch (error) {
      updateItem(task.id, { saving: false, error: error instanceof Error ? error.message : "Could not save review" });
    }
  }

  return (
    <div className="grid gap-5">
      {groupTasks(items, showCandidate).map(([group, groupItems]) => (
        <details key={group} open={!showCandidate} className="overflow-hidden rounded-xl border border-[#dfe5ee] bg-white">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-[#edf1f6] bg-[#f8fafc] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-[#182235]">{group}</h3>
              {showCandidate && groupItems[0]?.candidateHref ? (
                <Link href={groupItems[0].candidateHref ?? "#"} className="mt-1 inline-block text-xs font-semibold text-[#1d5fa7] underline-offset-4 hover:underline">
                  Open collaborator
                </Link>
              ) : null}
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#526078]">
              {groupItems.filter((task) => task.manualReviewed).length}/{groupItems.length} reviewed
            </span>
          </summary>

          <div className="hidden grid-cols-[44px_minmax(220px,1.5fr)_minmax(180px,1fr)_150px_86px] gap-3 border-b border-[#edf1f6] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d] lg:grid">
            <span>Done</span>
            <span>Task</span>
            <span>Target</span>
            <span>Verdict</span>
            <span>Notes</span>
          </div>

          <div className="divide-y divide-[#edf1f6]">
            {groupItems.map((task) => (
              <div key={task.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[44px_minmax(220px,1.5fr)_minmax(180px,1fr)_150px_86px] lg:items-start">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#182235] lg:justify-center">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={Boolean(task.manualReviewed)}
                    onChange={(event) =>
                      void saveTask(task, {
                        manualReviewed: event.target.checked,
                        manualReviewVerdict: event.target.checked
                          ? task.manualReviewVerdict === "not_reviewed" || !task.manualReviewVerdict
                            ? "no_conflict"
                            : task.manualReviewVerdict
                          : "not_reviewed",
                      })
                    }
                  />
                  {task.manualReviewed ? <CheckCircle2 className="h-5 w-5 text-[#1d6a3a]" /> : <Circle className="h-5 w-5 text-[#9aa6b8]" />}
                  <span className="lg:hidden">Reviewed</span>
                </label>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef4fb] px-2 py-1 text-xs font-semibold text-[#355879]">{targetType(task)}</span>
                    <span className="rounded-full bg-[#f8fafc] px-2 py-1 text-xs font-semibold text-[#526078]">{task.priority ?? "review"}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.error ? "bg-[#fff0f0] text-[#9f1d1d]" : "bg-[#f8fafc] text-[#526078]"}`}>
                      {taskStatus(task)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5 text-[#182235]">{task.reviewTargetLabel ?? task.label}</p>
                  {task.blockerReason ? <p className="mt-1 text-xs leading-5 text-[#7c4a05]">{task.blockerReason}</p> : null}
                </div>

                <div className="grid gap-1">
                  {task.reviewUrl ? (
                    <a
                      href={task.reviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm font-semibold text-[#1d5fa7] underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <span className="truncate">{displayUrl(task.reviewUrl)}</span>
                    </a>
                  ) : null}
                  {(task.contextUrls ?? []).slice(0, 1).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="truncate text-xs font-semibold text-[#526078] underline-offset-4 hover:underline">
                      Context: {displayUrl(url)}
                    </a>
                  ))}
                </div>

                <select
                  aria-label={`Verdict for ${task.label}`}
                  className="min-h-9 rounded-md border border-[#dfe5ee] bg-white px-2 text-sm font-semibold text-[#182235]"
                  value={task.manualReviewVerdict ?? "not_reviewed"}
                  onChange={(event) => {
                    const verdict = event.target.value as Verdict;
                    void saveTask(task, { manualReviewVerdict: verdict, manualReviewed: verdict !== "not_reviewed" });
                  }}
                >
                  {verdicts.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <details className="group relative">
                  <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm font-semibold text-[#526078]">
                    <StickyNote className="h-4 w-4" />
                    {task.manualReviewNotes ? "Edit" : "Add"}
                  </summary>
                  <label className="mt-2 grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d] lg:absolute lg:right-0 lg:top-10 lg:z-10 lg:w-[min(460px,calc(100vw-2rem))] lg:rounded-xl lg:border lg:border-[#dfe5ee] lg:bg-white lg:p-3 lg:shadow-lg">
                    Notes
                    <textarea
                      className="min-h-28 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[#182235]"
                      maxLength={2000}
                      value={task.manualReviewNotes ?? ""}
                      onChange={(event) => updateItem(task.id, { manualReviewNotes: event.target.value })}
                      onBlur={(event) => void saveTask(task, { manualReviewNotes: event.target.value })}
                      placeholder="Conflict? Evidence checked? Follow-up needed?"
                    />
                    {task.summary ? <span className="text-xs normal-case leading-5 tracking-normal text-[#68758d]">{task.summary}</span> : null}
                  </label>
                </details>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

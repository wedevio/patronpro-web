"use client";

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
  if (task.manualReviewedAt) return `Reviewed ${task.manualReviewedAt}`;
  return task.status ?? "Open";
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
    <div className="grid gap-4">
      {items.map((task) => (
        <article key={task.id} className="rounded-2xl border border-[#f0dfbd] bg-[#fffaf2] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5b17]">{task.priority ?? "review"}</p>
              <h3 className="mt-2 text-base font-semibold text-[#182235]">{task.label}</h3>
              {showCandidate && task.candidateHref ? (
                <Link href={task.candidateHref} className="mt-1 inline-block text-sm font-semibold text-[#1d5fa7] underline-offset-4 hover:underline">
                  {task.candidateName ?? task.candidateId}
                </Link>
              ) : null}
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.error ? "bg-[#fff0f0] text-[#9f1d1d]" : "bg-white text-[#526078]"}`}>
              {taskStatus(task)}
            </span>
          </div>

          {task.summary ? <p className="mt-3 text-sm leading-6 text-[#42506a]">{task.summary}</p> : null}
          {task.blockerReason ? <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#7c4a05]">{task.blockerReason}</p> : null}

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,240px)_1fr] md:items-end">
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#182235]">
              <input
                type="checkbox"
                className="h-4 w-4"
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
              Reviewed
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">
              Verdict
              <select
                className="min-h-11 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#182235]"
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
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]">
              Notes
              <textarea
                className="min-h-24 rounded-xl border border-[#dfe5ee] bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[#182235]"
                maxLength={2000}
                value={task.manualReviewNotes ?? ""}
                onChange={(event) => updateItem(task.id, { manualReviewNotes: event.target.value })}
                onBlur={(event) => void saveTask(task, { manualReviewNotes: event.target.value })}
                placeholder="What did you check? What is the sponsorship/conflict verdict?"
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}

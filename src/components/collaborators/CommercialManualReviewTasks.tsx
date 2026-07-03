"use client";

import { CheckCircle2, Circle, ExternalLink, StickyNote } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatManualMediaReviewNotes, parseManualMediaReviewNotes, type ManualMediaReviewInput } from "@/lib/collaborators/manual-media-review";
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

function reviewNotes(task: TaskState, patch: Partial<ManualMediaReviewInput>) {
  return formatManualMediaReviewNotes({
    ...parseManualMediaReviewNotes(task.manualReviewNotes, task.reviewUrl ?? ""),
    ...patch,
  });
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

  async function uploadScreenshot(task: TaskState, file: File) {
    updateItem(task.id, { saving: true });
    try {
      const metaResponse = await fetch("/api/collaborators/manual-review-media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const meta = (await metaResponse.json()) as { signedUrl?: string; publicUrl?: string; error?: string };
      if (!metaResponse.ok || !meta.signedUrl || !meta.publicUrl) throw new Error(meta.error ?? "Could not prepare screenshot upload");
      const uploadResponse = await fetch(meta.signedUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!uploadResponse.ok) throw new Error("Could not upload screenshot");
      const review = parseManualMediaReviewNotes(task.manualReviewNotes, task.reviewUrl ?? "");
      const notes = formatManualMediaReviewNotes({
        ...review,
        screenshotUrls: [...new Set([...review.screenshotUrls, meta.publicUrl])],
      });
      await saveTask({ ...task, saving: false }, { manualReviewNotes: notes });
    } catch (error) {
      updateItem(task.id, { saving: false, error: error instanceof Error ? error.message : "Could not upload screenshot" });
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
                {(() => {
                  const review = parseManualMediaReviewNotes(task.manualReviewNotes, task.reviewUrl ?? "");
                  const screenshotText = review.screenshotUrls.join("\n");
                  return (
                    <>
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
                  <div className="mt-2 grid gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d] lg:absolute lg:right-0 lg:top-10 lg:z-10 lg:w-[min(520px,calc(100vw-2rem))] lg:rounded-xl lg:border lg:border-[#dfe5ee] lg:bg-white lg:p-3 lg:shadow-lg">
                    <label className="grid gap-1">
                      URL
                      <input
                        className="min-h-9 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#182235]"
                        value={review.mediaUrl}
                        onChange={(event) => updateItem(task.id, { manualReviewNotes: reviewNotes(task, { mediaUrl: event.target.value }) })}
                        onBlur={(event) => void saveTask(task, { manualReviewNotes: reviewNotes(task, { mediaUrl: event.target.value }) })}
                        placeholder="https://..."
                      />
                    </label>
                    <div className="grid gap-2 normal-case tracking-normal text-[#182235] sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-md border border-[#dfe5ee] px-3 py-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={review.commercialAlliance}
                          onChange={(event) => void saveTask(task, { manualReviewNotes: reviewNotes(task, { commercialAlliance: event.target.checked }) })}
                        />
                        Commercial alliance
                      </label>
                      <label className="flex items-center gap-2 rounded-md border border-[#dfe5ee] px-3 py-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={review.crmMention}
                          onChange={(event) => void saveTask(task, { manualReviewNotes: reviewNotes(task, { crmMention: event.target.checked }) })}
                        />
                        CRM/software mention
                      </label>
                    </div>
                    <label className="grid gap-1">
                      Screenshot URLs
                      <textarea
                        className="min-h-20 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[#182235]"
                        value={screenshotText}
                        onChange={(event) =>
                          updateItem(task.id, {
                            manualReviewNotes: reviewNotes(task, {
                              screenshotUrls: event.target.value
                                .split(/\s+/)
                                .map((url) => url.trim())
                                .filter(Boolean),
                            }),
                          })
                        }
                        onBlur={(event) =>
                          void saveTask(task, {
                            manualReviewNotes: reviewNotes(task, {
                              screenshotUrls: event.target.value
                                .split(/\s+/)
                                .map((url) => url.trim())
                                .filter(Boolean),
                            }),
                          })
                        }
                        placeholder="https://..."
                      />
                    </label>
                    <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-[#dfe5ee] bg-[#f8fafc] px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#526078]">
                      Upload screenshot
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadScreenshot(task, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <label className="grid gap-1">
                      Analysis
                      <textarea
                        className="min-h-28 rounded-md border border-[#dfe5ee] bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[#182235]"
                        maxLength={3000}
                        value={review.analysis}
                        onChange={(event) => updateItem(task.id, { manualReviewNotes: reviewNotes(task, { analysis: event.target.value }) })}
                        onBlur={(event) => void saveTask(task, { manualReviewNotes: reviewNotes(task, { analysis: event.target.value }) })}
                        placeholder="Commercial signal, CRM overlap, context, and verdict basis."
                      />
                    </label>
                    {task.summary ? <span className="text-xs normal-case leading-5 tracking-normal text-[#68758d]">{task.summary}</span> : null}
                  </div>
                      </details>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

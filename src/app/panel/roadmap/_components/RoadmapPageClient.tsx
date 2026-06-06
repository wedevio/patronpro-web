"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckSquare,
  KanbanSquare,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import type {
  AddRoadmapCommentInput,
  CreateRoadmapItemInput,
  RoadmapItem,
  RoadmapItemComment,
  RoadmapPriority,
  RoadmapRequestType,
  RoadmapStatus,
  RoadmapTrack,
  RoadmapVisibility,
  UpdateRoadmapItemInput,
} from "@/lib/roadmap/types";

interface StaffUser {
  id: string;
  email: string;
  name: string;
}

interface Props {
  initialTracks: RoadmapTrack[];
  initialItems: RoadmapItem[];
  currentUserEmail: string;
  isAdmin: boolean;
}

type ViewMode = "list" | "kanban";

interface DragState {
  itemId: string;
  fromTrackId: string;
  fromStatus: RoadmapStatus;
}

const STATUS_META: Array<{ value: RoadmapStatus; label: string; badge: string }> = [
  { value: "requested", label: "Requested", badge: "bg-slate-100 text-slate-700" },
  { value: "analyzed", label: "Analyzed", badge: "bg-amber-100 text-amber-800" },
  { value: "queued", label: "In Queue", badge: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Production", badge: "bg-purple-100 text-purple-800" },
  { value: "completed", label: "Completed", badge: "bg-green-100 text-green-800" },
  { value: "blocked", label: "Blocked", badge: "bg-red-100 text-red-800" },
  { value: "not_planned", label: "Not Planned", badge: "bg-zinc-100 text-zinc-700" },
];

const PRIORITY_META: Array<{ value: RoadmapPriority; label: string; badge: string }> = [
  { value: "low", label: "Low", badge: "bg-slate-100 text-slate-600" },
  { value: "medium", label: "Medium", badge: "bg-blue-100 text-blue-700" },
  { value: "high", label: "High", badge: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", badge: "bg-red-100 text-red-800" },
];

const REQUEST_TYPE_OPTIONS: Array<{ value: RoadmapRequestType; label: string }> = [
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bugfix", label: "Bugfix" },
  { value: "internal", label: "Internal" },
];

const VISIBILITY_OPTIONS: Array<{ value: RoadmapVisibility; label: string }> = [
  { value: "internal", label: "Internal" },
  { value: "public", label: "Public-ready" },
];

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function badgeForStatus(status: RoadmapStatus) {
  return STATUS_META.find((option) => option.value === status) ?? STATUS_META[0];
}

function badgeForPriority(priority: RoadmapPriority) {
  return PRIORITY_META.find((option) => option.value === priority) ?? PRIORITY_META[1];
}

function emptyForm(trackId?: string): CreateRoadmapItemInput {
  return {
    title: "",
    description: "",
    track_id: trackId ?? "",
    status: "requested",
    owner_user_id: null,
    priority: "medium",
    request_type: "feature",
    target_quarter: "",
    score: null,
    public_visibility: "internal",
    public_title: "",
    public_summary: "",
  };
}

function buildDraftFromItem(item: RoadmapItem): UpdateRoadmapItemInput {
  return {
    title: item.title,
    description: item.description,
    owner_user_id: item.owner_user_id,
    priority: item.priority,
    request_type: item.request_type,
    target_quarter: item.target_quarter,
    score: item.score,
    public_visibility: item.public_visibility,
    public_title: item.public_title,
    public_summary: item.public_summary,
  };
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-3">
      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <p className="text-[22px] font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ItemFormModal({
  tracks,
  users,
  initialValue,
  onClose,
  onSubmit,
  saving,
}: {
  tracks: RoadmapTrack[];
  users: StaffUser[];
  initialValue: CreateRoadmapItemInput;
  onClose: () => void;
  onSubmit: (value: CreateRoadmapItemInput) => Promise<void>;
  saving: boolean;
}) {
  const [value, setValue] = useState<CreateRoadmapItemInput>(initialValue);

  function setField<K extends keyof CreateRoadmapItemInput>(field: K, next: CreateRoadmapItemInput[K]) {
    setValue((prev) => ({ ...prev, [field]: next }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create roadmap item</h2>
            <p className="text-sm text-slate-500">Capture the idea once and manage it from list or board view.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Title
            <input
              value={value.title}
              onChange={(e) => setField("title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="e.g. Public feature request board"
            />
          </label>

          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              value={value.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="Capture the problem, intent, or context for this roadmap item."
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Roadmap line
            <select
              value={value.track_id}
              onChange={(e) => setField("track_id", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              <option value="">Select a line</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={value.status}
              onChange={(e) => setField("status", e.target.value as RoadmapStatus)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              {STATUS_META.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Priority
            <select
              value={value.priority}
              onChange={(e) => setField("priority", e.target.value as RoadmapPriority)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              {PRIORITY_META.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Request type
            <select
              value={value.request_type}
              onChange={(e) => setField("request_type", e.target.value as RoadmapRequestType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              {REQUEST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Owner
            <select
              value={value.owner_user_id ?? ""}
              onChange={(e) => setField("owner_user_id", e.target.value || null)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Target quarter
            <input
              value={value.target_quarter ?? ""}
              onChange={(e) => setField("target_quarter", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="e.g. 2026-Q3"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Score
            <input
              type="number"
              min={0}
              max={100}
              value={value.score ?? ""}
              onChange={(e) => setField("score", e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="Optional"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Visibility
            <select
              value={value.public_visibility}
              onChange={(e) => setField("public_visibility", e.target.value as RoadmapVisibility)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Public title
            <input
              value={value.public_title ?? ""}
              onChange={(e) => setField("public_title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="Optional future public label"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Public summary
            <textarea
              value={value.public_summary ?? ""}
              onChange={(e) => setField("public_summary", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              placeholder="Optional future public-facing summary"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => void onSubmit(value)}
            disabled={saving || !value.title.trim() || !value.track_id}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E2C46] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create item
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailPanel({
  item,
  tracks,
  users,
  onClose,
  onSave,
  onDelete,
  onArchiveToggle,
  onComment,
  deleting,
  saving,
}: {
  item: RoadmapItem;
  tracks: RoadmapTrack[];
  users: StaffUser[];
  onClose: () => void;
  onSave: (patch: UpdateRoadmapItemInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onArchiveToggle: (archived: boolean) => Promise<void>;
  onComment: (comment: AddRoadmapCommentInput) => Promise<void>;
  deleting: boolean;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<UpdateRoadmapItemInput>(() => buildDraftFromItem(item));
  const [commentBody, setCommentBody] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  async function submitComment() {
    if (!commentBody.trim()) return;
    setCommentSaving(true);
    try {
      await onComment({ body: commentBody.trim(), visibility: "internal" });
      setCommentBody("");
    } finally {
      setCommentSaving(false);
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Roadmap item</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h2>
          <p className="mt-1 text-sm text-slate-500">Created {formatDate(item.created_at)} · Updated {formatDate(item.updated_at)}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              value={draft.title ?? item.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              value={draft.description ?? item.description ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Roadmap line
              <select
                value={item.track_id}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>{track.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={item.status}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                {STATUS_META.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Priority
              <select
                value={draft.priority ?? item.priority}
                onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value as RoadmapPriority }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                {PRIORITY_META.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Owner
              <select
                value={draft.owner_user_id ?? item.owner_user_id ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, owner_user_id: e.target.value || null }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Request type
              <select
                value={draft.request_type ?? item.request_type}
                onChange={(e) => setDraft((prev) => ({ ...prev, request_type: e.target.value as RoadmapRequestType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                {REQUEST_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Target quarter
              <input
                value={draft.target_quarter ?? item.target_quarter ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, target_quarter: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Score
              <input
                type="number"
                min={0}
                max={100}
                value={draft.score ?? item.score ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, score: e.target.value ? Number(e.target.value) : null }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Public visibility
              <select
                value={draft.public_visibility ?? item.public_visibility}
                onChange={(e) => setDraft((prev) => ({ ...prev, public_visibility: e.target.value as RoadmapVisibility }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Public title
              <input
                value={draft.public_title ?? item.public_title ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, public_title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Public summary
              <textarea
                value={draft.public_summary ?? item.public_summary ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, public_summary: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Comments</h3>
            <span className="text-xs text-slate-500">{item.comments?.length ?? 0} total</span>
          </div>
          <div className="mt-4 space-y-3">
            {(item.comments ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet. Capture context and decisions here.</p>
            ) : (
              item.comments?.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{comment.author_label}</p>
                    <p className="text-xs text-slate-400">{formatDate(comment.created_at)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{comment.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              placeholder="Add internal context, follow-up notes, or implementation details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => void submitComment()}
                disabled={commentSaving || !commentBody.trim()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                {commentSaving ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
                Add comment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => void onArchiveToggle(!item.archived_at)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Archive size={15} />
            {item.archived_at ? "Restore" : "Archive"}
          </button>
          <button
            onClick={() => void onDelete()}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Delete
          </button>
        </div>

        <button
          onClick={() => void onSave(draft)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E2C46] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
          Save changes
        </button>
      </div>
    </div>
  );
}

export default function RoadmapPageClient({ initialTracks, initialItems, currentUserEmail, isAdmin }: Props) {
  const [tracks] = useState(initialTracks);
  const [items, setItems] = useState(initialItems);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ trackId: string; status: RoadmapStatus; itemId?: string | null } | null>(null);

  async function refreshItem(id: string): Promise<RoadmapItem> {
    const res = await fetch(`/api/panel/roadmap/${id}`);
    const json = (await res.json()) as { item?: RoadmapItem; error?: string };
    if (!res.ok || !json.item) throw new Error(json.error ?? "Failed to load roadmap item");
    replaceItem(json.item);
    return json.item;
  }

  useEffect(() => {
    fetch("/api/panel/users")
      .then((response) => response.json() as Promise<{ users: StaffUser[] }>)
      .then((data) => setUsers(data.users ?? []))
      .catch(() => null);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (trackFilter && item.track_id !== trackFilter) return false;
      if (ownerFilter && (item.owner_user_id ?? "") !== ownerFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        const haystack = [
          item.title,
          item.description ?? "",
          item.public_title ?? "",
          item.public_summary ?? "",
          item.track?.name ?? "",
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, ownerFilter, search, statusFilter, trackFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      completed: items.filter((item) => item.status === "completed").length,
      blocked: items.filter((item) => item.status === "blocked").length,
    };
  }, [items]);

  function replaceItem(nextItem: RoadmapItem) {
    setItems((prev) => prev.map((item) => (item.id === nextItem.id ? nextItem : item)));
    setSelectedItem((prev) => (prev?.id === nextItem.id ? { ...prev, ...nextItem } : prev));
  }

  async function createItem(value: CreateRoadmapItemInput) {
    if (!isAdmin) {
      alert("Only admins can create roadmap items.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/panel/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const json = (await res.json()) as { item?: RoadmapItem; error?: string };
      if (!res.ok || !json.item) throw new Error(json.error ?? "Failed to create roadmap item");
      setItems((prev) => [...prev, json.item!]);
      setCreateOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create roadmap item");
    } finally {
      setSaving(false);
    }
  }

  async function saveSelectedItem(patch: UpdateRoadmapItemInput) {
    if (!selectedItem) return;
    if (!isAdmin) {
      alert("Only admins can edit roadmap items.");
      return;
    }

    const sanitizedPatch: UpdateRoadmapItemInput = {
      title: patch.title,
      description: patch.description,
      owner_user_id: patch.owner_user_id,
      priority: patch.priority,
      request_type: patch.request_type,
      target_quarter: patch.target_quarter,
      score: patch.score,
      public_visibility: patch.public_visibility,
      public_title: patch.public_title,
      public_summary: patch.public_summary,
      archived: patch.archived,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/panel/roadmap/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPatch),
      });
      const json = (await res.json()) as { item?: RoadmapItem; error?: string };
      if (!res.ok || !json.item) throw new Error(json.error ?? "Failed to update roadmap item");
    await refreshItem(json.item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update roadmap item");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedItem() {
    if (!selectedItem) return;
    if (!isAdmin) {
      alert("Only admins can delete roadmap items.");
      return;
    }
    if (!confirm(`Delete roadmap item "${selectedItem.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/panel/roadmap/${selectedItem.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to delete roadmap item");
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete roadmap item");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleArchiveSelected(archived: boolean) {
    if (!isAdmin) {
      alert("Only admins can archive roadmap items.");
      return;
    }
    await saveSelectedItem({ archived });
    if (archived && selectedItem) {
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
    }
  }

  async function addComment(comment: AddRoadmapCommentInput) {
    if (!selectedItem) return;
    if (!isAdmin) {
      alert("Only admins can comment on roadmap items.");
      return;
    }
    const res = await fetch(`/api/panel/roadmap/${selectedItem.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comment),
    });
    const json = (await res.json()) as { comment?: RoadmapItemComment; error?: string };
    if (!res.ok || !json.comment) throw new Error(json.error ?? "Failed to add comment");

    const nextItem: RoadmapItem = {
      ...selectedItem,
      comments: [...(selectedItem.comments ?? []), json.comment],
    };
    replaceItem(nextItem);
    await refreshItem(selectedItem.id);
  }

  async function moveItem(item: RoadmapItem, status: RoadmapStatus, trackId: string) {
    if (!isAdmin) {
      alert("Only admins can move roadmap items.");
      return;
    }
    const targetItems = items
      .filter((candidate) => candidate.track_id === trackId && candidate.status === status)
      .sort((a, b) => a.position - b.position);

    const res = await fetch("/api/panel/roadmap/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: item.id,
        track_id: trackId,
        status,
        target_index: targetItems.length,
      }),
    });
    const json = (await res.json()) as { items?: RoadmapItem[]; error?: string };
    if (!res.ok || !json.items) {
      alert(json.error ?? "Failed to move roadmap item");
      return;
    }
    setItems(json.items);
    const updated = json.items.find((candidate) => candidate.id === item.id) ?? null;
    setSelectedItem(updated);
  }

  async function commitDrop(
    draggedItemId: string,
    targetTrackId: string,
    targetStatus: RoadmapStatus,
    targetItemId?: string | null
  ) {
    if (!isAdmin) {
      alert("Only admins can reorder roadmap items.");
      return;
    }
    const currentItems = items
      .filter((item) => item.track_id === targetTrackId && item.status === targetStatus && item.id !== draggedItemId)
      .sort((a, b) => a.position - b.position);

    const targetIndex = targetItemId
      ? currentItems.findIndex((item) => item.id === targetItemId)
      : currentItems.length;

    const res = await fetch("/api/panel/roadmap/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: draggedItemId,
        track_id: targetTrackId,
        status: targetStatus,
        target_index: targetIndex < 0 ? currentItems.length : targetIndex,
      }),
    });

    const json = (await res.json()) as { items?: RoadmapItem[]; error?: string };
    if (!res.ok || !json.items) {
      alert(json.error ?? "Failed to reorder roadmap item");
      return;
    }

    setItems(json.items);
    const updated = json.items.find((candidate) => candidate.id === draggedItemId) ?? null;
    setSelectedItem((prev) => (prev?.id === draggedItemId ? updated : prev));
  }

  const trackMap = new Map(tracks.map((track) => [track.id, track]));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1500px] mx-auto px-6 pt-6 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#F67A0A]">Product workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Roadmap</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Manage business, product, and operations initiatives from one internal workspace. The same dataset powers both the list and the kanban board.
            </p>
            <p className="mt-1 text-xs text-slate-400">Signed in as {currentUserEmail}</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!isAdmin}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E2C46] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} />
            New item
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total items" value={stats.total} color="#1E2C46" />
          <StatCard label="In production" value={stats.inProgress} color="#7c3aed" />
          <StatCard label="Completed" value={stats.completed} color="#16a34a" />
          <StatCard label="Blocked" value={stats.blocked} color="#dc2626" />
        </div>
      </div>

      <div className="mt-4 border-y border-slate-200 bg-white">
        <div className="max-w-[1500px] mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roadmap items..."
              className="rounded border border-slate-300 py-1.5 pl-8 pr-3 text-sm focus:border-[#1E2C46] focus:outline-none"
            />
          </div>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-[#1E2C46] focus:outline-none"
          >
            <option value="">All roadmap lines</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-[#1E2C46] focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_META.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-[#1E2C46] focus:outline-none"
          >
            <option value="">All owners</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <div className="ml-auto inline-flex rounded-lg border border-slate-300 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "list" ? "bg-[#1E2C46] text-white" : "text-slate-600"}`}
            >
              <CheckSquare size={15} />
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "kanban" ? "bg-[#1E2C46] text-white" : "text-slate-600"}`}
            >
              <KanbanSquare size={15} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-5">
        {viewMode === "list" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Roadmap line</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Comments</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No roadmap items match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const owner = users.find((user) => user.id === item.owner_user_id);
                    const status = badgeForStatus(item.status);
                    const priority = badgeForPriority(item.priority);
                    return (
                      <tr key={item.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => setSelectedItem(item)}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || "No description yet."}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.track?.name ?? trackMap.get(item.track_id)?.name ?? "—"}</td>
                        <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${status.badge}`}>{status.label}</span></td>
                        <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${priority.badge}`}>{priority.label}</span></td>
                        <td className="px-4 py-3 text-slate-600">{owner?.name ?? "Unassigned"}</td>
                        <td className="px-4 py-3 text-slate-500">{item.comments?.length ?? 0}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.updated_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            {tracks
              .filter((track) => !trackFilter || track.id === trackFilter)
              .map((track) => (
                <section key={track.id} className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{track.name}</h2>
                    <p className="text-sm text-slate-500">{track.description ?? "Internal roadmap line"}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    {STATUS_META.map((status) => {
                      const columnItems = filteredItems
                        .filter((item) => item.track_id === track.id && item.status === status.value)
                        .sort((a, b) => a.position - b.position);

                      return (
                        <div key={status.value} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{status.label}</p>
                              <p className="text-xs text-slate-400">{columnItems.length} items</p>
                            </div>
                          </div>

                          <div className="space-y-3 p-3">
                            {columnItems.map((item) => {
                              const priority = badgeForPriority(item.priority);
                              const owner = users.find((user) => user.id === item.owner_user_id);
                              return (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={() => setDragState({ itemId: item.id, fromTrackId: track.id, fromStatus: status.value })}
                                  onDragEnd={() => {
                                    setDragState(null);
                                    setDropTarget(null);
                                  }}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    if (!dragState || dragState.itemId === item.id) return;
                                    setDropTarget({ trackId: track.id, status: status.value, itemId: item.id });
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    if (!dragState) return;
                                    void commitDrop(dragState.itemId, track.id, status.value, item.id);
                                    setDragState(null);
                                    setDropTarget(null);
                                  }}
                                  className={`rounded-xl border bg-slate-50 p-3 ${dragState?.itemId === item.id ? "opacity-50" : ""} ${dropTarget?.itemId === item.id && dropTarget.trackId === track.id && dropTarget.status === status.value ? "border-[#F67A0A] ring-2 ring-[#F67A0A]/30" : "border-slate-200"}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <button
                                      onClick={() => setSelectedItem(item)}
                                      className="text-left"
                                    >
                                      <p className="font-medium text-slate-900">{item.title}</p>
                                      <p className="mt-1 line-clamp-3 text-xs text-slate-500">{item.description || "No description yet."}</p>
                                    </button>
                                    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${priority.badge}`}>{priority.label}</span>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1"><User size={12} /> {owner?.name ?? "Unassigned"}</span>
                                    <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {item.comments?.length ?? 0}</span>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {STATUS_META.filter((candidate) => candidate.value !== item.status).map((candidate) => (
                                      <button
                                        key={candidate.value}
                                        onClick={() => void moveItem(item, candidate.value, track.id)}
                                        className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-400 hover:bg-white"
                                      >
                                        Move to {candidate.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {columnItems.length === 0 && (
                              <div
                                onDragOver={(event) => {
                                  event.preventDefault();
                                  if (!dragState) return;
                                  setDropTarget({ trackId: track.id, status: status.value, itemId: null });
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  if (!dragState) return;
                                  void commitDrop(dragState.itemId, track.id, status.value, null);
                                  setDragState(null);
                                  setDropTarget(null);
                                }}
                                className={`rounded-xl border border-dashed bg-slate-50 px-3 py-6 text-center text-xs text-slate-400 ${dropTarget?.trackId === track.id && dropTarget.status === status.value && !dropTarget.itemId ? "border-[#F67A0A] ring-2 ring-[#F67A0A]/30" : "border-slate-200"}`}
                              >
                                No items in this column.
                              </div>
                            )}

                            {columnItems.length > 0 && (
                              <div
                                onDragOver={(event) => {
                                  event.preventDefault();
                                  if (!dragState) return;
                                  setDropTarget({ trackId: track.id, status: status.value, itemId: null });
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  if (!dragState) return;
                                  void commitDrop(dragState.itemId, track.id, status.value, null);
                                  setDragState(null);
                                  setDropTarget(null);
                                }}
                                className={`rounded-xl border border-dashed px-3 py-2 text-center text-[11px] font-medium ${dropTarget?.trackId === track.id && dropTarget.status === status.value && !dropTarget.itemId ? "border-[#F67A0A] bg-orange-50 text-[#F67A0A]" : "border-slate-200 bg-slate-50 text-slate-400"}`}
                              >
                                Drop here to move to the end
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>

      {createOpen && (
        <ItemFormModal
          tracks={tracks}
          users={users}
          initialValue={emptyForm(tracks[0]?.id)}
          onClose={() => setCreateOpen(false)}
          onSubmit={createItem}
          saving={saving}
        />
      )}

      {selectedItem && (
        <ItemDetailPanel
          key={selectedItem.id}
          item={selectedItem}
          tracks={tracks}
          users={users}
          onClose={() => setSelectedItem(null)}
          onSave={saveSelectedItem}
          onDelete={deleteSelectedItem}
          onArchiveToggle={toggleArchiveSelected}
          onComment={addComment}
          deleting={deleting}
          saving={saving}
        />
      )}
    </div>
  );
}

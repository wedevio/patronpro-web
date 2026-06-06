import { getAdminClient } from "@/lib/supabase/client";
import type {
  AddRoadmapCommentInput,
  CreateRoadmapItemInput,
  ReorderRoadmapItemInput,
  RoadmapItem,
  RoadmapItemComment,
  RoadmapTrack,
  RoadmapWorkspace,
  UpdateRoadmapItemInput,
} from "./types";

interface RawRoadmapItemRow extends Omit<RoadmapItem, "track" | "comments" | "history"> {
  track?: RoadmapTrack | RoadmapTrack[] | null;
}

function normalizeTrack(track: RawRoadmapItemRow["track"]): RoadmapTrack | null {
  if (!track) return null;
  return Array.isArray(track) ? (track[0] ?? null) : track;
}

function normalizeItem(row: RawRoadmapItemRow): RoadmapItem {
  return {
    ...row,
    track: normalizeTrack(row.track),
  };
}

export async function listRoadmapWorkspace(): Promise<RoadmapWorkspace> {
  const db = getAdminClient();

  const [{ data: tracks, error: tracksError }, { data: items, error: itemsError }] = await Promise.all([
    db
      .from("roadmap_tracks")
      .select("*")
      .eq("is_active", true)
      .order("position", { ascending: true }),
    db
      .from("roadmap_items")
      .select("*, track:roadmap_tracks(*), comments:roadmap_item_comments(*)")
      .is("archived_at", null)
      .order("position", { ascending: true })
      .order("updated_at", { ascending: false }),
  ]);

  if (tracksError) throw new Error(`listRoadmapWorkspace tracks: ${tracksError.message}`);
  if (itemsError) throw new Error(`listRoadmapWorkspace items: ${itemsError.message}`);

  return {
    tracks: (tracks ?? []) as RoadmapTrack[],
    items: ((items ?? []) as Array<RawRoadmapItemRow & { comments?: RoadmapItemComment[] }>).map((item) => ({
      ...normalizeItem(item),
      comments: item.comments ?? [],
    })),
  };
}

export async function getRoadmapItem(id: string): Promise<RoadmapItem | null> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("roadmap_items")
    .select("*, track:roadmap_tracks(*), comments:roadmap_item_comments(*), history:roadmap_item_status_history(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getRoadmapItem: ${error.message}`);
  if (!data) return null;

  const normalized = normalizeItem(data as RawRoadmapItemRow & {
    comments?: RoadmapItemComment[];
  });

  return {
    ...normalized,
    comments: ((data as { comments?: RoadmapItemComment[] }).comments ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    history: ((data as { history?: Array<{ changed_at: string }> }).history ?? []).sort(
      (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    ) as RoadmapItem["history"],
  };
}

export async function createRoadmapItem(
  input: CreateRoadmapItemInput,
  actor: string
): Promise<RoadmapItem> {
  const db = getAdminClient();

  const { data: createdId, error } = await db.rpc("roadmap_create_item", {
    p_title: input.title,
    p_description: input.description ?? null,
    p_track_id: input.track_id,
    p_status: input.status,
    p_owner_user_id: input.owner_user_id ?? null,
    p_priority: input.priority,
    p_request_type: input.request_type,
    p_target_quarter: input.target_quarter ?? null,
    p_score: input.score ?? null,
    p_public_visibility: input.public_visibility,
    p_public_title: input.public_title ?? null,
    p_public_summary: input.public_summary ?? null,
    p_actor: actor,
  });

  if (error) throw new Error(`createRoadmapItem: ${error.message}`);
  if (!createdId || typeof createdId !== "string") throw new Error("createRoadmapItem: missing created id");

  const item = await getRoadmapItem(createdId);
  if (!item) throw new Error("createRoadmapItem: created item could not be reloaded");
  return item;
}

export async function updateRoadmapItem(
  id: string,
  input: UpdateRoadmapItemInput,
  actor: string
): Promise<RoadmapItem> {
  const db = getAdminClient();
  const current = await getRoadmapItem(id);
  if (!current) throw new Error("updateRoadmapItem: item not found");

  const patch: Record<string, unknown> = {
    updated_by: actor,
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.owner_user_id !== undefined) patch.owner_user_id = input.owner_user_id;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.request_type !== undefined) patch.request_type = input.request_type;
  if (input.target_quarter !== undefined) patch.target_quarter = input.target_quarter ?? null;
  if (input.score !== undefined) patch.score = input.score ?? null;
  if (input.public_visibility !== undefined) patch.public_visibility = input.public_visibility;
  if (input.public_title !== undefined) patch.public_title = input.public_title ?? null;
  if (input.public_summary !== undefined) patch.public_summary = input.public_summary ?? null;
  if (input.archived !== undefined) patch.archived_at = input.archived ? new Date().toISOString() : null;

  const { data, error } = await db
    .from("roadmap_items")
    .update(patch)
    .eq("id", id)
    .select("*, track:roadmap_tracks(*)")
    .single();

  if (error) throw new Error(`updateRoadmapItem: ${error.message}`);

  return normalizeItem(data as RawRoadmapItemRow);
}

export async function addRoadmapComment(
  roadmapItemId: string,
  input: AddRoadmapCommentInput,
  actor: { label: string; userId?: string | null }
): Promise<RoadmapItemComment> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("roadmap_item_comments")
    .insert({
      roadmap_item_id: roadmapItemId,
      author_user_id: actor.userId ?? null,
      author_label: actor.label,
      body: input.body,
      visibility: input.visibility,
    })
    .select()
    .single();

  if (error) throw new Error(`addRoadmapComment: ${error.message}`);
  return data as RoadmapItemComment;
}

export async function reorderRoadmapItem(
  input: ReorderRoadmapItemInput,
  actor: string
): Promise<RoadmapItem[]> {
  const db = getAdminClient();
  const { error } = await db.rpc("roadmap_reorder_item", {
    p_item_id: input.item_id,
    p_track_id: input.track_id,
    p_status: input.status,
    p_target_index: input.target_index,
    p_actor: actor,
  });

  if (error) throw new Error(`reorderRoadmapItem: ${error.message}`);

  const { data: refreshed, error: refreshedError } = await db
    .from("roadmap_items")
    .select("*, track:roadmap_tracks(*), comments:roadmap_item_comments(*)")
    .is("archived_at", null)
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (refreshedError) throw new Error(`reorderRoadmapItem refresh: ${refreshedError.message}`);
  return ((refreshed ?? []) as Array<RawRoadmapItemRow & { comments?: RoadmapItemComment[] }>).map((item) => ({
    ...normalizeItem(item),
    comments: item.comments ?? [],
  }));
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("roadmap_items").delete().eq("id", id);
  if (error) throw new Error(`deleteRoadmapItem: ${error.message}`);
}

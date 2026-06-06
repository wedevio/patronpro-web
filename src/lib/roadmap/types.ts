import { z } from "zod";

export const RoadmapStatusEnum = z.enum([
  "requested",
  "analyzed",
  "queued",
  "in_progress",
  "completed",
  "blocked",
  "not_planned",
]);
export type RoadmapStatus = z.infer<typeof RoadmapStatusEnum>;

export const RoadmapPriorityEnum = z.enum(["low", "medium", "high", "critical"]);
export type RoadmapPriority = z.infer<typeof RoadmapPriorityEnum>;

export const RoadmapRequestTypeEnum = z.enum(["feature", "improvement", "bugfix", "internal"]);
export type RoadmapRequestType = z.infer<typeof RoadmapRequestTypeEnum>;

export const RoadmapVisibilityEnum = z.enum(["internal", "public"]);
export type RoadmapVisibility = z.infer<typeof RoadmapVisibilityEnum>;

export interface RoadmapTrack {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  is_active: boolean;
  public_visibility: RoadmapVisibility;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItemComment {
  id: string;
  roadmap_item_id: string;
  author_user_id: string | null;
  author_label: string;
  body: string;
  visibility: RoadmapVisibility;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItemStatusHistory {
  id: string;
  roadmap_item_id: string;
  from_status: RoadmapStatus | null;
  to_status: RoadmapStatus;
  changed_by: string;
  changed_at: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  track_id: string;
  status: RoadmapStatus;
  owner_user_id: string | null;
  priority: RoadmapPriority;
  request_type: RoadmapRequestType;
  target_quarter: string | null;
  score: number | null;
  public_visibility: RoadmapVisibility;
  public_title: string | null;
  public_summary: string | null;
  public_published_at: string | null;
  position: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
  track?: RoadmapTrack | null;
  comments?: RoadmapItemComment[];
  history?: RoadmapItemStatusHistory[];
}

export interface RoadmapWorkspace {
  tracks: RoadmapTrack[];
  items: RoadmapItem[];
}

export const CreateRoadmapItemSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  track_id: z.string().uuid(),
  status: RoadmapStatusEnum.default("requested"),
  owner_user_id: z.string().uuid().nullable().optional(),
  priority: RoadmapPriorityEnum.default("medium"),
  request_type: RoadmapRequestTypeEnum.default("feature"),
  target_quarter: z.string().trim().max(50).optional().nullable(),
  score: z.number().int().min(0).max(100).optional().nullable(),
  public_visibility: RoadmapVisibilityEnum.default("internal"),
  public_title: z.string().trim().max(160).optional().nullable(),
  public_summary: z.string().trim().max(1000).optional().nullable(),
});
export type CreateRoadmapItemInput = z.infer<typeof CreateRoadmapItemSchema>;

export const UpdateRoadmapItemSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  track_id: z.string().uuid().optional(),
  status: RoadmapStatusEnum.optional(),
  owner_user_id: z.string().uuid().nullable().optional(),
  priority: RoadmapPriorityEnum.optional(),
  request_type: RoadmapRequestTypeEnum.optional(),
  target_quarter: z.string().trim().max(50).nullable().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  public_visibility: RoadmapVisibilityEnum.optional(),
  public_title: z.string().trim().max(160).nullable().optional(),
  public_summary: z.string().trim().max(1000).nullable().optional(),
  archived: z.boolean().optional(),
});
export type UpdateRoadmapItemInput = z.infer<typeof UpdateRoadmapItemSchema>;

export const AddRoadmapCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  visibility: RoadmapVisibilityEnum.default("internal"),
});
export type AddRoadmapCommentInput = z.infer<typeof AddRoadmapCommentSchema>;

export const ReorderRoadmapItemSchema = z.object({
  item_id: z.string().uuid(),
  track_id: z.string().uuid(),
  status: RoadmapStatusEnum,
  target_index: z.number().int().min(0),
});
export type ReorderRoadmapItemInput = z.infer<typeof ReorderRoadmapItemSchema>;

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums — match DB exactly
// ---------------------------------------------------------------------------

export const TicketStatusEnum = z.enum([
  "new",
  "triage",
  "assigned",
  "waiting_client",
  "waiting_internal",
  "waiting_tech",
  "resolved",
  "closed",
]);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const TicketPriorityEnum = z.enum(["low", "normal", "high", "urgent"]);
export type TicketPriority = z.infer<typeof TicketPriorityEnum>;

export const TicketCategoryEnum = z.enum([
  "technical",
  "billing",
  "onboarding",
  "account",
  "feature_request",
  "bug",
  "general",
]);
export type TicketCategory = z.infer<typeof TicketCategoryEnum>;

export const TicketSourceEnum = z.enum(["internal_ghl", "email", "manual"]);
export type TicketSource = z.infer<typeof TicketSourceEnum>;

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export interface TicketNote {
  id: string;
  ticket_id: string;
  author: string;
  body: string;
  is_public: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: number;
  ghl_contact_id: string;
  ghl_location_id: string;
  account_id: string | null;
  submitted_by: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  attachments: string[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  // Included when fetched via getTicket
  notes?: TicketNote[];
}

// ---------------------------------------------------------------------------
// Zod schemas for API input validation
// ---------------------------------------------------------------------------

export const CreateTicketSchema = z.object({
  ghl_contact_id: z.string().min(1),
  ghl_location_id: z.string().min(1),
  submitted_by: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: TicketCategoryEnum.default("general"),
  priority: TicketPriorityEnum.default("normal"),
  source: TicketSourceEnum.default("internal_ghl"),
  attachments: z.array(z.string()).optional().default([]),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  category: TicketCategoryEnum.optional(),
  assignee: z.string().nullable().optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const AddNoteSchema = z.object({
  author: z.string().min(1),
  body: z.string().min(1).max(10000),
  is_public: z.boolean().default(false),
});
export type AddNoteInput = z.infer<typeof AddNoteSchema>;

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ListTicketsFilters {
  locationId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  ghlContactId?: string;
}

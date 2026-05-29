import { getAdminClient } from "@/lib/supabase/client";
import type {
  SupportTicket,
  TicketNote,
  CreateTicketInput,
  UpdateTicketInput,
  AddNoteInput,
  ListTicketsFilters,
  TicketCategory,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function lookupAccountId(ghlLocationId: string): Promise<string | null> {
  const db = getAdminClient();
  const { data } = await db
    .from("accounts")
    .select("id")
    .eq("location_id", ghlLocationId)
    .maybeSingle();
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a new support ticket.
 * Looks up account_id from the accounts table by ghl_location_id.
 */
export async function createTicket(
  data: CreateTicketInput
): Promise<SupportTicket> {
  const db = getAdminClient();
  const accountId = await lookupAccountId(data.ghl_location_id);

  const { data: ticket, error } = await db
    .from("support_tickets")
    .insert({
      ghl_contact_id: data.ghl_contact_id,
      ghl_location_id: data.ghl_location_id,
      account_id: accountId,
      creator_email: data.creator_email,
      submitted_by: data.submitted_by,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      source: data.source,
      attachments: data.attachments ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(`createTicket: ${error.message}`);
  return ticket as SupportTicket;
}

/**
 * Lists tickets for a location with optional filters.
 * Orders by created_at DESC, limit 50.
 */
export async function listTickets(
  filters: ListTicketsFilters
): Promise<SupportTicket[]> {
  const db = getAdminClient();

  let query = db
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.locationId) {
    query = query.eq("ghl_location_id", filters.locationId);
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.ghlContactId) query = query.eq("ghl_contact_id", filters.ghlContactId);

  const { data, error } = await query;
  if (error) throw new Error(`listTickets: ${error.message}`);
  return (data ?? []) as SupportTicket[];
}

/**
 * Gets a single ticket by ID, including notes ordered by created_at ASC.
 */
export async function getTicket(id: string): Promise<SupportTicket | null> {
  const db = getAdminClient();

  const { data: ticket, error } = await db
    .from("support_tickets")
    .select("*, support_ticket_notes(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getTicket: ${error.message}`);
  if (!ticket) return null;

  // Sort notes by created_at ASC
  const notes: TicketNote[] = (ticket.support_ticket_notes ?? []).sort(
    (a: TicketNote, b: TicketNote) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return { ...(ticket as SupportTicket), notes };
}

/**
 * Updates a ticket. Automatically sets resolved_at / closed_at timestamps
 * when status changes to 'resolved' or 'closed'.
 */
export async function updateTicket(
  id: string,
  data: UpdateTicketInput
): Promise<SupportTicket> {
  const db = getAdminClient();

  const patch: Record<string, unknown> = { ...data };

  if (data.status === "resolved" && !patch.resolved_at) {
    patch.resolved_at = new Date().toISOString();
  }
  if (data.status === "closed" && !patch.closed_at) {
    patch.closed_at = new Date().toISOString();
  }

  const { data: ticket, error } = await db
    .from("support_tickets")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateTicket: ${error.message}`);
  return ticket as SupportTicket;
}

/**
 * Adds a note to a ticket.
 */
export async function addNote(
  ticketId: string,
  data: AddNoteInput
): Promise<TicketNote> {
  const db = getAdminClient();

  const { data: note, error } = await db
    .from("support_ticket_notes")
    .insert({
      ticket_id: ticketId,
      author: data.author,
      body: data.body,
      is_public: data.is_public,
    })
    .select()
    .single();

  if (error) throw new Error(`addNote: ${error.message}`);
  return note as TicketNote;
}

/**
 * Deletes a ticket and its notes.
 */
export async function deleteTicket(id: string): Promise<void> {
  const db = getAdminClient();

  const { error: notesError } = await db
    .from("support_ticket_notes")
    .delete()
    .eq("ticket_id", id);

  if (notesError) throw new Error(`deleteTicket notes: ${notesError.message}`);

  const { error: ticketError } = await db
    .from("support_tickets")
    .delete()
    .eq("id", id);

  if (ticketError) throw new Error(`deleteTicket ticket: ${ticketError.message}`);
}

/**
 * Returns all non-closed/non-resolved tickets for a contact in a location.
 */
export async function searchByContact(
  ghlContactId: string,
  locationId: string
): Promise<SupportTicket[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("support_tickets")
    .select("*")
    .eq("ghl_contact_id", ghlContactId)
    .eq("ghl_location_id", locationId)
    .not("status", "in", '("resolved","closed")')
    .order("created_at", { ascending: false });

  if (error) throw new Error(`searchByContact: ${error.message}`);
  return (data ?? []) as SupportTicket[];
}

/**
 * Finds up to 3 open duplicate tickets for the same contact, category.
 */
export async function findDuplicates(
  ghlContactId: string,
  title: string,
  category: TicketCategory
): Promise<SupportTicket[]> {
  const db = getAdminClient();

  // Fetch open tickets for same contact + category
  const { data, error } = await db
    .from("support_tickets")
    .select("*")
    .eq("ghl_contact_id", ghlContactId)
    .eq("category", category)
    .not("status", "in", '("resolved","closed")')
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(`findDuplicates: ${error.message}`);

  // Simple title similarity: contains common words (3+ chars)
  const queryWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const duplicates = (data ?? []).filter((ticket) => {
    const ticketWords = ticket.title.toLowerCase().split(/\s+/);
    return queryWords.some((w) => ticketWords.includes(w));
  });

  return (duplicates.slice(0, 3) as SupportTicket[]);
}

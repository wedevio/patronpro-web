import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { getTicket, updateTicket } from "@/lib/support/tickets";
import { UpdateTicketSchema } from "@/lib/support/types";
import { notifyClientStatus } from "@/lib/support/notify";

export const dynamic = "force-dynamic";

type AuthResult =
  | { type: "support"; locationId: string; contactId?: string }
  | { type: "pp"; email: string; sub: string };

async function getAuth(): Promise<AuthResult | null> {
  const cookieStore = await cookies();

  const supportToken = cookieStore.get("support-session")?.value;
  if (supportToken) {
    try {
      const session = await verifySupportSession(supportToken);
      return { type: "support", locationId: session.locationId, contactId: session.contactId };
    } catch {
      // fall through
    }
  }

  const ppToken = cookieStore.get("pp-session")?.value;
  if (ppToken) {
    try {
      const session = await verifyPpSession(ppToken);
      return { type: "pp", email: session.email, sub: session.sub };
    } catch {
      // fall through
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ticket = await getTicket(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    if (auth.type === "support" && ticket.ghl_location_id !== auth.locationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error(`[GET /api/support/tickets/${id}]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTicketSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const ticket = await updateTicket(id, parsed.data);

    // Notify client on relevant status changes
    const NOTIFY_STATUSES = new Set(["resolved", "closed", "waiting_client"]);
    if (parsed.data.status && NOTIFY_STATUSES.has(parsed.data.status) && ticket.ghl_contact_id && ticket.creator_email) {
      await notifyClientStatus({
        ghlLocationId: ticket.ghl_location_id,
        ghlContactId:  ticket.ghl_contact_id,
        creatorEmail:  ticket.creator_email,
        ticketNumber:  ticket.ticket_number,
        ticketTitle:   ticket.title,
        newStatus:     parsed.data.status,
      });
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error(`[PATCH /api/support/tickets/${id}]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { listTickets, createTicket } from "@/lib/support/tickets";
import {
  CreateTicketSchema,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/support/types";
import { getLocationAccessToken } from "@/lib/ghl/oauth";

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

export async function GET(request: Request): Promise<Response> {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? undefined) as TicketStatus | undefined;
  const priority = (url.searchParams.get("priority") ?? undefined) as TicketPriority | undefined;
  const ghlContactId = url.searchParams.get("ghlContactId") ?? undefined;

  let locationId: string;
  if (auth.type === "support") {
    locationId = auth.locationId;
  } else {
    const locParam = url.searchParams.get("locationId");
    if (!locParam) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }
    locationId = locParam;
  }

  try {
    const tickets = await listTickets({ locationId, status, priority, ghlContactId });
    return NextResponse.json({ tickets, total: tickets.length });
  } catch (err) {
    console.error("[GET /api/support/tickets]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTicketSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const ticket = await createTicket(parsed.data);

    // Fire-and-forget GHL contact note
    void (async () => {
      try {
        const locationToken = await getLocationAccessToken(ticket.ghl_location_id);
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${ticket.ghl_contact_id}/notes`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${locationToken}`,
              "Content-Type": "application/json",
              Version: "2021-07-28",
            },
            body: JSON.stringify({
              body: `Ticket #${ticket.ticket_number} abierto: ${ticket.title} [${ticket.priority}]`,
              userId: ticket.ghl_contact_id,
            }),
          }
        );
      } catch (err) {
        console.error("[POST /api/support/tickets] GHL note failed", err);
      }
    })();

    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    console.error("[POST /api/support/tickets]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

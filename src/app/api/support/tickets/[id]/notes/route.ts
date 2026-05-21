import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { addNote, getTicket } from "@/lib/support/tickets";
import { AddNoteSchema } from "@/lib/support/types";
import { getLocationAccessToken } from "@/lib/ghl/oauth";

export const dynamic = "force-dynamic";

type AuthResult = "staff" | "client" | null;

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const ppToken = cookieStore.get("pp-session")?.value;
  if (ppToken) {
    try { await verifyPpSession(ppToken); return "staff"; } catch { /* fall through */ }
  }
  const supportToken = cookieStore.get("support-session")?.value;
  if (supportToken) {
    try { await verifySupportSession(supportToken); return "client"; } catch { /* fall through */ }
  }
  return null;
}

/**
 * Sends an SMS notification to the client via GHL Conversations.
 * The contact lives in PatronPro's own location — NOT the client's sub-account location.
 */
async function notifyClientViaGHL(contactId: string, ticketNumber: number, noteBody: string) {
  try {
    const patronproLocationId = process.env.GHL_PATRONPRO_LOCATION_ID ?? "hHLZC7FaTtUINPf3cbHd";
    const token = await getLocationAccessToken(patronproLocationId);
    await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        type: "Email",
        contactId,
        subject: `PatronPro Support — Ticket #${ticketNumber} respondido`,
        html: `<p>${noteBody.replace(/\n/g, "<br>")}</p>`,
      }),
    });
  } catch (err) {
    console.error("[notes] GHL notification failed", err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  let rawBody: unknown;
  try { rawBody = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = AddNoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const note = await addNote(id, parsed.data);

    // Only notify client when staff (pp session) posts a public note
    if (auth === "staff" && parsed.data.is_public) {
      const ticket = await getTicket(id);
      if (ticket?.ghl_contact_id && ticket.ticket_number) {
        void notifyClientViaGHL(ticket.ghl_contact_id, ticket.ticket_number, parsed.data.body);
      }
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/support/tickets/${id}/notes]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { addNote, getTicket } from "@/lib/support/tickets";
import { AddNoteSchema } from "@/lib/support/types";
import { notifyClientNote } from "@/lib/support/notify";

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

    console.log(`[notes] auth=${auth} is_public=${parsed.data.is_public}`);

    // Notify client when a public note is posted (staff reply)
    if (parsed.data.is_public && auth !== null) {
      const ticket = await getTicket(id);
      console.log(`[notes] ticket found=${!!ticket} ghl_contact_id=${ticket?.ghl_contact_id}`);
      if (ticket?.ghl_contact_id && ticket.ghl_location_id && ticket.ticket_number) {
        await notifyClientNote({
          ghlLocationId: ticket.ghl_location_id,
          ghlContactId:  ticket.ghl_contact_id,
          ticketNumber:  ticket.ticket_number,
          ticketTitle:   ticket.title,
          noteBody:      parsed.data.body,
        });
      }
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/support/tickets/${id}/notes]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

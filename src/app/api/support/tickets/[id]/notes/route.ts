import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { addNote, getTicket } from "@/lib/support/tickets";
import { AddNoteSchema } from "@/lib/support/types";
import { getLocationAccessToken } from "@/lib/ghl/oauth";

export const dynamic = "force-dynamic";

async function getAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const supportToken = cookieStore.get("support-session")?.value;
  if (supportToken) {
    try { await verifySupportSession(supportToken); return true; } catch { /* fall through */ }
  }
  const ppToken = cookieStore.get("pp-session")?.value;
  if (ppToken) {
    try { await verifyPpSession(ppToken); return true; } catch { /* fall through */ }
  }
  return false;
}

async function notifyClientViaGHL(locationId: string, contactId: string, message: string) {
  try {
    const token = await getLocationAccessToken(locationId);
    const searchRes = await fetch(
      `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&contactId=${contactId}&limit=1`,
      { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" } }
    );
    if (!searchRes.ok) return;
    const searchData = (await searchRes.json()) as { conversations?: { id: string }[] };
    const conversationId = searchData.conversations?.[0]?.id;
    if (!conversationId) return;
    await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Version: "2021-07-28" },
      body: JSON.stringify({ type: "Email", conversationId, contactId, message }),
    });
  } catch (err) {
    console.error("[notes] GHL notification failed", err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const authorized = await getAuth();
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

    if (parsed.data.is_public) {
      const ticket = await getTicket(id);
      if (ticket?.ghl_contact_id && ticket.ghl_location_id) {
        void notifyClientViaGHL(ticket.ghl_location_id, ticket.ghl_contact_id, parsed.data.body);
      }
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/support/tickets/${id}/notes]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

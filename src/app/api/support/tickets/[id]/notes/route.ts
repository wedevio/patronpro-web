import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { addNote } from "@/lib/support/tickets";
import { AddNoteSchema } from "@/lib/support/types";

export const dynamic = "force-dynamic";

async function getAuth(): Promise<boolean> {
  const cookieStore = await cookies();

  const supportToken = cookieStore.get("support-session")?.value;
  if (supportToken) {
    try {
      await verifySupportSession(supportToken);
      return true;
    } catch {
      // fall through
    }
  }

  const ppToken = cookieStore.get("pp-session")?.value;
  if (ppToken) {
    try {
      await verifyPpSession(ppToken);
      return true;
    } catch {
      // fall through
    }
  }

  return false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const authorized = await getAuth();
  if (!authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AddNoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const note = await addNote(id, parsed.data);
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/support/tickets/${id}/notes]`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

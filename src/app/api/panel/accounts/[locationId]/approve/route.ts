import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pp-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
      await verifyPpSession(token);
    } catch {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { locationId } = await params;
    if (!locationId) {
      return NextResponse.json({ error: "Falta locationId" }, { status: 400 });
    }

    const db = getAdminClient();
    const { error } = await db
      .from("accounts")
      .update({ approved_at: new Date().toISOString() })
      .eq("location_id", locationId)
      .is("approved_at", null);

    if (error) {
      console.error("[PATCH approve]", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/panel/accounts/[locationId]/approve]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

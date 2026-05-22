import { NextResponse } from "next/server";
import { requirePpSession } from "@/lib/auth/require-session";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  try {
    const auth = await requirePpSession();
    if (auth instanceof NextResponse) return auth;

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

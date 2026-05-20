import { NextResponse } from "next/server";
import { updateChecklist } from "@/lib/panel/store";
import type { ChecklistItemId } from "@/lib/panel/store";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  try {
    // Identify the logged-in user
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { locationId, itemId, checked } = await request.json() as {
      locationId: string;
      itemId: ChecklistItemId;
      checked: boolean;
    };

    if (!locationId || !itemId || typeof checked !== "boolean") {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const updated = await updateChecklist(locationId, itemId, checked, user.email ?? user.id);
    if (!updated) {
      return NextResponse.json({ error: "Submission no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, checklist: updated.checklist });
  } catch (err) {
    console.error("[PATCH /api/panel/checklist]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

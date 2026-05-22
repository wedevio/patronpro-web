import { NextResponse } from "next/server";
import { requirePpSession } from "@/lib/auth/require-session";
import { updateChecklist } from "@/lib/panel/store";
import type { ChecklistItemId } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  try {
    const auth = await requirePpSession();
    if (auth instanceof NextResponse) return auth;
    const checkedBy = auth.session.email;

    const { locationId, itemId, checked } = await request.json() as {
      locationId: string;
      itemId: ChecklistItemId;
      checked: boolean;
    };

    if (!locationId || !itemId || typeof checked !== "boolean") {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const updated = await updateChecklist(locationId, itemId, checked, checkedBy);
    if (!updated) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, checklist: updated.checklist });
  } catch (err) {
    console.error("[PATCH /api/panel/checklist]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

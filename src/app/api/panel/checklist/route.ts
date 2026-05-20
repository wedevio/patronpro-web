import { NextResponse } from "next/server";
import { updateChecklist } from "@/lib/panel/store";
import type { ChecklistItemId } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  try {
    const { locationId, itemId, checked } = await request.json() as {
      locationId: string;
      itemId: ChecklistItemId;
      checked: boolean;
    };

    if (!locationId || !itemId || typeof checked !== "boolean") {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const updated = await updateChecklist(locationId, itemId, checked);
    if (!updated) {
      return NextResponse.json({ error: "Submission no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, checklist: updated.checklist });
  } catch (err) {
    console.error("[PATCH /api/panel/checklist]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

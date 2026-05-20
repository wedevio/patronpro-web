import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateChecklist } from "@/lib/panel/store";
import type { ChecklistItemId } from "@/lib/panel/store";
import { jwtDecode } from "jwt-decode";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pp-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Decode (not verify) to get user email for audit trail
    let checkedBy = "unknown";
    try {
      const payload = jwtDecode<{ email?: string; sub?: string }>(token);
      checkedBy = payload.email ?? payload.sub ?? "unknown";
    } catch { /* leave default */ }

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

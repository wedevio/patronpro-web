import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-session";
import { reorderRoadmapItem } from "@/lib/roadmap/store";
import { ReorderRoadmapItemSchema } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReorderRoadmapItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const items = await reorderRoadmapItem(parsed.data, auth.session.email);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[PATCH /api/panel/roadmap/reorder]", err);
    return NextResponse.json({ error: "Failed to reorder roadmap items" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-session";
import { deleteRoadmapItem, getRoadmapItem, updateRoadmapItem } from "@/lib/roadmap/store";
import { UpdateRoadmapItemSchema } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const item = await getRoadmapItem(id);
    if (!item) return NextResponse.json({ error: "Roadmap item not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err) {
    console.error(`[GET /api/panel/roadmap/${id}]`, err);
    return NextResponse.json({ error: "Failed to load roadmap item" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateRoadmapItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const item = await updateRoadmapItem(id, parsed.data, auth.session.email);
    return NextResponse.json({ item });
  } catch (err) {
    console.error(`[PATCH /api/panel/roadmap/${id}]`, err);
    return NextResponse.json({ error: "Failed to update roadmap item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    await deleteRoadmapItem(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/panel/roadmap/${id}]`, err);
    return NextResponse.json({ error: "Failed to delete roadmap item" }, { status: 500 });
  }
}

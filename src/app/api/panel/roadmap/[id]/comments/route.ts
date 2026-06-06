import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-session";
import { addRoadmapComment } from "@/lib/roadmap/store";
import { AddRoadmapCommentSchema } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function POST(
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

  const parsed = AddRoadmapCommentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const comment = await addRoadmapComment(id, parsed.data, {
      label: auth.session.email,
      userId: auth.session.sub,
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/panel/roadmap/${id}/comments]`, err);
    return NextResponse.json({ error: "Failed to add roadmap comment" }, { status: 500 });
  }
}

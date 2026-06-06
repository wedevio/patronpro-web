import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-session";
import { createRoadmapItem, listRoadmapWorkspace } from "@/lib/roadmap/store";
import { CreateRoadmapItemSchema } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const workspace = await listRoadmapWorkspace();
    return NextResponse.json(workspace);
  } catch (err) {
    console.error("[GET /api/panel/roadmap]", err);
    return NextResponse.json({ error: "Failed to load roadmap" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateRoadmapItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const item = await createRoadmapItem(parsed.data, auth.session.email);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/panel/roadmap]", err);
    return NextResponse.json({ error: "Failed to create roadmap item" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePpSession, requireAdmin, requireDocsEditor } from "@/lib/auth/require-session";
import type { DocBlock } from "@/lib/docs/types";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** GET /api/panel/docs/[id] — get full page with blocks */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requirePpSession();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  // Support lookup by id (uuid) or slug (text)
  const isUuid = /^[0-9a-f-]{36}$/.test(id);
  const { data, error } = isUuid
    ? await supabase.from("doc_pages").select("*").eq("id", id).single()
    : await supabase.from("doc_pages").select("*").eq("slug", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ page: data });
}

/** PATCH /api/panel/docs/[id] — update title/description/blocks/published (admin or manager) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireDocsEditor();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: {
    title?: string;
    description?: string;
    blocks?: DocBlock[];
    published?: boolean;
    position?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_by: auth.session.email };
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.blocks !== undefined) patch.blocks = body.blocks;
  if (body.published !== undefined) patch.published = body.published;
  if (body.position !== undefined) patch.position = body.position;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doc_pages")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("[docs] PATCH error", error);
    return NextResponse.json({ error: "Error al actualizar página" }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}

/** DELETE /api/panel/docs/[id] — delete page (admin only) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { error } = await supabase.from("doc_pages").delete().eq("id", id);

  if (error) {
    console.error("[docs] DELETE error", error);
    return NextResponse.json({ error: "Error al eliminar página" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

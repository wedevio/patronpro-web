import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePpSession, requireAdmin } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** GET /api/panel/docs — list all pages (any logged-in user) */
export async function GET(): Promise<Response> {
  const auth = await requirePpSession();
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doc_pages")
    .select("id, slug, title, description, position, published, updated_at, updated_by")
    .order("position", { ascending: true });

  if (error) {
    console.error("[docs] GET list error", error);
    return NextResponse.json({ error: "Error al cargar páginas" }, { status: 500 });
  }

  return NextResponse.json({ pages: data });
}

/** POST /api/panel/docs — create a new page (admin only) */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: { slug?: string; title?: string; description?: string; position?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, title, description, position } = body;
  if (!slug || !title) {
    return NextResponse.json({ error: "slug y title son obligatorios" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doc_pages")
    .insert({
      slug,
      title,
      description: description ?? null,
      position: position ?? 0,
      published: true,
      blocks: [],
      updated_by: auth.session.email,
    })
    .select()
    .single();

  if (error) {
    console.error("[docs] POST create error", error);
    const msg = error.code === "23505" ? "El slug ya existe" : "Error al crear página";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ page: data }, { status: 201 });
}

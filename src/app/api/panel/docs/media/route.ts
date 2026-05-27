import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * POST /api/panel/docs/media
 * Admin-only. Uploads an image or video to the docs-media bucket.
 * Returns { url } — public URL for use in image/video blocks.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (max 50 MB)" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("docs-media")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[docs/media] upload error", error);
    return NextResponse.json({ error: error.message ?? "Error al subir archivo" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("docs-media").getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];

// 1 GB — matches the docs-media bucket limit
const MAX_SIZE = 1024 * 1024 * 1024;
const MAX_SIZE_LABEL = "1 GB";

/**
 * POST /api/panel/docs/media
 * Admin-only. Receives file metadata and returns a signed upload URL so the
 * browser can upload directly to Supabase Storage without going through the
 * Vercel function body (which is limited to 4.5 MB).
 *
 * Request body (JSON):
 *   { filename: string, contentType: string, size: number }
 *
 * Response:
 *   { signedUrl: string, publicUrl: string }
 *
 * Upload flow:
 *   1. Browser POSTs metadata here → gets signedUrl + publicUrl
 *   2. Browser PUTs the file bytes directly to signedUrl
 *   3. Editor stores publicUrl into the block
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: { filename?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, contentType, size } = body;

  if (typeof filename !== "string" || !filename) {
    return NextResponse.json({ error: "filename requerido" }, { status: 400 });
  }
  if (typeof contentType !== "string" || !contentType) {
    return NextResponse.json({ error: "contentType requerido" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "size requerido" }, { status: 400 });
  }

  const allowed = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Archivo demasiado grande (máximo ${MAX_SIZE_LABEL})` },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("docs-media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[docs/media] createSignedUploadUrl error", error);
    return NextResponse.json(
      { error: error?.message ?? "Error al generar URL de subida" },
      { status: 500 },
    );
  }

  const { data: pub } = supabase.storage.from("docs-media").getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  });
}

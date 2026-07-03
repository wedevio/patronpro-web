import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireDocsEditor } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const auth = await requireDocsEditor();
  if (auth instanceof NextResponse) return auth;

  let body: { filename?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.filename !== "string" || !body.filename) return NextResponse.json({ error: "filename is required" }, { status: 400 });
  if (typeof body.contentType !== "string" || !ALLOWED_IMAGES.has(body.contentType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (typeof body.size !== "number" || body.size <= 0 || body.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be 20MB or smaller" }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const ext = (body.filename.includes(".") ? body.filename.split(".").pop() : "png")?.replace(/[^a-z0-9]/gi, "") || "png";
  const path = `collaborator-manual-review/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from("docs-media").createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[manual-review-media] signed upload error", error);
    return NextResponse.json({ error: error?.message ?? "Could not create upload URL" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("docs-media").getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: pub.publicUrl });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySupportSession, verifyPpSession } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const supportToken = cookieStore.get("support-session")?.value;
  if (supportToken) {
    try { await verifySupportSession(supportToken); return true; } catch { /* fall through */ }
  }
  const ppToken = cookieStore.get("pp-session")?.value;
  if (ppToken) {
    try { await verifyPpSession(ppToken); return true; } catch { /* fall through */ }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  const authorized = await getAuth();
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo demasiado grande (max 10MB)" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("support-attachments")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("[upload] storage error", error);
      return NextResponse.json({ error: error.message ?? "Error al subir archivo" }, { status: 500 });
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("support-attachments")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signErr || !signed) {
      return NextResponse.json({ error: "Error al generar URL" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err) {
    console.error("[upload] unexpected error", err);
    return NextResponse.json({ error: "Error interno al subir archivo" }, { status: 500 });
  }
}

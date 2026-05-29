import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  const { locationId } = await params;

  if (!locationId) {
    return NextResponse.json({ error: "locationId requerido" }, { status: 400 });
  }

  const db = getAdminClient();

  const { data, error } = await db
    .from("accounts")
    .select("id, account_websites ( status, html, hero_image_url, about_image_url, contact_image_url, images_status, generated_at, updated_at, error_message )")
    .eq("location_id", locationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ website: null, accountId: null }, { status: 200 });
  }

  const websites = (data.account_websites as unknown[]) ?? [];
  let website = (Array.isArray(websites) ? websites[0] : websites) as Record<string, unknown> | null ?? null;

  // Auto-reset stalled generations (stuck in "generating" for >4 minutes)
  if (website?.status === "generating" && website?.updated_at) {
    const updatedAt = new Date(website.updated_at as string).getTime();
    const stalledMs = 4 * 60 * 1000; // 4 minutes
    if (Date.now() - updatedAt > stalledMs) {
      await db.from("account_websites").upsert(
        { account_id: data.id as string, status: "error", error_message: "Tiempo agotado — la generación tardó demasiado. Intentá de nuevo." },
        { onConflict: "account_id" }
      );
      website = { ...website, status: "error", error_message: "Tiempo agotado — la generación tardó demasiado. Intentá de nuevo." };
    }
  }

  return NextResponse.json({ website: website ?? null, accountId: data.id as string }, { status: 200 });
}

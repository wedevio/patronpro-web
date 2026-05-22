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
    .select("id, account_websites ( status, html, hero_image_url, about_image_url, contact_image_url, generated_at, error_message )")
    .eq("location_id", locationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ website: null, accountId: null }, { status: 200 });
  }

  const websites = (data.account_websites as unknown[]) ?? [];
  const website = Array.isArray(websites) ? websites[0] : websites;

  return NextResponse.json({ website: website ?? null, accountId: data.id as string }, { status: 200 });
}

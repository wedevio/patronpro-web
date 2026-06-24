import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";
import { isPanelLabMode, LAB_ACCOUNT_ID, LAB_LOCATION_ID } from "@/lib/lab/panel-lab";
import { readLabWebsite } from "@/lib/lab/website-store";

export const dynamic = "force-dynamic";

const LAB_ASSET_BASES = [
  "https://getpatronpro.automatic.picturelle.com/lab-assets/",
  "https://0.0.0.0:3015/lab-assets/",
  "http://0.0.0.0:3015/lab-assets/",
  "http://127.0.0.1:3024/lab-assets/",
  "http://localhost:3024/lab-assets/",
];

function isInternalHost(host: string): boolean {
  return host.startsWith("0.0.0.0") || host.startsWith("127.0.0.1") || host.startsWith("localhost");
}

function publicOriginFromRequest(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (host && !isInternalHost(host)) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${forwardedProto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  return new URL(request.url).origin;
}

function normalizeLabAssetUrls(value: unknown, origin: string): unknown {
  if (typeof value === "string") {
    const currentBase = `${origin}/lab-assets/`;
    return LAB_ASSET_BASES.reduce(
      (next, legacyBase) => next.replaceAll(legacyBase, currentBase),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLabAssetUrls(item, origin));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeLabAssetUrls(item, origin)]),
    );
  }

  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  const { locationId } = await params;

  if (!locationId) {
    return NextResponse.json({ error: "locationId requerido" }, { status: 400 });
  }

  if (isPanelLabMode()) {
    if (locationId !== LAB_LOCATION_ID) {
      return NextResponse.json({ website: null, accountId: null }, { status: 200 });
    }
    const origin = publicOriginFromRequest(request);
    const website = normalizeLabAssetUrls(await readLabWebsite(), origin) as Awaited<ReturnType<typeof readLabWebsite>>;
    const hasContent = website.html || website.hero_image_url || website.about_image_url || website.contact_image_url;
    return NextResponse.json(
      { website: hasContent ? website : null, accountId: LAB_ACCOUNT_ID },
      { status: 200 },
    );
  }

  const db = getAdminClient();

  const { data, error } = await db
    .from("accounts")
    .select("id, account_websites ( status, html, hero_image_url, about_image_url, contact_image_url, images_status, generated_at, updated_at, error_message, asset_manifest, asset_optimization_status, asset_optimization_error, html_reference_status, html_last_refreshed_at )")
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

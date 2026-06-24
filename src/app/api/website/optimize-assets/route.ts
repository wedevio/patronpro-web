import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";
import {
  createOptimizedAssetSet,
  inspectImage,
  manifestItemFromImageSet,
  normalizeAssetManifest,
  optimizedAssetCustomValueMappings,
  shouldSkipSmallAsset,
  type WebsiteAssetKey,
  type WebsiteAssetManifestItem,
} from "@/lib/website/asset-optimizer";
import { findCustomValue, listCustomValues, upsertCustomValue } from "@/lib/ghl/custom-values";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { refreshHtmlImageReferences } from "@/lib/website/html-refresh";
import type { WebsiteImageVariant } from "@/lib/website/image-variants";
import { isPanelLabMode, LAB_ACCOUNT_ID, LAB_LOCATION_ID } from "@/lib/lab/panel-lab";
import { accountBelongsToLocation } from "@/lib/website/account-scope";
import {
  readLabAssetBufferFromUrl,
  readLabWebsite,
  writeLabVariant,
  writeLabWebsite,
} from "@/lib/lab/website-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

interface OptimizeAssetsBody {
  accountId: string;
  locationId: string;
  refreshHtml?: boolean;
  assetKeys?: WebsiteAssetKey[];
  logoUrl?: string;
  logoSquareUrl?: string;
}

interface GhlSyncResult {
  status: "not_needed" | "skipped_unchanged" | "synced" | "partial" | "failed";
  customValues: string[];
  attempted: string[];
  succeeded: string[];
  skipped: string[];
  failed: Array<{ fieldKey: string; error: string }>;
}

type DbClient = ReturnType<typeof getAdminClient>;

const DEFAULT_ASSET_KEYS: WebsiteAssetKey[] = ["hero", "about", "contact", "logo", "logo_square"];

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > 12 * 1024 * 1024) return null;
    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadOptimizedVariant(
  db: DbClient,
  locationId: string,
  assetKey: WebsiteAssetKey,
  sourceHash: string,
  variant: WebsiteImageVariant,
): Promise<WebsiteImageVariant | null> {
  const storagePath = `${locationId}/optimized/${assetKey}-${sourceHash.slice(0, 12)}/${variant.filename}`;
  const { error } = await db.storage.from("website-assets").upload(storagePath, variant.buffer, {
    contentType: variant.contentType,
    upsert: true,
  });
  if (error) {
    console.error(`[optimize-assets] Supabase upload error (${variant.filename}):`, error.message);
    return null;
  }
  const { data } = db.storage.from("website-assets").getPublicUrl(storagePath);
  return { ...variant, publicUrl: data.publicUrl };
}

function sourceMapFromWebsite(
  website: Record<string, unknown> | null,
  body: OptimizeAssetsBody,
): Partial<Record<WebsiteAssetKey, string>> {
  return {
    hero: typeof website?.hero_image_url === "string" ? website.hero_image_url : undefined,
    about: typeof website?.about_image_url === "string" ? website.about_image_url : undefined,
    contact: typeof website?.contact_image_url === "string" ? website.contact_image_url : undefined,
    logo: body.logoUrl || undefined,
    logo_square: body.logoSquareUrl || body.logoUrl || undefined,
  };
}

async function fetchLabOrRemoteImageBuffer(url: string): Promise<Buffer | null> {
  const local = await readLabAssetBufferFromUrl(url);
  if (local) return local;
  const remote = await fetchImageBuffer(url);
  return remote?.buffer ?? null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const reqSecret = request.headers.get("x-internal-secret");
    const isInternalCall = internalSecret && reqSecret === internalSecret;

    if (!isInternalCall) {
      const cookieStore = await cookies();
      const ppToken = cookieStore.get("pp-session")?.value;
      if (!ppToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      try {
        await verifyPpSession(ppToken);
      } catch {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const body = (await request.json()) as OptimizeAssetsBody;
    if (!body.accountId || !body.locationId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (isPanelLabMode()) {
      if (body.accountId !== LAB_ACCOUNT_ID || body.locationId !== LAB_LOCATION_ID) {
        return NextResponse.json({ error: "Invalid lab account/location" }, { status: 400 });
      }

      await writeLabWebsite({ asset_optimization_status: "running", asset_optimization_error: null });

      const website = await readLabWebsite();
      const manifest = normalizeAssetManifest(website.asset_manifest);
      const sources = sourceMapFromWebsite(website as unknown as Record<string, unknown>, body);
      const requestedKeys = (body.assetKeys?.length ? body.assetKeys : DEFAULT_ASSET_KEYS)
        .filter((key): key is WebsiteAssetKey => (DEFAULT_ASSET_KEYS as readonly string[]).includes(key));

      const results: WebsiteAssetManifestItem[] = [];
      const failures: string[] = [];
      const skipped: WebsiteAssetKey[] = [];

      for (const assetKey of requestedKeys) {
        const sourceUrl = sources[assetKey];
        if (!sourceUrl) {
          skipped.push(assetKey);
          continue;
        }

        const buffer = await fetchLabOrRemoteImageBuffer(sourceUrl);
        if (!buffer) {
          failures.push(`${assetKey}: fetch_failed`);
          manifest.assets[assetKey] = {
            assetKey,
            sourceUrl,
            status: "failed",
            derivatives: [],
            lastError: "fetch_failed",
          };
          continue;
        }

        const inspected = await inspectImage(buffer);
        const existing = manifest.assets[assetKey];
        if (existing?.sourceHash === inspected.hash && existing.status === "optimized") {
          skipped.push(assetKey);
          continue;
        }

        if (shouldSkipSmallAsset(inspected)) {
          manifest.assets[assetKey] = {
            assetKey,
            sourceUrl,
            sourceHash: inspected.hash,
            sourceSizeBytes: inspected.sizeBytes,
            sourceWidth: inspected.width,
            sourceHeight: inspected.height,
            sourceFormat: inspected.format,
            status: "skipped_small",
            derivatives: [],
            lastOptimizedAt: new Date().toISOString(),
          };
          skipped.push(assetKey);
          continue;
        }

        try {
          const set = await createOptimizedAssetSet(assetKey, buffer);
          const variants = await Promise.all(
            set.variants.map((variant) =>
              writeLabVariant(`${body.locationId}/optimized/${assetKey}-${inspected.hash.slice(0, 12)}`, variant)
            ),
          );
          const item = manifestItemFromImageSet(assetKey, {
            sourceUrl,
            hash: inspected.hash,
            sizeBytes: inspected.sizeBytes,
            width: inspected.width,
            height: inspected.height,
            format: inspected.format,
          }, { variants });
          manifest.assets[assetKey] = item;
          results.push(item);
        } catch (error) {
          const message = error instanceof Error ? error.message : "optimization_failed";
          failures.push(`${assetKey}: ${message}`);
          manifest.assets[assetKey] = {
            assetKey,
            sourceUrl,
            sourceHash: inspected.hash,
            sourceSizeBytes: inspected.sizeBytes,
            sourceWidth: inspected.width,
            sourceHeight: inspected.height,
            sourceFormat: inspected.format,
            status: "failed",
            derivatives: [],
            lastError: message,
          };
        }
      }

      manifest.provider = process.env.WEBSITE_IMAGE_PROVIDER?.trim() || "test";
      manifest.updatedAt = new Date().toISOString();

      let htmlReferenceStatus: string | undefined;
      let nextHtml = website.html ?? undefined;
      let htmlSnapshot: unknown;
      if (body.refreshHtml && nextHtml) {
        const refreshResult = refreshHtmlImageReferences(nextHtml, manifest);
        nextHtml = refreshResult.html;
        htmlReferenceStatus = refreshResult.status;
        htmlSnapshot = refreshResult.snapshot;
      }

      const status =
        failures.length && results.length ? "partial" :
        failures.length ? "failed" :
        results.length ? "optimized" :
        "skipped";

      await writeLabWebsite({
        html: nextHtml ?? website.html,
        asset_manifest: manifest,
        asset_optimization_status: status,
        asset_optimization_error: failures.length ? failures.join("; ") : null,
        html_reference_status: htmlReferenceStatus as "current_merge_tags" | "refreshed" | "noop_unsupported" | undefined,
        html_last_refreshed_at: htmlReferenceStatus ? new Date().toISOString() : website.html_last_refreshed_at,
        html_snapshot: htmlSnapshot,
      });

      return NextResponse.json({
        success: !failures.length,
        status,
        optimized: results.map((item) => item.assetKey),
        skipped,
        failures,
        ghlSync: { status: "skipped_lab_mode" },
        htmlReferenceStatus,
        manifest,
      });
    }

    const db = getAdminClient();
    if (!(await accountBelongsToLocation(db, body.accountId, body.locationId))) {
      return NextResponse.json({ error: "account_location_mismatch" }, { status: 404 });
    }

    const { data: website } = await db
      .from("account_websites")
      .select("html, hero_image_url, about_image_url, contact_image_url, asset_manifest")
      .eq("account_id", body.accountId)
      .maybeSingle();

    await db.from("account_websites").upsert(
      {
        account_id: body.accountId,
        asset_optimization_status: "running",
        asset_optimization_error: null,
      },
      { onConflict: "account_id" },
    );

    const manifest = normalizeAssetManifest(website?.asset_manifest);
    const sources = sourceMapFromWebsite(website as Record<string, unknown> | null, body);
    const requestedKeys = (body.assetKeys?.length ? body.assetKeys : DEFAULT_ASSET_KEYS)
      .filter((key): key is WebsiteAssetKey => (DEFAULT_ASSET_KEYS as readonly string[]).includes(key));

    const results: WebsiteAssetManifestItem[] = [];
    const failures: string[] = [];
    const skipped: WebsiteAssetKey[] = [];

    for (const assetKey of requestedKeys) {
      const sourceUrl = sources[assetKey];
      if (!sourceUrl) {
        skipped.push(assetKey);
        continue;
      }

      const fetched = await fetchImageBuffer(sourceUrl);
      if (!fetched) {
        failures.push(`${assetKey}: fetch_failed`);
        manifest.assets[assetKey] = {
          assetKey,
          sourceUrl,
          status: "failed",
          derivatives: [],
          lastError: "fetch_failed",
        };
        continue;
      }

      const inspected = await inspectImage(fetched.buffer);
      const existing = manifest.assets[assetKey];
      if (existing?.sourceHash === inspected.hash && existing.status === "optimized") {
        skipped.push(assetKey);
        continue;
      }

      if (shouldSkipSmallAsset(inspected)) {
        manifest.assets[assetKey] = {
          assetKey,
          sourceUrl,
          sourceHash: inspected.hash,
          sourceSizeBytes: inspected.sizeBytes,
          sourceWidth: inspected.width,
          sourceHeight: inspected.height,
          sourceFormat: inspected.format,
          status: "skipped_small",
          derivatives: [],
          lastOptimizedAt: new Date().toISOString(),
        };
        skipped.push(assetKey);
        continue;
      }

      try {
        const set = await createOptimizedAssetSet(assetKey, fetched.buffer);
        const uploaded = await Promise.all(
          set.variants.map((variant) =>
            uploadOptimizedVariant(db, body.locationId, assetKey, inspected.hash, variant)
          ),
        );
        const variants = uploaded.filter((variant): variant is WebsiteImageVariant => Boolean(variant));
        if (!variants.length) {
          throw new Error("upload_failed");
        }
        const item = manifestItemFromImageSet(assetKey, {
          sourceUrl,
          hash: inspected.hash,
          sizeBytes: inspected.sizeBytes,
          width: inspected.width,
          height: inspected.height,
          format: inspected.format,
        }, { variants });
        manifest.assets[assetKey] = item;
        results.push(item);
      } catch (error) {
        const message = error instanceof Error ? error.message : "optimization_failed";
        failures.push(`${assetKey}: ${message}`);
        manifest.assets[assetKey] = {
          assetKey,
          sourceUrl,
          sourceHash: inspected.hash,
          sourceSizeBytes: inspected.sizeBytes,
          sourceWidth: inspected.width,
          sourceHeight: inspected.height,
          sourceFormat: inspected.format,
          status: "failed",
          derivatives: [],
          lastError: message,
        };
      }
    }

    manifest.provider = process.env.WEBSITE_IMAGE_PROVIDER?.trim() || "default";
    manifest.updatedAt = new Date().toISOString();

    let htmlReferenceStatus: string | undefined;
    let nextHtml = typeof website?.html === "string" ? website.html : undefined;
    let htmlSnapshot: unknown;
    if (body.refreshHtml && nextHtml) {
      const refreshResult = refreshHtmlImageReferences(nextHtml, manifest);
      nextHtml = refreshResult.html;
      htmlReferenceStatus = refreshResult.status;
      htmlSnapshot = refreshResult.snapshot;
    }

    const status =
      failures.length && results.length ? "partial" :
      failures.length ? "failed" :
      results.length ? "optimized" :
      "skipped";

    const requestedOptimizedItems = requestedKeys.map((key) => manifest.assets[key]);
    const customValueMappings = optimizedAssetCustomValueMappings(requestedOptimizedItems);
    const ghlSync: GhlSyncResult = {
      status: "not_needed",
      customValues: customValueMappings.map(([fieldKey]) => fieldKey),
      attempted: [],
      succeeded: [],
      skipped: [],
      failed: [],
    };

    if (customValueMappings.length) {
      try {
        const token = await getLocationAccessToken(body.locationId);
        const existingValues = await listCustomValues(body.locationId, token);

        for (const [fieldKey, value] of customValueMappings) {
          const existing = findCustomValue(existingValues, fieldKey);
          if (existing?.value === value) {
            ghlSync.skipped.push(fieldKey);
            continue;
          }

          ghlSync.attempted.push(fieldKey);
          const ok = await upsertCustomValue(body.locationId, fieldKey, value, token, existingValues);
          if (ok) {
            ghlSync.succeeded.push(fieldKey);
          } else {
            ghlSync.failed.push({ fieldKey, error: "upsert_failed" });
          }
        }

        if (ghlSync.failed.length) {
          ghlSync.status = ghlSync.succeeded.length || ghlSync.skipped.length ? "partial" : "failed";
          failures.push(`ghl_custom_values: ${ghlSync.failed.map((item) => item.fieldKey).join(", ")}`);
        } else if (ghlSync.succeeded.length) {
          ghlSync.status = "synced";
        } else {
          ghlSync.status = "skipped_unchanged";
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "sync_failed";
        ghlSync.status = "failed";
        ghlSync.failed = customValueMappings.map(([fieldKey]) => ({ fieldKey, error: message }));
        failures.push(`ghl_custom_values: ${message}`);
      }
    }

    await db.from("account_websites").upsert(
      {
        account_id: body.accountId,
        html: nextHtml,
        asset_manifest: manifest,
        asset_optimization_status: status,
        asset_optimization_error: failures.length ? failures.join("; ") : null,
        html_reference_status: htmlReferenceStatus,
        html_last_refreshed_at: htmlReferenceStatus ? new Date().toISOString() : undefined,
        html_snapshot: htmlSnapshot ?? undefined,
      },
      { onConflict: "account_id" },
    );

    return NextResponse.json({
      success: !failures.length,
      status,
      optimized: results.map((item) => item.assetKey),
      skipped,
      failures,
      ghlSync,
      htmlReferenceStatus,
      manifest,
    });
  } catch (error) {
    console.error("[POST /api/website/optimize-assets]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

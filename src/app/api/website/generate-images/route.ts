import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { uploadMediaFromBuffer } from "@/lib/ghl/media";
import { upsertCustomValue } from "@/lib/ghl/custom-values";
import {
  buildVariantSet,
  createWebsiteSocialPreviewImage,
  createWebsiteImageVariants,
  websiteImageCustomValueMappings,
  type WebsiteSocialPreviewImage,
  type WebsiteImageSubject,
  type WebsiteImageVariantSet,
} from "@/lib/website/image-variants";
import { normalizeAssetManifest } from "@/lib/website/asset-optimizer";
import {
  WebsiteImageProviderError,
  assertTestProviderAllowed,
  generateWebsiteImageSource,
  shouldSkipGhlWritesForLab,
  selectedWebsiteImageProvider,
} from "@/lib/website/image-provider";
import { isPanelLabMode } from "@/lib/lab/panel-lab";
import { readLabWebsite, writeLabVariant, writeLabWebsite } from "@/lib/lab/website-store";
import { buildLabWebsiteHtml } from "@/lib/lab/html";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateImagesBody {
  accountId: string;
  locationId: string;
  businessName: string;
  services: string[];
  city: string;
  state: string;
  primaryColor?: string;
  secondaryColor?: string;
  complementaryColor?: string;
  address?: string;
  zip?: string;
  tagline?: string;
  domain?: string;
  hoursOfOperation?: unknown;
  logoUrl?: string;
  logoSquareUrl?: string;
  regenerateHtmlAfterImages?: boolean;
  assetKeys?: WebsiteImageSubject[];
}

type GeneratedImageSet = WebsiteImageVariantSet;
const WEBSITE_IMAGE_SUBJECTS: WebsiteImageSubject[] = ["hero", "about", "contact"];

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchOptionalImageBuffer(url: string | undefined): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function uploadToWebsiteAssets(
  db: ReturnType<typeof getAdminClient>,
  locationId: string,
  asset: { filename: string; buffer: Buffer; contentType: string },
): Promise<string | null> {
  const storagePath = `${locationId}/${asset.filename}`;
  const { error } = await db.storage
    .from("website-assets")
    .upload(storagePath, asset.buffer, {
      contentType: asset.contentType,
      upsert: true,
    });

  if (error) {
    console.error(
      `[generate-images] Supabase upload error (${asset.filename}):`,
      error.message,
    );
    return null;
  }

  const { data: urlData } = db.storage.from("website-assets").getPublicUrl(storagePath);
  return urlData.publicUrl;
}

function canRegenerateHtml(body: GenerateImagesBody): boolean {
  return Boolean(
    body.regenerateHtmlAfterImages &&
    body.accountId &&
    body.locationId &&
    body.businessName &&
    body.address !== undefined &&
    body.zip !== undefined,
  );
}

function requestedSubjects(body: GenerateImagesBody): WebsiteImageSubject[] {
  return (body.assetKeys?.length ? body.assetKeys : WEBSITE_IMAGE_SUBJECTS)
    .filter((key): key is WebsiteImageSubject => WEBSITE_IMAGE_SUBJECTS.includes(key));
}

function manifestWithoutSubjects(value: unknown, subjects: WebsiteImageSubject[]) {
  const manifest = normalizeAssetManifest(value);
  for (const subject of subjects) delete manifest.assets[subject];
  manifest.updatedAt = new Date().toISOString();
  return manifest;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const reqSecret = (request as Request & { headers: Headers }).headers.get("x-internal-secret");
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

    const body = (await request.json()) as GenerateImagesBody;
    const { accountId, locationId, businessName } = body;

    if (!accountId || !businessName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const subjects = requestedSubjects(body);
    if (!subjects.length) {
      return NextResponse.json({ error: "assetKeys inválidos" }, { status: 400 });
    }

    if (isPanelLabMode()) {
      assertTestProviderAllowed();
      const website = await readLabWebsite();
      const generated = await Promise.all(
        subjects.map(async (subject) => {
          const source = await generateWebsiteImageSource(subject, {
            locationId,
            businessName,
            services: body.services,
            city: body.city,
            state: body.state,
          });
          if (!source) return null;
          const set = await createWebsiteImageVariants(subject, source.buffer);
          const uploaded = await Promise.all(
            set.variants.map((variant) => writeLabVariant(`${locationId}/${subject}`, variant)),
          );
          return buildVariantSet(subject, uploaded);
        }),
      );

      const generatedBySubject = Object.fromEntries(
        generated.filter(isNonNull).map((asset) => [asset.subject, asset]),
      ) as Partial<Record<WebsiteImageSubject, GeneratedImageSet>>;
      const results = {
        hero: generatedBySubject.hero?.legacyUrl ?? website.hero_image_url,
        about: generatedBySubject.about?.legacyUrl ?? website.about_image_url,
        contact: generatedBySubject.contact?.legacyUrl ?? website.contact_image_url,
        social: null,
      };
      const responsiveResults = {
        hero: generatedBySubject.hero ? {
          avifSrcset: generatedBySubject.hero.srcsets.avif,
          webpSrcset: generatedBySubject.hero.srcsets.webp,
          jpegSrcset: generatedBySubject.hero.srcsets.jpg,
          jpegFallback: generatedBySubject.hero.jpegFallbackUrl,
        } : null,
        about: generatedBySubject.about ? {
          avifSrcset: generatedBySubject.about.srcsets.avif,
          webpSrcset: generatedBySubject.about.srcsets.webp,
          jpegSrcset: generatedBySubject.about.srcsets.jpg,
          jpegFallback: generatedBySubject.about.jpegFallbackUrl,
        } : null,
        contact: generatedBySubject.contact ? {
          avifSrcset: generatedBySubject.contact.srcsets.avif,
          webpSrcset: generatedBySubject.contact.srcsets.webp,
          jpegSrcset: generatedBySubject.contact.srcsets.jpg,
          jpegFallback: generatedBySubject.contact.jpegFallbackUrl,
        } : null,
      };

      const labHtml = canRegenerateHtml(body)
        ? buildLabWebsiteHtml({
            businessName: body.businessName,
            address: body.address ?? "",
            city: body.city,
            state: body.state,
            zip: body.zip ?? "",
            tagline: body.tagline ?? "",
            services: body.services,
            primaryColor: body.primaryColor ?? "#1E2C46",
            secondaryColor: body.secondaryColor ?? "#F67D0A",
          }, {
            hero: results.hero,
            about: results.about,
            contact: results.contact,
          })
        : undefined;

      await writeLabWebsite({
        status: labHtml ? "ready" : undefined,
        html: labHtml,
        generated_at: labHtml ? new Date().toISOString() : undefined,
        images_status: results.hero || results.about || results.contact ? "ready" : "error",
        hero_image_url: results.hero,
        about_image_url: results.about,
        contact_image_url: results.contact,
        asset_manifest: manifestWithoutSubjects(website.asset_manifest, subjects),
        asset_optimization_status: "idle",
        asset_optimization_error: null,
      });

      return NextResponse.json(
        { success: true, images: results, responsiveImages: responsiveResults, ghlSync: { status: "skipped_lab_mode" } },
        { status: 200 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    assertTestProviderAllowed();
    if (selectedWebsiteImageProvider() !== "test" && !openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const db = getAdminClient();
    const { data: website } = await db
      .from("account_websites")
      .select("hero_image_url, about_image_url, contact_image_url, asset_manifest")
      .eq("account_id", accountId)
      .maybeSingle();

    // Mark images as generating
    await db.from("account_websites").upsert(
      { account_id: accountId, images_status: "generating" },
      { onConflict: "account_id" }
    );

    // Generate 3 images in parallel
    async function processSubject(subject: WebsiteImageSubject): Promise<GeneratedImageSet | null> {
      const source = await generateWebsiteImageSource(subject, {
        locationId,
        businessName,
        services: body.services,
        city: body.city,
        state: body.state,
      }, openaiKey);
      if (!source) return null;

      const set = await createWebsiteImageVariants(subject, source.buffer);
      const uploadedVariants = await Promise.all(
        set.variants.map(async (variant) => {
          const publicUrl = await uploadToWebsiteAssets(db, locationId, variant);
          if (!publicUrl) return null;
          return {
            ...variant,
            publicUrl,
          };
        })
      );

      const variants = uploadedVariants.filter(isNonNull);
      if (variants.length !== set.variants.length) {
        return null;
      }

      return buildVariantSet(subject, variants);
    }

    const generated = await Promise.all(
      subjects.map(processSubject),
    );
    const generatedBySubject = Object.fromEntries(
      generated.filter(isNonNull).map((asset) => [asset.subject, asset]),
    ) as Partial<Record<WebsiteImageSubject, GeneratedImageSet>>;

    let socialAsset: WebsiteSocialPreviewImage | null = null;
    if (generatedBySubject.hero) {
      const logoBuffer = await fetchOptionalImageBuffer(body.logoSquareUrl ?? body.logoUrl);
      const socialSource =
        generatedBySubject.hero.variants.find((variant) => variant.format === "jpg" && variant.width === 1440)?.buffer ??
        generatedBySubject.hero.variants.find((variant) => variant.format === "jpg")?.buffer ??
        generatedBySubject.hero.variants[0].buffer;
      const socialPreview = await createWebsiteSocialPreviewImage(socialSource, {
        businessName,
        services: body.services,
        city: body.city,
        state: body.state,
        primaryColor: body.primaryColor,
        accentColor: body.secondaryColor,
        logoBuffer,
      });
      const publicUrl = await uploadToWebsiteAssets(db, locationId, socialPreview);
      if (publicUrl) {
        socialAsset = {
          ...socialPreview,
          publicUrl,
        };
      }
    }

    const results = {
      hero: generatedBySubject.hero?.legacyUrl ?? (typeof website?.hero_image_url === "string" ? website.hero_image_url : null),
      about: generatedBySubject.about?.legacyUrl ?? (typeof website?.about_image_url === "string" ? website.about_image_url : null),
      contact: generatedBySubject.contact?.legacyUrl ?? (typeof website?.contact_image_url === "string" ? website.contact_image_url : null),
      social: socialAsset?.publicUrl ?? null,
    };
    const responsiveResults = {
      hero: generatedBySubject.hero ? {
        avifSrcset: generatedBySubject.hero.srcsets.avif,
        webpSrcset: generatedBySubject.hero.srcsets.webp,
        jpegSrcset: generatedBySubject.hero.srcsets.jpg,
        jpegFallback: generatedBySubject.hero.jpegFallbackUrl,
      } : null,
      about: generatedBySubject.about ? {
        avifSrcset: generatedBySubject.about.srcsets.avif,
        webpSrcset: generatedBySubject.about.srcsets.webp,
        jpegSrcset: generatedBySubject.about.srcsets.jpg,
        jpegFallback: generatedBySubject.about.jpegFallbackUrl,
      } : null,
      contact: generatedBySubject.contact ? {
        avifSrcset: generatedBySubject.contact.srcsets.avif,
        webpSrcset: generatedBySubject.contact.srcsets.webp,
        jpegSrcset: generatedBySubject.contact.srcsets.jpg,
        jpegFallback: generatedBySubject.contact.jpegFallbackUrl,
      } : null,
    };
    const anyGenerated = Object.keys(generatedBySubject).length > 0;

    // Save URLs to our DB
    await db.from("account_websites").upsert(
      {
        account_id:        accountId,
        images_status:     anyGenerated ? "ready" : "error",
        hero_image_url:    results.hero    ?? undefined,
        about_image_url:   results.about   ?? undefined,
        contact_image_url: results.contact ?? undefined,
        asset_manifest:    anyGenerated ? manifestWithoutSubjects(website?.asset_manifest, subjects) : undefined,
      },
      { onConflict: "account_id" }
    );

    // Upload to GHL Media + set custom values before reporting ready
    let ghlSyncStatus: "synced" | "skipped_lab_mode" | "failed" | "not_generated" = anyGenerated ? "synced" : "not_generated";
    if (anyGenerated) {
      try {
        if (shouldSkipGhlWritesForLab()) {
          await db.from("account_websites").upsert(
            {
              account_id: accountId,
              images_status: "ready",
              asset_optimization_status: "optimized",
              asset_optimization_error: null,
            },
            { onConflict: "account_id" }
          );
          ghlSyncStatus = "skipped_lab_mode";
        } else {
          const token = await getLocationAccessToken(locationId);
          const existing = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
            { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" } }
          ).then(r => r.json()).then((j: { customValues?: Array<{ id: string; name: string; fieldKey: string; value: string }> }) => j.customValues ?? []);

          const syncAssetSetToGhl = async (
            asset: GeneratedImageSet | null,
          ): Promise<boolean> => {
            if (!asset) return true;

            const uploadedVariants = await Promise.all(
              asset.variants.map(async (variant) => {
                const ghlUrl = await uploadMediaFromBuffer(
                  locationId,
                  variant.buffer,
                  variant.filename,
                  variant.contentType,
                  token,
                );

                if (!ghlUrl) {
                  console.error(`[generate-images] GHL media upload failed for ${variant.filename}`);
                  return null;
                }

                return {
                  ...variant,
                  ghlUrl,
                };
              })
            );

            const variants = uploadedVariants.filter(isNonNull);
            if (variants.length !== asset.variants.length) {
              return false;
            }

            const syncedSet = buildVariantSet(asset.subject, variants);
            const mappings = websiteImageCustomValueMappings(syncedSet);
            const results = await Promise.all(
              mappings.map(([fieldKey, value]) =>
                upsertCustomValue(locationId, fieldKey, value, token, existing)
              )
            );
            return results.every(Boolean);
          };

          const syncResults = await Promise.all([
            syncAssetSetToGhl(generatedBySubject.hero ?? null),
            syncAssetSetToGhl(generatedBySubject.about ?? null),
            syncAssetSetToGhl(generatedBySubject.contact ?? null),
          ]);

          if (socialAsset) {
            const socialGhlUrl = await uploadMediaFromBuffer(
              locationId,
              socialAsset.buffer,
              socialAsset.filename,
              socialAsset.contentType,
              token,
            );
            if (socialGhlUrl) {
              socialAsset = {
                ...socialAsset,
                ghlUrl: socialGhlUrl,
              };
              syncResults.push(
                await upsertCustomValue(locationId, "website_social_image", socialGhlUrl, token, existing)
              );
            } else {
              syncResults.push(false);
            }
          }

          const ghlSyncOk = syncResults.every(Boolean);
          ghlSyncStatus = ghlSyncOk ? "synced" : "failed";

          await db.from("account_websites").upsert(
            {
              account_id: accountId,
              images_status: ghlSyncOk ? "ready" : "error",
            },
            { onConflict: "account_id" }
          );
        }
      } catch (err) {
        console.error("[generate-images] GHL upload/custom-values failed:", err);
        ghlSyncStatus = "failed";
        await db.from("account_websites").upsert(
          {
            account_id: accountId,
            images_status: "error",
          },
          { onConflict: "account_id" }
        );
      }
    }

    if (canRegenerateHtml(body)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpatronpro.com";
      void fetch(`${appUrl}/api/website/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INTERNAL_API_SECRET ? { "x-internal-secret": process.env.INTERNAL_API_SECRET } : {}),
        },
        body: JSON.stringify({
          accountId: body.accountId,
          locationId: body.locationId,
          businessName: body.businessName,
          address: body.address ?? "",
          city: body.city,
          state: body.state,
          zip: body.zip ?? "",
          tagline: body.tagline ?? "",
          services: body.services,
          primaryColor: body.primaryColor ?? "#1E2C46",
          secondaryColor: body.secondaryColor ?? "#F67D0A",
          complementaryColor: body.complementaryColor ?? "#FFFFFF",
          domain: body.domain ?? "",
          hoursOfOperation: body.hoursOfOperation ?? null,
          logoUrl: body.logoUrl ?? "",
          logoSquareUrl: body.logoSquareUrl ?? "",
          skipImageGeneration: true,
        }),
      }).catch((err) => console.error("[generate-images] follow-up HTML generation failed:", err));
    }

    return NextResponse.json(
      { success: true, images: results, responsiveImages: responsiveResults, ghlSync: { status: ghlSyncStatus } },
      { status: 200 },
    );

  } catch (err) {
    if (err instanceof WebsiteImageProviderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("[POST /api/website/generate-images]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

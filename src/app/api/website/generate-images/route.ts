import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { uploadMediaFromBuffer } from "@/lib/ghl/media";
import { upsertCustomValue } from "@/lib/ghl/custom-values";
import {
  buildVariantSet,
  createWebsiteImageVariants,
  websiteImageCustomValueMappings,
  type WebsiteImageSubject,
  type WebsiteImageVariantSet,
} from "@/lib/website/image-variants";

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
}

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message: string };
}

type GeneratedImageSet = WebsiteImageVariantSet;

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildImagePrompt(subject: "hero" | "about" | "contact", p: GenerateImagesBody): string {
  const sector = p.services.slice(0, 3).join(", ");
  const location = [p.city, p.state].filter(Boolean).join(", ");

  const BASE = `Professional photography for a ${sector} business based in ${location}. Clean, modern, high-quality. No text, no logos, no people's faces. Photorealistic.`;

  switch (subject) {
    case "hero":
      return `${BASE} Wide hero banner image showing professional work in progress: tools, materials, a job site, or finished project. Cinematic lighting, wide angle, dramatic composition suitable for a website hero background.`;
    case "about":
      return `${BASE} Warm "about us" image: a team or worker in a professional setting, showing craftsmanship and dedication. Approachable, trustworthy feeling. Natural light.`;
    case "contact":
      return `${BASE} Urgent call-to-action image: a close-up of a phone, a professional ready to help, or an impactful finished project. Conveys immediacy and reliability.`;
  }
}

async function generateImage(
  prompt: string,
  openaiKey: string,
): Promise<Buffer | null> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[generate-images] OpenAI error:", res.status, text.slice(0, 200));
    return null;
  }

  const json = (await res.json()) as OpenAIImageResponse;
  const item = json.data?.[0];
  if (!item) return null;

  // b64_json → Buffer directly
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");

  // url → fetch and convert to Buffer
  if (item.url) {
    const imgRes = await fetch(item.url);
    return Buffer.from(await imgRes.arrayBuffer());
  }

  return null;
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

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const db = getAdminClient();

    // Mark images as generating
    await db.from("account_websites").upsert(
      { account_id: accountId, images_status: "generating" },
      { onConflict: "account_id" }
    );

    // Generate 3 images in parallel
    const subjects: WebsiteImageSubject[] = ["hero", "about", "contact"];

    async function processSubject(subject: WebsiteImageSubject): Promise<GeneratedImageSet | null> {
      const prompt = buildImagePrompt(subject, body);
      const buffer = await generateImage(prompt, openaiKey!);
      if (!buffer) return null;

      const set = await createWebsiteImageVariants(subject, buffer);
      const uploadedVariants = await Promise.all(
        set.variants.map(async (variant) => {
          const storagePath = `${locationId}/${variant.filename}`;
          const { error } = await db.storage
            .from("website-assets")
            .upload(storagePath, variant.buffer, {
              contentType: variant.contentType,
              upsert: true,
            });

          if (error) {
            console.error(
              `[generate-images] Supabase upload error (${variant.filename}):`,
              error.message,
            );
            return null;
          }

          const { data: urlData } = db.storage.from("website-assets").getPublicUrl(storagePath);
          return {
            ...variant,
            publicUrl: urlData.publicUrl,
          };
        })
      );

      const variants = uploadedVariants.filter(isNonNull);
      if (variants.length !== set.variants.length) {
        return null;
      }

      return buildVariantSet(subject, variants);
    }

    const [heroAsset, aboutAsset, contactAsset] = await Promise.all(
      subjects.map(processSubject),
    );

    const results = {
      hero: heroAsset?.legacyUrl ?? null,
      about: aboutAsset?.legacyUrl ?? null,
      contact: contactAsset?.legacyUrl ?? null,
    };
    const responsiveResults = {
      hero: heroAsset ? {
        avifSrcset: heroAsset.srcsets.avif,
        webpSrcset: heroAsset.srcsets.webp,
        jpegSrcset: heroAsset.srcsets.jpg,
        jpegFallback: heroAsset.jpegFallbackUrl,
      } : null,
      about: aboutAsset ? {
        avifSrcset: aboutAsset.srcsets.avif,
        webpSrcset: aboutAsset.srcsets.webp,
        jpegSrcset: aboutAsset.srcsets.jpg,
        jpegFallback: aboutAsset.jpegFallbackUrl,
      } : null,
      contact: contactAsset ? {
        avifSrcset: contactAsset.srcsets.avif,
        webpSrcset: contactAsset.srcsets.webp,
        jpegSrcset: contactAsset.srcsets.jpg,
        jpegFallback: contactAsset.jpegFallbackUrl,
      } : null,
    };
    const anyGenerated = Boolean(results.hero || results.about || results.contact);

    // Save URLs to our DB
    await db.from("account_websites").upsert(
      {
        account_id:        accountId,
        images_status:     anyGenerated ? "ready" : "error",
        hero_image_url:    results.hero    ?? undefined,
        about_image_url:   results.about   ?? undefined,
        contact_image_url: results.contact ?? undefined,
      },
      { onConflict: "account_id" }
    );

    // Upload to GHL Media + set custom values before reporting ready
    if (anyGenerated) {
      try {
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
          syncAssetSetToGhl(heroAsset),
          syncAssetSetToGhl(aboutAsset),
          syncAssetSetToGhl(contactAsset),
        ]);

        const ghlSyncOk = syncResults.every(Boolean);

        await db.from("account_websites").upsert(
          {
            account_id: accountId,
            images_status: ghlSyncOk ? "ready" : "error",
          },
          { onConflict: "account_id" }
        );
      } catch (err) {
        console.error("[generate-images] GHL upload/custom-values failed:", err);
        await db.from("account_websites").upsert(
          {
            account_id: accountId,
            images_status: "error",
          },
          { onConflict: "account_id" }
        );
      }
    }

    return NextResponse.json(
      { success: true, images: results, responsiveImages: responsiveResults },
      { status: 200 },
    );

  } catch (err) {
    console.error("[POST /api/website/generate-images]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { uploadMediaFromBuffer } from "@/lib/ghl/media";
import { upsertCustomValue } from "@/lib/ghl/custom-values";

export const dynamic = "force-dynamic";
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
    const subjects = ["hero", "about", "contact"] as const;

    async function processSubject(subject: typeof subjects[number]): Promise<string | null> {
      const prompt = buildImagePrompt(subject, body);
      const buffer = await generateImage(prompt, openaiKey!);
      if (!buffer) return null;

      // Upload to Supabase Storage (our copy)
      const storagePath = `${locationId}/${subject}.png`;
      const { error } = await db.storage
        .from("website-assets")
        .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

      if (error) {
        console.error(`[generate-images] Supabase upload error (${subject}):`, error.message);
        return null;
      }

      const { data: urlData } = db.storage.from("website-assets").getPublicUrl(storagePath);
      return urlData.publicUrl;
    }

    const [heroUrl, aboutUrl, contactUrl] = await Promise.all([
      processSubject("hero"),
      processSubject("about"),
      processSubject("contact"),
    ]);

    const results = { hero: heroUrl, about: aboutUrl, contact: contactUrl };
    const anyGenerated = heroUrl || aboutUrl || contactUrl;

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

    // Upload to GHL Media + set custom values (non-blocking)
    if (anyGenerated) {
      (async () => {
        try {
          const token = await getLocationAccessToken(locationId);

          // Re-generate buffers from Supabase URLs to upload to GHL
          // (we already have the URLs, fetch them back as buffers)
          const downloadAndUpload = async (
            supabaseUrl: string | null,
            filename: string,
            customValueKey: string,
          ): Promise<void> => {
            if (!supabaseUrl) return;
            const res = await fetch(supabaseUrl);
            const buffer = Buffer.from(await res.arrayBuffer());
            const ghlUrl = await uploadMediaFromBuffer(
              locationId, buffer, filename, "image/png", token
            );
            if (ghlUrl) {
              const existing = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
                { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" } }
              ).then(r => r.json()).then((j: { customValues?: Array<{ id: string; name: string; fieldKey: string; value: string }> }) => j.customValues ?? []);
              await upsertCustomValue(locationId, customValueKey, ghlUrl, token, existing);
            } else {
              console.error(`[generate-images] GHL media upload failed for ${filename}`);
            }
          };

          await Promise.all([
            downloadAndUpload(results.hero,    "website_hero_image.png",    "website_hero_image"),
            downloadAndUpload(results.about,   "website_about_image.png",   "website_about_image"),
            downloadAndUpload(results.contact, "website_contact_image.png", "website_contact_image"),
          ]);
        } catch (err) {
          console.error("[generate-images] GHL upload/custom-values failed:", err);
        }
      })();
    }

    return NextResponse.json({ success: true, images: results }, { status: 200 });

  } catch (err) {
    console.error("[POST /api/website/generate-images]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

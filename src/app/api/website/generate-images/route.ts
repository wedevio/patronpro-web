import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";

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
): Promise<{ type: "b64"; data: string } | { type: "url"; data: string } | null> {
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
    console.error("[generate-images] OpenAI images error:", res.status, text.slice(0, 200));
    return null;
  }

  const json = (await res.json()) as OpenAIImageResponse;
  const item = json.data?.[0];
  if (!item) return null;
  if (item.b64_json) return { type: "b64", data: item.b64_json };
  if (item.url)     return { type: "url", data: item.url };
  return null;
}

async function uploadImageToSupabase(
  b64: string,
  path: string,
): Promise<string | null> {
  const db = getAdminClient();
  const buffer = Buffer.from(b64, "base64");

  const { error } = await db.storage
    .from("website-assets")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("[generate-images] Supabase upload error:", error.message);
    return null;
  }

  const { data } = db.storage.from("website-assets").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
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
      const result = await generateImage(prompt, openaiKey!);
      if (!result) return null;

      if (result.type === "b64") {
        const path = `${locationId}/${subject}.png`;
        return uploadImageToSupabase(result.data, path);
      }

      // URL response — re-upload to Supabase for permanence
      try {
        const imgRes = await fetch(result.data);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const path = `${locationId}/${subject}.png`;
        await db.storage.from("website-assets").upload(path, buffer, { contentType: "image/png", upsert: true });
        const { data: urlData } = db.storage.from("website-assets").getPublicUrl(path);
        return urlData.publicUrl;
      } catch {
        return result.data; // fallback: use OpenAI URL (expires)
      }
    }

    const [heroUrl, aboutUrl, contactUrl] = await Promise.all([
      processSubject("hero"),
      processSubject("about"),
      processSubject("contact"),
    ]);

    const results = { hero: heroUrl, about: aboutUrl, contact: contactUrl };
    const anyGenerated = heroUrl || aboutUrl || contactUrl;

    // Save URLs to DB
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

    return NextResponse.json(
      {
        success: true,
        images: results,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("[POST /api/website/generate-images]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

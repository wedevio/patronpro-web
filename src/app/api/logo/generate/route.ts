import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface LogoGenerateBody {
  businessName: string;
  services: string[];
  style: "moderno" | "clasico" | "bold" | "minimalista";
  primaryColor: string;
  secondaryColor: string;
}

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message: string };
}

// Detect specialty from services list
function detectSpecialty(services: string[]): string {
  if (!services.length) return "general construction and remodeling";
  if (services.length <= 2) return services.join(" and ");
  return `${services[0]} and general construction`;
}

const STYLE_DESCRIPTORS: Record<LogoGenerateBody["style"], string> = {
  moderno:     "modern, clean geometric shapes, sans-serif",
  clasico:     "classic, established, serif typography, traditional",
  bold:        "bold, thick strokes, high contrast, strong impact",
  minimalista: "minimalist, simple, elegant, lots of white space",
};

async function callImageAPI(prompt: string, size: "1536x1024" | "1024x1024", openaiKey: string): Promise<string | null> {
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
      size,
      background: "transparent",
    }),
  });

  if (!res.ok) {
    console.error("[logo/generate] OpenAI error:", res.status, (await res.text()).slice(0, 200));
    return null;
  }

  const json = (await res.json()) as OpenAIImageResponse;
  const item = json.data?.[0];
  if (!item) return null;
  if (item.b64_json) return item.b64_json;
  if (item.url) {
    const imgRes = await fetch(item.url);
    return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as LogoGenerateBody;
    const { businessName, services, style, primaryColor, secondaryColor } = body;

    if (!businessName) {
      return NextResponse.json({ error: "businessName requerido" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const specialty  = detectSpecialty(services);
    const styleDesc  = STYLE_DESCRIPTORS[style] ?? STYLE_DESCRIPTORS.moderno;

    const horizontalPrompt = `Professional horizontal logo for "${businessName}", a ${specialty} company. ${styleDesc} style. Primary color: ${primaryColor}, accent: ${secondaryColor}. Logo includes a clean icon/symbol on the left and the company name text on the right. Transparent background. Vector-clean appearance. No gradients. No drop shadows. Professional, memorable, and appropriate for a local business.`;

    const squarePrompt = `Professional square icon/symbol for "${businessName}", a ${specialty} company. ${styleDesc} style. Primary color: ${primaryColor}, accent: ${secondaryColor}. Icon only — no text, no company name. Bold, clean, recognizable. Transparent background. Suitable for favicon and app icon use.`;

    const [horizontal, square] = await Promise.all([
      callImageAPI(horizontalPrompt, "1536x1024", openaiKey),
      callImageAPI(squarePrompt,     "1024x1024", openaiKey),
    ]);

    if (!horizontal || !square) {
      return NextResponse.json({ error: "No se pudo generar el logo" }, { status: 502 });
    }

    return NextResponse.json({ horizontal, square }, { status: 200 });

  } catch (err) {
    console.error("[POST /api/logo/generate]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

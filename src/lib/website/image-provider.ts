import { createHash } from "node:crypto";
import sharp from "sharp";
import type { WebsiteImageSubject } from "./image-variants";
import { runtimeEnv } from "@/lib/lab/runtime-env";

export type WebsiteImageSourceKind = "test" | "ai-openai";

export interface WebsiteImageSourceInput {
  locationId: string;
  businessName: string;
  services: string[];
  city: string;
  state: string;
}

export interface WebsiteImageSource {
  assetKey: WebsiteImageSubject;
  buffer: Buffer;
  contentType: string;
  filename: string;
  sourceKind: WebsiteImageSourceKind;
  hash: string;
  prompt?: string;
}

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message: string };
}

export class WebsiteImageProviderError extends Error {
  constructor(
    public code: "test_provider_not_allowed" | "openai_key_missing" | "openai_generation_failed",
    message: string,
  ) {
    super(message);
    this.name = "WebsiteImageProviderError";
  }
}

export function selectedWebsiteImageProvider(): "test" | "default" {
  return runtimeEnv("WEBSITE_IMAGE_PROVIDER")?.trim() === "test" ? "test" : "default";
}

export function isPanelLabMode(): boolean {
  return runtimeEnv("PATRONPRO_PANEL_LAB") === "true";
}

export function allowLabGhlWrites(): boolean {
  return runtimeEnv("LAB_GHL_WRITE_ENABLED") === "true";
}

export function assertTestProviderAllowed(): void {
  if (selectedWebsiteImageProvider() === "test" && !isPanelLabMode()) {
    throw new WebsiteImageProviderError(
      "test_provider_not_allowed",
      "WEBSITE_IMAGE_PROVIDER=test requires PATRONPRO_PANEL_LAB=true",
    );
  }
}

export function shouldSkipGhlWritesForLab(): boolean {
  return isPanelLabMode() && !allowLabGhlWrites();
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function buildWebsiteImagePrompt(
  subject: WebsiteImageSubject,
  input: WebsiteImageSourceInput,
): string {
  const sector = input.services.slice(0, 3).join(", ");
  const location = [input.city, input.state].filter(Boolean).join(", ");
  const base = `Professional photography for a ${sector} business based in ${location}. Clean, modern, high-quality. No text, no logos, no people's faces. Photorealistic.`;

  switch (subject) {
    case "hero":
      return `${base} Wide hero banner image showing professional work in progress: tools, materials, a job site, or finished project. Cinematic lighting, wide angle, dramatic composition suitable for a website hero background.`;
    case "about":
      return `${base} Warm "about us" image: a team or worker in a professional setting, showing craftsmanship and dedication. Approachable, trustworthy feeling. Natural light.`;
    case "contact":
      return `${base} Urgent call-to-action image: a close-up of a phone, a professional ready to help, or an impactful finished project. Conveys immediacy and reliability.`;
  }
}

function gradientColors(seed: string): [string, string, string] {
  const hash = createHash("sha256").update(seed).digest("hex");
  return [`#${hash.slice(0, 6)}`, `#${hash.slice(6, 12)}`, `#${hash.slice(12, 18)}`];
}

async function createTestGradientSource(
  subject: WebsiteImageSubject,
  input: WebsiteImageSourceInput,
): Promise<WebsiteImageSource> {
  const [start, middle, end] = gradientColors(`${input.locationId}:${subject}:${input.businessName}`);
  const label = `${input.businessName || "PatronPro"} ${subject}`;
  const svg = Buffer.from(`
    <svg width="1536" height="1024" viewBox="0 0 1536 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}"/>
          <stop offset="0.55" stop-color="${middle}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="1536" height="1024" fill="url(#g)"/>
      <circle cx="1230" cy="230" r="210" fill="#ffffff" opacity="0.16"/>
      <circle cx="260" cy="820" r="280" fill="#000000" opacity="0.18"/>
      <text x="96" y="830" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="800" fill="#ffffff" opacity="0.92">${label}</text>
      <text x="100" y="896" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="600" fill="#ffffff" opacity="0.74">test provider image</text>
    </svg>
  `);
  const buffer = await sharp(svg).png().toBuffer();

  return {
    assetKey: subject,
    buffer,
    contentType: "image/png",
    filename: `test-${subject}.png`,
    sourceKind: "test",
    hash: sha256(buffer),
  };
}

async function generateOpenAIImage(
  subject: WebsiteImageSubject,
  input: WebsiteImageSourceInput,
  openaiKey: string | undefined,
): Promise<WebsiteImageSource | null> {
  if (!openaiKey) {
    throw new WebsiteImageProviderError("openai_key_missing", "OPENAI_API_KEY no configurada");
  }

  const prompt = buildWebsiteImagePrompt(subject, input);
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

  let buffer: Buffer | null = null;
  if (item.b64_json) {
    buffer = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    const imgRes = await fetch(item.url);
    buffer = Buffer.from(await imgRes.arrayBuffer());
  }

  if (!buffer) return null;

  return {
    assetKey: subject,
    buffer,
    contentType: "image/png",
    filename: `ai-${subject}.png`,
    sourceKind: "ai-openai",
    hash: sha256(buffer),
    prompt,
  };
}

export async function generateWebsiteImageSource(
  subject: WebsiteImageSubject,
  input: WebsiteImageSourceInput,
  openaiKey?: string,
): Promise<WebsiteImageSource | null> {
  assertTestProviderAllowed();
  if (selectedWebsiteImageProvider() === "test") {
    return createTestGradientSource(subject, input);
  }
  return generateOpenAIImage(subject, input, openaiKey);
}

import sharp from "sharp";

export type WebsiteImageSubject = "hero" | "about" | "contact";
export type WebsiteImageFormat = "avif" | "webp" | "jpg";

export interface WebsiteImageVariant {
  width: number;
  format: WebsiteImageFormat;
  filename: string;
  contentType: string;
  buffer: Buffer;
  publicUrl?: string;
  ghlUrl?: string;
}

export interface WebsiteImageVariantSet {
  subject: WebsiteImageSubject;
  variants: WebsiteImageVariant[];
  srcsets: Record<WebsiteImageFormat, string>;
  jpegFallbackUrl: string;
  legacyUrl: string;
}

export interface WebsiteSocialPreviewInput {
  businessName: string;
  services?: string[];
  city?: string;
  state?: string;
  primaryColor?: string;
  accentColor?: string;
  logoBuffer?: Buffer | null;
}

export interface WebsiteSocialPreviewImage {
  filename: string;
  contentType: string;
  width: number;
  height: number;
  buffer: Buffer;
  publicUrl?: string;
  ghlUrl?: string;
}

const RESPONSIVE_WIDTHS = [640, 960, 1440] as const;
const SOCIAL_PREVIEW_WIDTH = 1200;
const SOCIAL_PREVIEW_HEIGHT = 630;

const FORMAT_META: Record<WebsiteImageFormat, { ext: string; contentType: string }> = {
  avif: { ext: "avif", contentType: "image/avif" },
  webp: { ext: "webp", contentType: "image/webp" },
  jpg: { ext: "jpg", contentType: "image/jpeg" },
};

function normalizeSubject(subject: string): WebsiteImageSubject {
  if (subject === "hero" || subject === "about" || subject === "contact") return subject;
  throw new Error(`Unsupported website image subject: ${subject}`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback;
}

function wrapWords(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [value.slice(0, maxChars)];
}

async function convertVariant(
  input: Buffer,
  subject: WebsiteImageSubject,
  width: number,
  format: WebsiteImageFormat,
): Promise<WebsiteImageVariant> {
  const meta = FORMAT_META[format];
  let pipeline = sharp(input)
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
    });

  if (format === "avif") {
    pipeline = pipeline.avif({
      quality: 50,
      effort: 6,
      chromaSubsampling: "4:2:0",
    });
  } else if (format === "webp") {
    pipeline = pipeline.webp({
      quality: 70,
      effort: 5,
    });
  } else {
    pipeline = pipeline.jpeg({
      quality: 62,
      mozjpeg: true,
      progressive: true,
    });
  }

  return {
    width,
    format,
    filename: `website_${subject}_image-${width}.${meta.ext}`,
    contentType: meta.contentType,
    buffer: await pipeline.toBuffer(),
  };
}

export async function createWebsiteImageVariants(
  subjectInput: string,
  input: Buffer,
): Promise<WebsiteImageVariantSet> {
  const subject = normalizeSubject(subjectInput);
  const variants = await Promise.all(
    RESPONSIVE_WIDTHS.flatMap((width) =>
      (Object.keys(FORMAT_META) as WebsiteImageFormat[]).map((format) =>
        convertVariant(input, subject, width, format)
      )
    )
  );

  return buildVariantSet(subject, variants);
}

export function buildVariantSet(
  subject: WebsiteImageSubject,
  variants: WebsiteImageVariant[],
): WebsiteImageVariantSet {
  const sorted = [...variants].sort((a, b) => a.width - b.width);

  function srcset(format: WebsiteImageFormat): string {
    return sorted
      .filter((variant) => variant.format === format)
      .map((variant) => {
        const url = variant.ghlUrl ?? variant.publicUrl ?? "";
        return url ? `${url} ${variant.width}w` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  const fallback =
    sorted.find((variant) => variant.format === "jpg" && variant.width === 960)?.ghlUrl ??
    sorted.find((variant) => variant.format === "jpg" && variant.width === 960)?.publicUrl ??
    sorted.find((variant) => variant.format === "jpg")?.ghlUrl ??
    sorted.find((variant) => variant.format === "jpg")?.publicUrl ??
    "";

  return {
    subject,
    variants: sorted,
    srcsets: {
      avif: srcset("avif"),
      webp: srcset("webp"),
      jpg: srcset("jpg"),
    },
    jpegFallbackUrl: fallback,
    legacyUrl: fallback,
  };
}

export function websiteImageCustomValueMappings(
  set: WebsiteImageVariantSet,
): Array<[string, string]> {
  const prefix = `website_${set.subject}_image`;
  return [
    [prefix, set.legacyUrl],
    [`${prefix}_avif_srcset`, set.srcsets.avif],
    [`${prefix}_webp_srcset`, set.srcsets.webp],
    [`${prefix}_jpeg_srcset`, set.srcsets.jpg],
    [`${prefix}_jpeg_fallback`, set.jpegFallbackUrl],
  ].filter(([, value]) => value) as Array<[string, string]>;
}

export async function createWebsiteSocialPreviewImage(
  heroInput: Buffer,
  options: WebsiteSocialPreviewInput,
): Promise<WebsiteSocialPreviewImage> {
  const primaryColor = normalizeHexColor(options.primaryColor, "#1E2C46");
  const accentColor = normalizeHexColor(options.accentColor, "#F67D0A");
  const businessName = options.businessName.trim() || "Tu negocio";
  const services = options.services?.filter(Boolean).slice(0, 3).join(" | ") || "Servicios profesionales";
  const location = [options.city, options.state].filter(Boolean).join(", ");
  const headlineLines = wrapWords(businessName, 24, 2);
  const serviceLines = wrapWords(services, 42, 2);

  const background = await sharp(heroInput)
    .rotate()
    .resize(SOCIAL_PREVIEW_WIDTH, SOCIAL_PREVIEW_HEIGHT, { fit: "cover" })
    .jpeg({ quality: 88, mozjpeg: true, progressive: true })
    .toBuffer();

  const headlineSvg = headlineLines
    .map((line, index) =>
      `<text x="80" y="${285 + index * 72}" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("");
  const servicesSvg = serviceLines
    .map((line, index) =>
      `<text x="82" y="${455 + index * 34}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="#ffffff" opacity="0.94">${escapeXml(line)}</text>`
    )
    .join("");

  const overlaySvg = Buffer.from(`
    <svg width="${SOCIAL_PREVIEW_WIDTH}" height="${SOCIAL_PREVIEW_HEIGHT}" viewBox="0 0 ${SOCIAL_PREVIEW_WIDTH} ${SOCIAL_PREVIEW_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000000" stop-opacity="0.78"/>
          <stop offset="0.62" stop-color="#000000" stop-opacity="0.50"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#shade)"/>
      <rect x="0" y="0" width="1200" height="18" fill="${primaryColor}"/>
      <rect x="80" y="188" width="160" height="8" fill="${accentColor}"/>
      ${headlineSvg}
      ${servicesSvg}
      ${location ? `<text x="82" y="548" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff" opacity="0.86">${escapeXml(location)}</text>` : ""}
    </svg>
  `);

  const composites: sharp.OverlayOptions[] = [{ input: overlaySvg, left: 0, top: 0 }];

  if (options.logoBuffer) {
    const logoCardSvg = Buffer.from(`
      <svg width="260" height="126" viewBox="0 0 260 126" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="260" height="126" rx="10" fill="#ffffff" opacity="0.96"/>
      </svg>
    `);
    const logo = await sharp(options.logoBuffer)
      .rotate()
      .resize({ width: 220, height: 86, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    composites.push({ input: logoCardSvg, left: 80, top: 52 });
    composites.push({ input: logo, left: 100, top: 72 });
  }

  return {
    filename: "website_social_image.jpg",
    contentType: "image/jpeg",
    width: SOCIAL_PREVIEW_WIDTH,
    height: SOCIAL_PREVIEW_HEIGHT,
    buffer: await sharp(background)
      .composite(composites)
      .jpeg({ quality: 76, mozjpeg: true, progressive: true })
      .toBuffer(),
  };
}

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

const RESPONSIVE_WIDTHS = [640, 960, 1440] as const;

const FORMAT_META: Record<WebsiteImageFormat, { ext: string; contentType: string }> = {
  avif: { ext: "avif", contentType: "image/avif" },
  webp: { ext: "webp", contentType: "image/webp" },
  jpg: { ext: "jpg", contentType: "image/jpeg" },
};

function normalizeSubject(subject: string): WebsiteImageSubject {
  if (subject === "hero" || subject === "about" || subject === "contact") return subject;
  throw new Error(`Unsupported website image subject: ${subject}`);
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

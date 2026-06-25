import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  buildVariantSet,
  createWebsiteImageVariants,
  type WebsiteImageSubject,
  type WebsiteImageVariant,
  type WebsiteImageVariantSet,
} from "./image-variants";

export type WebsiteAssetKey = WebsiteImageSubject | "logo" | "logo_square" | "social_preview";
export type WebsiteAssetStatus =
  | "not_started"
  | "optimized"
  | "skipped_small"
  | "skipped_no_benefit"
  | "skipped_unsupported"
  | "stale_source_changed"
  | "failed";

export interface WebsiteAssetDerivative {
  width: number;
  format: "webp" | "jpg" | "png";
  url: string;
  sizeBytes: number;
}

export interface WebsiteAssetManifestItem {
  assetKey: WebsiteAssetKey;
  sourceUrl?: string;
  sourceHash?: string;
  sourceSizeBytes?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceFormat?: string;
  status: WebsiteAssetStatus;
  derivatives: WebsiteAssetDerivative[];
  lastOptimizedAt?: string;
  lastError?: string;
}

export interface WebsiteAssetManifest {
  version: number;
  provider: string;
  updatedAt: string;
  assets: Partial<Record<WebsiteAssetKey, WebsiteAssetManifestItem>>;
}

export const ASSET_SKIP_THRESHOLD_BYTES = 120 * 1024;

export function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function normalizeAssetManifest(value: unknown): WebsiteAssetManifest {
  if (
    value &&
    typeof value === "object" &&
    "assets" in value &&
    typeof (value as { assets?: unknown }).assets === "object"
  ) {
    const manifest = value as WebsiteAssetManifest;
    return {
      version: Number.isFinite(manifest.version) ? manifest.version : 1,
      provider: manifest.provider || "default",
      updatedAt: manifest.updatedAt || new Date(0).toISOString(),
      assets: manifest.assets ?? {},
    };
  }

  return {
    version: 1,
    provider: "default",
    updatedAt: new Date(0).toISOString(),
    assets: {},
  };
}

export function shouldSkipSmallAsset(input: {
  sizeBytes: number;
  format?: string;
  width?: number;
  height?: number;
}): boolean {
  const acceptableFormat = input.format === "webp";
  const smallEnough = input.sizeBytes > 0 && input.sizeBytes < ASSET_SKIP_THRESHOLD_BYTES;
  const reasonableDimensions = !input.width || input.width <= 1440;
  const reasonableHeight = !input.height || input.height <= 1440;
  return smallEnough && acceptableFormat && reasonableDimensions && reasonableHeight;
}

export async function inspectImage(buffer: Buffer): Promise<{
  sizeBytes: number;
  width?: number;
  height?: number;
  format?: string;
  hash: string;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    sizeBytes: buffer.byteLength,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hash: sha256Buffer(buffer),
  };
}

async function createLogoVariants(
  assetKey: "logo" | "logo_square",
  input: Buffer,
): Promise<WebsiteImageVariant[]> {
  const widths = [180, 360, 720];
  return Promise.all(
    widths.map(async (width) => {
      const buffer = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 78, effort: 5 })
        .toBuffer();
      return {
        width,
        format: "webp" as const,
        filename: `website_${assetKey}-${width}.webp`,
        contentType: "image/webp",
        buffer,
      };
    }),
  );
}

export async function createOptimizedAssetSet(
  assetKey: WebsiteAssetKey,
  input: Buffer,
): Promise<WebsiteImageVariantSet | { assetKey: "logo" | "logo_square"; variants: WebsiteImageVariant[] }> {
  if (assetKey === "hero" || assetKey === "about" || assetKey === "contact") {
    return createWebsiteImageVariants(assetKey, input);
  }
  if (assetKey === "logo" || assetKey === "logo_square") {
    return {
      assetKey,
      variants: await createLogoVariants(assetKey, input),
    };
  }
  throw new Error(`Unsupported optimizable asset key: ${assetKey}`);
}

export function manifestItemFromImageSet(
  assetKey: WebsiteAssetKey,
  source: {
    sourceUrl?: string;
    hash: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    format?: string;
  },
  set: WebsiteImageVariantSet | { variants: WebsiteImageVariant[] },
): WebsiteAssetManifestItem {
  return {
    assetKey,
    sourceUrl: source.sourceUrl,
    sourceHash: source.hash,
    sourceSizeBytes: source.sizeBytes,
    sourceWidth: source.width,
    sourceHeight: source.height,
    sourceFormat: source.format,
    status: "optimized",
    derivatives: set.variants
      .filter((variant) => variant.publicUrl)
      .map((variant) => ({
        width: variant.width,
        format: variant.format,
        url: variant.publicUrl ?? "",
        sizeBytes: variant.buffer.byteLength,
      })),
    lastOptimizedAt: new Date().toISOString(),
  };
}

function sortedDerivatives(item: WebsiteAssetManifestItem): WebsiteAssetDerivative[] {
  return [...item.derivatives].filter((derivative) => derivative.url).sort((a, b) => a.width - b.width);
}

function srcsetFor(item: WebsiteAssetManifestItem, format: "webp" | "jpg"): string {
  return sortedDerivatives(item)
    .filter((derivative) => derivative.format === format)
    .map((derivative) => `${derivative.url} ${derivative.width}w`)
    .join(", ");
}

function preferredDerivativeUrl(
  item: WebsiteAssetManifestItem,
  format: WebsiteAssetDerivative["format"],
  width: number,
): string | undefined {
  const derivatives = sortedDerivatives(item);
  return (
    derivatives.find((derivative) => derivative.format === format && derivative.width === width)?.url ??
    derivatives.find((derivative) => derivative.format === format)?.url
  );
}

function preferredWebsiteUrl(item: WebsiteAssetManifestItem): string | undefined {
  return (
    preferredDerivativeUrl(item, "jpg", 960) ??
    preferredDerivativeUrl(item, "webp", 960) ??
    sortedDerivatives(item)[0]?.url
  );
}

function preferredLogoUrl(item: WebsiteAssetManifestItem): string | undefined {
  return (
    preferredDerivativeUrl(item, "webp", 360) ??
    preferredDerivativeUrl(item, "webp", 180) ??
    sortedDerivatives(item)[0]?.url
  );
}

export function optimizedAssetCustomValueMappings(
  items: Array<WebsiteAssetManifestItem | undefined>,
): Array<[string, string]> {
  const mappings: Array<[string, string | undefined]> = [];

  for (const item of items) {
    if (!item || item.status !== "optimized") continue;

    if (item.assetKey === "logo") {
      mappings.push(["logo", preferredLogoUrl(item)]);
      continue;
    }

    if (item.assetKey === "logo_square") {
      mappings.push(["logo_cuadrado", preferredLogoUrl(item)]);
      continue;
    }

    if (item.assetKey === "hero" || item.assetKey === "about" || item.assetKey === "contact") {
      const prefix = `website_${item.assetKey}_image`;
      const fallback = preferredWebsiteUrl(item);
      mappings.push(
        [prefix, fallback],
        [`${prefix}_webp_srcset`, srcsetFor(item, "webp")],
        [`${prefix}_jpeg_srcset`, srcsetFor(item, "jpg")],
        [`${prefix}_jpeg_fallback`, fallback],
      );
    }
  }

  return mappings.filter(([, value]) => value) as Array<[string, string]>;
}

export function rebuildVariantSetWithPublicUrls(
  subject: WebsiteImageSubject,
  variants: WebsiteImageVariant[],
): WebsiteImageVariantSet {
  return buildVariantSet(subject, variants);
}

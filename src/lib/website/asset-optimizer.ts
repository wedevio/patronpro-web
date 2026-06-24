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
  format: "avif" | "webp" | "jpg" | "png";
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
  const acceptableFormat = input.format === "webp" || input.format === "avif";
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

export function rebuildVariantSetWithPublicUrls(
  subject: WebsiteImageSubject,
  variants: WebsiteImageVariant[],
): WebsiteImageVariantSet {
  return buildVariantSet(subject, variants);
}

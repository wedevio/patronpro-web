import { describe, expect, test } from "bun:test";
import {
  normalizeAssetManifest,
  optimizedAssetCustomValueMappings,
  shouldSkipSmallAsset,
} from "../src/lib/website/asset-optimizer";

describe("website asset optimizer", () => {
  test("skips small acceptable WebP assets", () => {
    expect(
      shouldSkipSmallAsset({
        sizeBytes: 40 * 1024,
        format: "webp",
        width: 960,
        height: 640,
      }),
    ).toBe(true);
  });

  test("does not skip large PNG assets", () => {
    expect(
      shouldSkipSmallAsset({
        sizeBytes: 700 * 1024,
        format: "png",
        width: 1440,
        height: 960,
      }),
    ).toBe(false);
  });

  test("normalizes empty manifest shape", () => {
    const manifest = normalizeAssetManifest(null);
    expect(manifest.version).toBe(1);
    expect(manifest.provider).toBe("default");
    expect(manifest.assets).toEqual({});
  });

  test("builds GHL custom value mappings for optimized logos and responsive images", () => {
    const mappings = optimizedAssetCustomValueMappings([
      {
        assetKey: "logo",
        status: "optimized",
        derivatives: [
          { width: 180, format: "webp", url: "https://cdn/logo-180.webp", sizeBytes: 1200 },
          { width: 360, format: "webp", url: "https://cdn/logo-360.webp", sizeBytes: 2200 },
        ],
      },
      {
        assetKey: "logo_square",
        status: "optimized",
        derivatives: [
          { width: 360, format: "webp", url: "https://cdn/square-360.webp", sizeBytes: 1800 },
        ],
      },
      {
        assetKey: "hero",
        status: "optimized",
        derivatives: [
          { width: 640, format: "webp", url: "https://cdn/hero-640.webp", sizeBytes: 4200 },
          { width: 960, format: "webp", url: "https://cdn/hero-960.webp", sizeBytes: 6200 },
          { width: 960, format: "jpg", url: "https://cdn/hero-960.jpg", sizeBytes: 7200 },
          { width: 1440, format: "avif", url: "https://cdn/hero-1440.avif", sizeBytes: 5200 },
        ],
      },
    ]);

    expect(mappings).toContainEqual(["logo", "https://cdn/logo-360.webp"]);
    expect(mappings).toContainEqual(["logo_cuadrado", "https://cdn/square-360.webp"]);
    expect(mappings).toContainEqual(["website_hero_image", "https://cdn/hero-960.jpg"]);
    expect(mappings).toContainEqual(["website_hero_image_webp_srcset", "https://cdn/hero-640.webp 640w, https://cdn/hero-960.webp 960w"]);
    expect(mappings).toContainEqual(["website_hero_image_avif_srcset", "https://cdn/hero-1440.avif 1440w"]);
    expect(mappings).toContainEqual(["website_hero_image_jpeg_fallback", "https://cdn/hero-960.jpg"]);
  });
});

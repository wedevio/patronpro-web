import { describe, expect, test } from "bun:test";
import {
  normalizeAssetManifest,
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
});

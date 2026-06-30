import { describe, expect, test } from "bun:test";
import { refreshHtmlImageReferences } from "../src/lib/website/html-refresh";
import type { WebsiteAssetManifest } from "../src/lib/website/asset-optimizer";

const manifest: WebsiteAssetManifest = {
  version: 1,
  provider: "test",
  updatedAt: "2026-06-23T00:00:00.000Z",
  assets: {
    hero: {
      assetKey: "hero",
      sourceUrl: "https://example.com/original-hero.jpg",
      sourceHash: "abc",
      status: "optimized",
      derivatives: [
        {
          width: 960,
          format: "webp",
          url: "https://example.com/optimized-hero.webp",
          sizeBytes: 42000,
        },
      ],
    },
  },
};

describe("refreshHtmlImageReferences", () => {
  test("marks merge-tag HTML current without mutating copy", () => {
    const html = `<picture><source srcset="{{custom_values.website_hero_image_webp_srcset}}"><img src="{{custom_values.website_hero_image_jpeg_fallback}}"></picture><h1>Keep this copy</h1>`;
    const result = refreshHtmlImageReferences(html, manifest);

    expect(result.status).toBe("current_merge_tags");
    expect(result.changed).toBe(false);
    expect(result.html).toBe(html);
    expect(result.snapshot).toBeUndefined();
  });

  test("replaces only known tracked direct source URLs", () => {
    const html = `<main><img src="https://example.com/original-hero.jpg"><p>Keep this copy</p></main>`;
    const result = refreshHtmlImageReferences(html, manifest);

    expect(result.status).toBe("refreshed");
    expect(result.changed).toBe(true);
    expect(result.html).toContain("https://example.com/optimized-hero.webp");
    expect(result.html).toContain("<p>Keep this copy</p>");
    expect(result.snapshot?.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("returns noop_unsupported for unknown direct images", () => {
    const html = `<main><img src="https://cdn.example.com/untracked.jpg"></main>`;
    const result = refreshHtmlImageReferences(html, manifest);

    expect(result.status).toBe("noop_unsupported");
    expect(result.changed).toBe(false);
    expect(result.html).toBe(html);
  });
});

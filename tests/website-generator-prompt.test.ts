import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("website generator prompt", () => {
  test("preserves responsive image and loading policy", () => {
    const source = readFileSync("src/app/api/website/generate/route.ts", "utf8");
    expect(source).toContain("website_hero_image_webp_srcset");
    expect(source).toContain("website_hero_image_jpeg_srcset");
    expect(source.toLowerCase()).not.toContain("avif");
    expect(source).toContain('loading="eager"');
    expect(source).toContain('fetchpriority="high"');
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('sizes="(max-width: 1024px) 100vw, 50vw"');
  });
});

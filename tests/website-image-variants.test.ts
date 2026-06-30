import { describe, expect, test } from "bun:test";
import { buildVariantSet, websiteImageCustomValueMappings } from "../src/lib/website/image-variants";

const tinyBuffer = Buffer.from("x");

describe("website image variants", () => {
  test("uses optimized hero JPEG fallback as the social image custom value", () => {
    const hero = buildVariantSet("hero", [
      {
        width: 960,
        format: "jpg",
        filename: "hero.jpg",
        contentType: "image/jpeg",
        buffer: tinyBuffer,
        ghlUrl: "https://media.example.com/hero-960.jpg",
      },
    ]);

    expect(websiteImageCustomValueMappings(hero)).toContainEqual([
      "website_social_image",
      "https://media.example.com/hero-960.jpg",
    ]);
  });

  test("does not use non-hero images as the social image", () => {
    const about = buildVariantSet("about", [
      {
        width: 960,
        format: "jpg",
        filename: "about.jpg",
        contentType: "image/jpeg",
        buffer: tinyBuffer,
        ghlUrl: "https://media.example.com/about-960.jpg",
      },
    ]);

    expect(websiteImageCustomValueMappings(about).some(([key]) => key === "website_social_image")).toBe(false);
  });
});

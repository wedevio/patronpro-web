import { describe, expect, test } from "bun:test";
import {
  WebsiteImageProviderError,
  generateWebsiteImageSource,
  selectedWebsiteImageProvider,
} from "../src/lib/website/image-provider";

async function withProviderEnv<T>(
  provider: string | undefined,
  lab: string | undefined,
  fn: () => Promise<T> | T,
): Promise<T> {
  const originalProvider = process.env.WEBSITE_IMAGE_PROVIDER;
  const originalLab = process.env.PATRONPRO_PANEL_LAB;

  if (provider === undefined) delete process.env.WEBSITE_IMAGE_PROVIDER;
  else process.env.WEBSITE_IMAGE_PROVIDER = provider;
  if (lab === undefined) delete process.env.PATRONPRO_PANEL_LAB;
  else process.env.PATRONPRO_PANEL_LAB = lab;

  try {
    return await fn();
  } finally {
    if (originalProvider === undefined) delete process.env.WEBSITE_IMAGE_PROVIDER;
    else process.env.WEBSITE_IMAGE_PROVIDER = originalProvider;
    if (originalLab === undefined) delete process.env.PATRONPRO_PANEL_LAB;
    else process.env.PATRONPRO_PANEL_LAB = originalLab;
  }
}

describe("website image provider", () => {
  test("defaults to the normal provider when env is unset", async () => {
    await withProviderEnv(undefined, undefined, () => {
      expect(selectedWebsiteImageProvider()).toBe("default");
    });
  });

  test("rejects test provider outside panel lab mode", async () => {
    await withProviderEnv("test", undefined, async () => {
      await expect(
        generateWebsiteImageSource("hero", {
          locationId: "loc_123",
          businessName: "Demo Roofing",
          services: ["Roofing"],
          city: "Glendale",
          state: "CA",
        }),
      ).rejects.toThrow(WebsiteImageProviderError);
    });
  });

  test("test provider returns deterministic PNG buffers", async () => {
    await withProviderEnv("test", "true", async () => {
      const input = {
        locationId: "loc_123",
        businessName: "Demo Roofing",
        services: ["Roofing"],
        city: "Glendale",
        state: "CA",
      };

      const first = await generateWebsiteImageSource("hero", input);
      const second = await generateWebsiteImageSource("hero", input);

      expect(first?.sourceKind).toBe("test");
      expect(first?.contentType).toBe("image/png");
      expect(first?.filename).toBe("test-hero.png");
      expect(first?.hash).toBe(second?.hash);
      expect(first?.buffer.byteLength).toBeGreaterThan(1000);
    });
  });
});

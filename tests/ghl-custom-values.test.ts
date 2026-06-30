import { describe, expect, test } from "bun:test";
import { findCustomValue } from "../src/lib/ghl/custom-values";
import type { GHLCustomValue } from "../src/lib/onboarding/types";

describe("GHL custom values", () => {
  test("matches custom value field keys exactly after normalizing merge syntax", () => {
    const values: GHLCustomValue[] = [
      { id: "1", name: "logo", fieldKey: "{{ custom_values.logo }}", value: "https://cdn/logo.png" },
      { id: "2", name: "logo_cuadrado", fieldKey: "{{ custom_values.logo_cuadrado }}", value: "https://cdn/square.png" },
      { id: "3", name: "website_hero_image_webp_srcset", fieldKey: "{{ custom_values.website_hero_image_webp_srcset }}", value: "srcset" },
    ];

    expect(findCustomValue(values, "logo")?.id).toBe("1");
    expect(findCustomValue(values, "logo_cuadrado")?.id).toBe("2");
    expect(findCustomValue(values, "website_hero_image")?.id).toBeUndefined();
  });
});

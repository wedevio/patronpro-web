import { describe, expect, test } from "bun:test";
import { buildBrandPalette, normalizeHexColor } from "../src/lib/ghl/post-onboarding-setup";
import type { PanelSubmission } from "../src/lib/panel/store";

const baseSubmission = {
  letUsChooseColors: false,
  primaryColor: "#123abc",
  secondaryColor: "f69309",
  complementaryColor: "#FFFFFF",
} as PanelSubmission;

describe("post-onboarding setup helpers", () => {
  test("normalizes brand palette for GHL Brand Board payloads", () => {
    const palette = buildBrandPalette(baseSubmission);

    expect(palette.map((item) => item.hex)).toEqual(["#123ABC", "#F69309", "#FFFFFF"]);
    expect(palette[0].rgb).toBe("rgb(18, 58, 188)");
    expect(palette[0].hexa).toBe("#123ABCFF");
  });

  test("falls back to PatronPro defaults when colors are delegated", () => {
    const palette = buildBrandPalette({ ...baseSubmission, letUsChooseColors: true });

    expect(palette.map((item) => item.hex)).toEqual(["#471F23", "#F69309", "#2F1417"]);
  });

  test("rejects invalid hex values", () => {
    expect(normalizeHexColor("not-a-color", "#000000")).toBe("#000000");
  });
});

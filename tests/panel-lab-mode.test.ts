import { describe, expect, test } from "bun:test";
import { isPanelLabMode, labSubmission } from "../src/lib/lab/panel-lab";

function withLabEnv<T>(value: string | undefined, fn: () => T): T {
  const original = process.env.PATRONPRO_PANEL_LAB;

  if (value === undefined) delete process.env.PATRONPRO_PANEL_LAB;
  else process.env.PATRONPRO_PANEL_LAB = value;

  try {
    return fn();
  } finally {
    if (original === undefined) delete process.env.PATRONPRO_PANEL_LAB;
    else process.env.PATRONPRO_PANEL_LAB = original;
  }
}

describe("isPanelLabMode", () => {
  test("is disabled unless explicitly enabled", () => {
    withLabEnv(undefined, () => {
      expect(isPanelLabMode()).toBe(false);
    });
  });

  test("requires an exact true value", () => {
    withLabEnv("false", () => {
      expect(isPanelLabMode()).toBe(false);
    });

    withLabEnv("true", () => {
      expect(isPanelLabMode()).toBe(true);
    });
  });

  test("lab account includes an original logo for optimization status checks", () => {
    const submission = labSubmission();
    expect(submission.logoUrl).toContain("/lab-assets/original-logo/");
    expect(submission.logoSquareUrl).toBe(submission.logoUrl);
  });
});

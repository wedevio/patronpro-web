import { describe, expect, test } from "bun:test";
import { onboardingLinkIsActive } from "../src/lib/panel/store";

describe("onboardingLinkIsActive", () => {
  const now = Date.parse("2026-06-24T12:00:00Z");

  test("accepts future expiration timestamps", () => {
    expect(onboardingLinkIsActive("2026-06-25T12:00:00Z", now)).toBe(true);
  });

  test("rejects expired timestamps", () => {
    expect(onboardingLinkIsActive("2026-06-24T11:59:59Z", now)).toBe(false);
  });

  test("rejects missing or invalid timestamps", () => {
    expect(onboardingLinkIsActive(undefined, now)).toBe(false);
    expect(onboardingLinkIsActive("not-a-date", now)).toBe(false);
  });
});

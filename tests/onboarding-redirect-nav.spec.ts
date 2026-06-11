import { expect, test } from "@playwright/test";
import { startBookingRedirect } from "../src/lib/onboarding/booking-navigation";
import { finishOnboardingClientFlow } from "../src/lib/onboarding/booking-navigation";

test("returns false when the API response has no redirect URL", () => {
  const calledUrls: string[] = [];

  const result = startBookingRedirect(undefined, (url) => {
    calledUrls.push(url);
  });

  expect(result).toBe(false);
  expect(calledUrls).toEqual([]);
});

test("starts the redirect when a redirect URL is present", () => {
  const calledUrls: string[] = [];

  const result = startBookingRedirect("https://example.com/booking", (url) => {
    calledUrls.push(url);
  });

  expect(result).toBe(true);
  expect(calledUrls).toEqual(["https://example.com/booking"]);
});

test("falls back cleanly when navigation throws", () => {
  const result = startBookingRedirect("https://example.com/booking", () => {
    throw new Error("blocked");
  });

  expect(result).toBe(false);
});

test("hands off the booking redirect URL returned by onboarding success", () => {
  const calledUrls: string[] = [];

  const result = finishOnboardingClientFlow(
    { success: true, redirectUrl: "https://example.com/booking", prefillKeys: [] },
    (url) => {
      calledUrls.push(url);
    }
  );

  expect(result).toBe("redirected");
  expect(calledUrls).toEqual(["https://example.com/booking"]);
});

test("falls back to the local success state when onboarding success has no redirect URL", () => {
  const calledUrls: string[] = [];

  const result = finishOnboardingClientFlow(
    { success: true, redirectUrl: " ", prefillKeys: [] },
    (url) => {
      calledUrls.push(url);
    }
  );

  expect(result).toBe("fallback");
  expect(calledUrls).toEqual([]);
});

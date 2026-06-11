import { expect, test } from "@playwright/test";
import {
  BOOKING_WIDGET_URL,
  ONBOARDING_COMPLETION_TAG,
  buildBookingRedirect,
  buildOnboardingSubmitResponse,
} from "../src/lib/onboarding/booking-redirect";

test("returns the plain booking widget URL when no identity is available", () => {
  const result = buildBookingRedirect({});

  expect(result.redirectUrl).toBe(BOOKING_WIDGET_URL);
  expect(result.prefillKeys).toEqual([]);
});

test("appends only trusted prefill fields that are present", () => {
  const result = buildBookingRedirect({
    firstName: "Ada",
    email: "ada@example.com",
  });

  expect(result.redirectUrl).toBe(
    `${BOOKING_WIDGET_URL}?first_name=Ada&email=ada%40example.com`
  );
  expect(result.prefillKeys).toEqual(["first_name", "email"]);
});

test("maps first name, last name, and email into the onboarding success payload", () => {
  const result = buildOnboardingSubmitResponse({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
  });

  expect(result).toEqual({
    success: true,
    redirectUrl:
      `${BOOKING_WIDGET_URL}?first_name=Ada&last_name=Lovelace&email=ada%40example.com`,
    prefillKeys: ["first_name", "last_name", "email"],
  });
});

test("preserves the onboarding completion tag contract", () => {
  expect(ONBOARDING_COMPLETION_TAG).toBe("ob-form-ok");
});

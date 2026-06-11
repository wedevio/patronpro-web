import { expect, test } from "@playwright/test";
import { buildOnboardingFinalizeResponse } from "../src/app/api/onboarding/route";
import type { GhlContactIdentity } from "../src/lib/ghl/contacts";
import {
  BOOKING_WIDGET_URL,
  ONBOARDING_COMPLETION_TAG,
} from "../src/lib/onboarding/booking-redirect";
import { finalizeOnboardingSubmission } from "../src/app/api/onboarding/submit-success";

function createDeps(identity: GhlContactIdentity = {}) {
  const addTagCalls: Array<{ contactId: string; tag: string }> = [];

  return {
    addTagCalls,
    deps: {
      addTagToPatronProContact: async (contactId: string, tag: string) => {
        addTagCalls.push({ contactId, tag });
      },
      getTrustedBookingIdentity: async () => identity,
    },
  };
}

test("returns booking redirect data and preserves the ob-form-ok tag side effect", async () => {
  const { addTagCalls, deps } = createDeps({
    firstName: "Ada",
    email: "ada@example.com",
  });

  const result = await finalizeOnboardingSubmission(
    {
      contactId: "contact-1",
      patronProContactId: "pp-contact-1",
      token: "token-1",
    },
    deps
  );

  expect(addTagCalls).toEqual([
    { contactId: "pp-contact-1", tag: ONBOARDING_COMPLETION_TAG },
  ]);
  expect(result).toEqual({
    success: true,
    redirectUrl: `${BOOKING_WIDGET_URL}?first_name=Ada&email=ada%40example.com`,
    prefillKeys: ["first_name", "email"],
  });
});

test("omits missing prefill params while still returning the booking redirect", async () => {
  const { deps } = createDeps({
    lastName: "Lovelace",
  });

  const result = await finalizeOnboardingSubmission(
    {
      contactId: "contact-1",
      patronProContactId: "pp-contact-1",
      token: "token-1",
    },
    deps
  );

  expect(result).toEqual({
    success: true,
    redirectUrl: `${BOOKING_WIDGET_URL}?last_name=Lovelace`,
    prefillKeys: ["last_name"],
  });
});

test("falls back to the plain booking URL when trusted identity is empty", async () => {
  const { deps } = createDeps();

  const result = await finalizeOnboardingSubmission(
    {
      contactId: "contact-1",
      patronProContactId: "pp-contact-1",
      token: "token-1",
    },
    deps
  );

  expect(result).toEqual({
    success: true,
    redirectUrl: BOOKING_WIDGET_URL,
    prefillKeys: [],
  });
});

test("returns an error response when onboarding finalization fails", async () => {
  const response = await buildOnboardingFinalizeResponse(
    {
      contactId: "contact-1",
      patronProContactId: "pp-contact-1",
      token: "token-1",
    },
    {
      addTagToPatronProContact: async () => {
        throw new Error("tag failed");
      },
      getTrustedBookingIdentity: async () => ({
        firstName: "Ada",
      }),
    }
  );

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({
    error: "No se pudo completar la finalización del onboarding",
  });
});

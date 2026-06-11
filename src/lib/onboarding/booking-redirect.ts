import type { GhlContactIdentity } from "@/lib/ghl/contacts";

export const BOOKING_WIDGET_URL =
  "https://api.getpatronpro.com/widget/booking/D7x8ts5xcdNOWnd6Pjlq";

export const ONBOARDING_COMPLETION_TAG = "ob-form-ok";

export type BookingPrefillKey = "first_name" | "last_name" | "email";

export type BookingPrefillIdentity = Partial<
  Pick<GhlContactIdentity, "firstName" | "lastName" | "email">
>;

export interface BookingRedirectResult {
  redirectUrl: string;
  prefillKeys: BookingPrefillKey[];
}

export interface OnboardingSubmitResponse extends BookingRedirectResult {
  success: true;
}

function readPrefillValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildBookingRedirect(
  identity: BookingPrefillIdentity
): BookingRedirectResult {
  const params = new URLSearchParams();
  const prefillKeys: BookingPrefillKey[] = [];

  const mappings: Array<[BookingPrefillKey, string | undefined]> = [
    ["first_name", readPrefillValue(identity.firstName)],
    ["last_name", readPrefillValue(identity.lastName)],
    ["email", readPrefillValue(identity.email)],
  ];

  for (const [key, value] of mappings) {
    if (!value) continue;
    params.set(key, value);
    prefillKeys.push(key);
  }

  const query = params.toString();

  return {
    redirectUrl: query ? `${BOOKING_WIDGET_URL}?${query}` : BOOKING_WIDGET_URL,
    prefillKeys,
  };
}

export function buildOnboardingSubmitResponse(
  identity: BookingPrefillIdentity
): OnboardingSubmitResponse {
  const { redirectUrl, prefillKeys } = buildBookingRedirect(identity);

  return {
    success: true,
    redirectUrl,
    prefillKeys,
  };
}

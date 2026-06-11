import type { OnboardingSubmitResponse } from "./booking-redirect";

type OnboardingClientFlowPayload = Partial<
  Pick<OnboardingSubmitResponse, "success" | "redirectUrl" | "prefillKeys">
>;

export function startBookingRedirect(
  redirectUrl: string | undefined,
  assign: (url: string) => void
): boolean {
  const trimmedUrl = redirectUrl?.trim();

  if (!trimmedUrl) {
    return false;
  }

  try {
    assign(trimmedUrl);
    return true;
  } catch {
    return false;
  }
}

export function finishOnboardingClientFlow(
  response: OnboardingClientFlowPayload,
  assign: (url: string) => void
): "redirected" | "fallback" {
  return startBookingRedirect(response.redirectUrl, assign)
    ? "redirected"
    : "fallback";
}

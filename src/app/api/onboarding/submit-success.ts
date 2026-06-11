import type { GhlContactIdentity } from "@/lib/ghl/contacts";
import {
  buildOnboardingSubmitResponse,
  ONBOARDING_COMPLETION_TAG,
  type OnboardingSubmitResponse,
} from "@/lib/onboarding/booking-redirect";

export interface FinalizeOnboardingSubmissionInput {
  contactId: string;
  patronProContactId: string;
  token: string;
}

export interface FinalizeOnboardingSubmissionDeps {
  addTagToPatronProContact: (contactId: string, tag: string) => Promise<void>;
  getTrustedBookingIdentity: (
    contactId: string,
    patronProContactId: string,
    token: string
  ) => Promise<GhlContactIdentity>;
}

export async function finalizeOnboardingSubmission(
  input: FinalizeOnboardingSubmissionInput,
  deps: FinalizeOnboardingSubmissionDeps
): Promise<OnboardingSubmitResponse> {
  await deps.addTagToPatronProContact(
    input.patronProContactId,
    ONBOARDING_COMPLETION_TAG
  );

  const trustedIdentity = await deps.getTrustedBookingIdentity(
    input.contactId,
    input.patronProContactId,
    input.token
  );

  return buildOnboardingSubmitResponse(trustedIdentity);
}

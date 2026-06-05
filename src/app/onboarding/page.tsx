import InvalidLink from "./_components/InvalidLink";
import OnboardingForm from "./_components/OnboardingForm";
import { verifyOnboardingLinkSignature } from "@/lib/onboarding/link-signature";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string; contactId?: string; ppContactId?: string; expiresAt?: string; sig?: string }>;
}) {
  const { locationId, contactId, ppContactId, expiresAt, sig } = await searchParams;

  if (!locationId || !contactId || !ppContactId || !expiresAt || !sig) {
    return <InvalidLink />;
  }

  if (!verifyOnboardingLinkSignature({ locationId, contactId, patronProContactId: ppContactId, expiresAt }, sig)) {
    return <InvalidLink />;
  }

  return (
    <OnboardingForm
      locationId={locationId}
      contactId={contactId}
      patronProContactId={ppContactId}
      expiresAt={expiresAt}
      onboardingSig={sig}
    />
  );
}

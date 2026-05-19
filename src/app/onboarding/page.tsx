import InvalidLink from "./_components/InvalidLink";
import OnboardingForm from "./_components/OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string; contactId?: string }>;
}) {
  const { locationId, contactId } = await searchParams;

  if (!locationId || !contactId) {
    return <InvalidLink />;
  }

  return <OnboardingForm locationId={locationId} contactId={contactId} />;
}

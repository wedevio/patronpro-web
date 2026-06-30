import OnboardingInvitePanel from "./_components/OnboardingInvitePanel";
import { DEFAULT_ONBOARDING_INVITE_FORM } from "@/lib/onboarding/invite-preview";

export const dynamic = "force-dynamic";

export default function OnboardingInvitesPage() {
  return <OnboardingInvitePanel defaultForm={DEFAULT_ONBOARDING_INVITE_FORM} />;
}

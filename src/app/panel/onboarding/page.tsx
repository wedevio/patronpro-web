import { getAllSubmissions, defaultChecklist, type PanelSubmission } from "@/lib/panel/store";
import { enrichLocations, getAllGHLLocations, type GHLLocationData } from "@/lib/panel/ghl-enrich";
import PanelClient, { type EnrichedAccount } from "../_components/PanelClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  let submissions: PanelSubmission[] = [];
  try {
    submissions = await getAllSubmissions();
  } catch (err) {
    console.error("[OnboardingPage] getAllSubmissions failed:", err);
  }

  const ghlLocations = await getAllGHLLocations();

  const submissionMap = new Map(submissions.map((s) => [s.locationId, s]));
  const ghlIds = ghlLocations.map((l) => l.locationId).filter(Boolean);
  const submissionIds = submissions.map((s) => s.locationId);
  const allIds = Array.from(new Set([...submissionIds, ...ghlIds]));

  const emailMap = new Map<string, string>();
  for (const loc of ghlLocations) {
    if (loc.email) emailMap.set(loc.locationId, loc.email);
  }
  for (const sub of submissions) {
    if (sub.email) emailMap.set(sub.locationId, sub.email);
  }

  let enriched = new Map<string, GHLLocationData>();
  try {
    enriched = await enrichLocations(allIds, emailMap);
  } catch (err) {
    console.error("[OnboardingPage] enrichLocations failed:", err);
  }

  const ghlMap = new Map(ghlLocations.map((l) => [l.locationId, l]));

  const accounts: EnrichedAccount[] = allIds.map((locationId) => {
    const submission = submissionMap.get(locationId) ?? null;
    const ghlRich = enriched.get(locationId);
    const ghlBasic = ghlMap.get(locationId);

    const ghl: GHLLocationData = ghlRich ?? {
      locationId,
      name:            ghlBasic?.name ?? submission?.businessName ?? "",
      address:         ghlBasic?.website ?? "",
      phone:           ghlBasic?.phone ?? submission?.phone ?? "",
      email:           ghlBasic?.email ?? submission?.email ?? "",
      website:         ghlBasic?.website ?? submission?.domain ?? "",
      createdAt:       ghlBasic?.createdAt ?? submission?.submittedAt ?? "",
      planName:        "—",
      planStatus:      "—",
      mrr:             0,
      phoneNumbers:      [],
      stripeConnected:   false,
      twilioActive:      false,
      customDomain:      "",
      workflowsCount:    0,
      smsSent:           false,
      appointmentDate:   "",
    };

    if (!submission) {
      const minimal: PanelSubmission = {
        locationId,
        contactId:          "",
        submittedAt:        ghl.createdAt,
        businessName:       ghl.name,
        legalName:          "",
        email:              ghl.email,
        phone:              ghl.phone,
        address:            ghl.address,
        city:               "",
        state:              "",
        zip:                "",
        country:            "",
        ein:                "",
        domain:             ghl.website,
        domainType:         "none",
        domainRegistrar:    "",
        primaryColor:       "",
        secondaryColor:     "",
        complementaryColor: "",
        letUsChooseColors:  false,
        logoUrl:            "",
        checklist:          { ...defaultChecklist(), form: false },
      };
      return { locationId, submission: minimal, ghl };
    }

    return { locationId, submission, ghl };
  });

  accounts.sort((a, b) => {
    const aHasForm = a.submission?.checklist.form ?? false;
    const bHasForm = b.submission?.checklist.form ?? false;
    if (aHasForm !== bHasForm) return aHasForm ? -1 : 1;
    const aDate = a.submission?.submittedAt ?? "";
    const bDate = b.submission?.submittedAt ?? "";
    return bDate.localeCompare(aDate);
  });

  return <PanelClient accounts={accounts} />;
}

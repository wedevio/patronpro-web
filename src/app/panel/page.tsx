import { getAllSubmissions, defaultChecklist, type PanelSubmission } from "@/lib/panel/store";
import { enrichLocations, getAllGHLLocations, type GHLLocationData } from "@/lib/panel/ghl-enrich";
import PanelClient, { type EnrichedAccount } from "./_components/PanelClient";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  // 1. Get Redis submissions
  let submissions: PanelSubmission[] = [];
  try {
    submissions = await getAllSubmissions();
  } catch (err) {
    console.error("[PanelPage] getAllSubmissions failed:", err);
  }

  // 2. Get all GHL sub-accounts
  const ghlLocations = await getAllGHLLocations();

  // 3. Build full set of locationIds (union of both sources)
  const submissionMap = new Map(submissions.map((s) => [s.locationId, s]));
  const ghlIds = ghlLocations.map((l) => l.locationId).filter(Boolean);
  const submissionIds = submissions.map((s) => s.locationId);

  // All unique locationIds
  const allIds = Array.from(new Set([...submissionIds, ...ghlIds]));

  // 4. Build email map for PatronPro signal lookups
  const emailMap = new Map<string, string>();
  for (const loc of ghlLocations) {
    if (loc.email) emailMap.set(loc.locationId, loc.email);
  }
  for (const sub of submissions) {
    if (sub.email) emailMap.set(sub.locationId, sub.email);
  }

  // 5. Enrich all with GHL data
  let enriched = new Map<string, GHLLocationData>();
  try {
    enriched = await enrichLocations(allIds, emailMap);
  } catch (err) {
    console.error("[PanelPage] enrichLocations failed:", err);
  }

  // 5. Build GHL fallback map from getAllGHLLocations results
  const ghlMap = new Map(ghlLocations.map((l) => [l.locationId, l]));

  // 6. Merge: for each unique locationId, build EnrichedAccount
  const accounts: EnrichedAccount[] = allIds.map((locationId) => {
    const submission = submissionMap.get(locationId) ?? null;
    const ghlRich = enriched.get(locationId);
    const ghlBasic = ghlMap.get(locationId);

    // Build GHLLocationData — prefer enriched, fallback to basic GHL data
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
      appointmentBooked: false,
    };

    // If no Redis submission, build a minimal one from GHL data
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

  // Sort: Redis submissions (form=true) first, then by submittedAt desc
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

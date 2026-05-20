import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/panel/store";
import { updateChecklist } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const accounts = [
    {
      locationId:   "loc_test_001",
      contactId:    "cnt_test_001",
      businessName: "Rodriguez Roofing LLC",
      email:        "carlos@rodriguezroofing.com",
      phone:        "+1 (305) 555-0192",
      domain:       "rodriguezroofing.com",
    },
    {
      locationId:   "loc_test_002",
      contactId:    "cnt_test_002",
      businessName: "Gutierrez Construction",
      email:        "miguel@gutierrezconstruction.com",
      phone:        "+1 (786) 555-0348",
      domain:       "gutierrezconstruction.com",
    },
    {
      locationId:   "loc_test_003",
      contactId:    "cnt_test_003",
      businessName: "Hernandez Plumbing & HVAC",
      email:        "jose@hernandezplumbing.com",
      phone:        "+1 (954) 555-0471",
      domain:       "por definir",
    },
  ];

  for (const acc of accounts) {
    await saveSubmission(acc);
  }

  // Mark some checklist items for the first account (almost complete)
  for (const item of ["form", "domain", "phone", "email", "landing", "calendar"] as const) {
    await updateChecklist("loc_test_001", item, true);
  }

  // Mark a couple for the second account
  for (const item of ["form", "domain"] as const) {
    await updateChecklist("loc_test_002", item, true);
  }

  // Third account: only form (auto-checked)

  return NextResponse.json({ ok: true, seeded: accounts.length });
}

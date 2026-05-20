import { NextResponse } from "next/server";
import { getLocationAccessToken, getAgencyAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";

async function gh(path: string, token: string, version = "2021-07-28") {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: version,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 1000) };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId)
    return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const [loc, agency] = await Promise.all([
    getLocationAccessToken(locationId),
    getAgencyAccessToken(),
  ]);

  // Step 1: get companyId from location (increase slice to avoid truncation)
  const locationRaw = await fetch(`${BASE}/locations/${locationId}`, {
    headers: { Authorization: `Bearer ${loc}`, Version: "2021-07-28" },
  });
  const locationJson = await locationRaw.json();
  const companyId: string | null = locationJson?.location?.companyId ?? locationJson?.companyId ?? null;

  const results: Record<string, unknown> = { companyId };

  if (companyId) {
    const cases: { label: string; path: string; token: string }[] = [
      { label: "users-by-company-loc",    path: `/users/search?companyId=${companyId}&locationId=${locationId}`, token: loc },
      { label: "users-by-company-agency", path: `/users/search?companyId=${companyId}&locationId=${locationId}`, token: agency },
    ];
    for (const c of cases) {
      results[c.label] = await gh(c.path, c.token);
    }
  } else {
    results["error"] = "Could not extract companyId from location";
  }

  return NextResponse.json(results, { status: 200 });
}

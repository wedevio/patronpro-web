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

  // Step 1: get companyId from location
  const locationRes = await gh(`/locations/${locationId}`, loc);
  let companyId: string | null = null;
  try {
    const parsed = JSON.parse(locationRes.body);
    companyId = parsed?.location?.companyId ?? parsed?.companyId ?? null;
  } catch {}

  const results: Record<string, unknown> = { locationRes, companyId };

  if (companyId) {
    const cases: { label: string; path: string; token: string }[] = [
      { label: "users-by-company-loc",    path: `/users/search?companyId=${companyId}&locationId=${locationId}`, token: loc },
      { label: "users-by-company-agency", path: `/users/search?companyId=${companyId}&locationId=${locationId}`, token: agency },
    ];
    for (const c of cases) {
      results[c.label] = await gh(c.path, c.token);
    }
  }

  return NextResponse.json(results, { status: 200 });
}

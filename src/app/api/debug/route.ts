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
    const res = await fetch(`${BASE}/users/search?companyId=${companyId}&locationId=${locationId}`, {
      headers: { Authorization: `Bearer ${loc}`, Version: "2021-07-28" },
    });
    const json = await res.json();
    // Return full permissions object for each user
    results["users"] = json?.users?.map((u: Record<string, unknown>) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      permissions: u.permissions,
      roles: u.roles,
    }));
  } else {
    results["error"] = "Could not extract companyId from location";
  }

  return NextResponse.json(results, { status: 200 });
}

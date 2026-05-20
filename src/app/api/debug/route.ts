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

  const cases: { label: string; path: string; token: string }[] = [
    { label: "users-search-loc",       path: `/users/search?locationId=${locationId}`,  token: loc },
    { label: "users-search-agency",    path: `/users/search?locationId=${locationId}`,  token: agency },
    { label: "users-search-no-filter", path: `/users/search`,                           token: loc },
  ];

  const results: Record<string, unknown> = {};
  for (const c of cases) {
    results[c.label] = await gh(c.path, c.token);
  }

  return NextResponse.json(results, { status: 200 });
}

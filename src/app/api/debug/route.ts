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
  return { status: res.status, body: text.slice(0, 500) };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  const areaCode = searchParams.get("areaCode") ?? "210";
  if (!locationId)
    return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const [loc, agency] = await Promise.all([
    getLocationAccessToken(locationId),
    getAgencyAccessToken(),
  ]);

  const cases: { label: string; path: string; token: string; version?: string }[] = [
    // plural vs singular
    { label: "plural-search-loc",    path: `/phone-numbers/search?locationId=${locationId}&areaCode=${areaCode}&limit=3`, token: loc },
    { label: "singular-search-loc",  path: `/phone-number/search?locationId=${locationId}&areaCode=${areaCode}&limit=3`,  token: loc },
    { label: "plural-search-agency", path: `/phone-numbers/search?locationId=${locationId}&areaCode=${areaCode}&limit=3`, token: agency },
    // nested under location
    { label: "nested-loc",           path: `/locations/${locationId}/phone-numbers`,                                       token: loc },
    { label: "nested-search-loc",    path: `/locations/${locationId}/phone-numbers/search?areaCode=${areaCode}`,           token: loc },
    // older version header
    { label: "v2-plural-loc",        path: `/phone-numbers/search?locationId=${locationId}&areaCode=${areaCode}&limit=3`, token: loc,    version: "2021-04-15" },
    { label: "v2-singular-loc",      path: `/phone-number/search?locationId=${locationId}&areaCode=${areaCode}&limit=3`,  token: loc,    version: "2021-04-15" },
    // LC Phone (alternate base path)
    { label: "lc-phone-search",      path: `/lc-phone/search?locationId=${locationId}&areaCode=${areaCode}`,              token: loc },
    { label: "twilio-search",        path: `/twilio/numbers/search?locationId=${locationId}&areaCode=${areaCode}`,        token: loc },
    // list existing numbers
    { label: "list-existing-loc",    path: `/phone-numbers?locationId=${locationId}`,                                     token: loc },
    { label: "list-existing-agency", path: `/phone-numbers?locationId=${locationId}`,                                     token: agency },
  ];

  const results: Record<string, unknown> = {};
  for (const c of cases) {
    results[c.label] = await gh(c.path, c.token, c.version);
  }

  return NextResponse.json(results, { status: 200 });
}

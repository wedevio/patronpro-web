import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";

async function gh(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 600) };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  const areaCode = searchParams.get("areaCode") ?? "210";
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const token = await getLocationAccessToken(locationId);

  // 1. Search available numbers for area code
  const search = await gh(
    `/phone-number/search?locationId=${locationId}&areaCode=${areaCode}&limit=5`,
    token
  );

  // 2. Also try listing numbers already on the location
  const existing = await gh(`/phone-number?locationId=${locationId}`, token);

  return NextResponse.json({ search, existing });
}

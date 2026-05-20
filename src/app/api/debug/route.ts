import { NextResponse } from "next/server";
import { getAgencyAccessToken, getLocationAccessToken } from "@/lib/ghl/oauth";

const BASE = "https://services.leadconnectorhq.com";

async function ghFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return { status: res.status, body: (await res.text()).slice(0, 400) };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  const companyId = process.env.GHL_COMPANY_ID ?? "";
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const [agencyToken, locationToken] = await Promise.all([
    getAgencyAccessToken(),
    getLocationAccessToken(locationId),
  ]);

  // 1. Try listing brand boards multiple ways
  const list1 = await ghFetch(`/brand-boards?locationId=${locationId}`, locationToken);
  const list2 = await ghFetch(`/brand-boards?locationId=${locationId}`, agencyToken);
  const list3 = await ghFetch(`/brand-boards?companyId=${companyId}`, agencyToken);

  // 2. Try creating a brand board for the location
  const createRes = await ghFetch(`/brand-boards`, locationToken, {
    method: "POST",
    body: JSON.stringify({
      locationId,
      name: "Default",
      colors: [
        { id: "grey", value: "#1E2C46", name: "Main" },
        { id: "new_color_1", value: "#F67D0A", name: "Accent" },
        { id: "new_color_2", value: "#FFFFFF", name: "Complementary" },
      ],
    }),
  });

  return NextResponse.json({ list1, list2, list3, createAttempt: createRes });
}

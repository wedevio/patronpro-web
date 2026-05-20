import { NextResponse } from "next/server";
import { getAgencyAccessToken, getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const [agencyToken, locationToken] = await Promise.all([
    getAgencyAccessToken(),
    getLocationAccessToken(locationId),
  ]);

  // Try brand board paths with BOTH tokens
  const paths = [
    `/brand-boards?locationId=${locationId}`,
    `/brand-boards`,
  ];

  const results: Record<string, unknown> = {};

  for (const path of paths) {
    const [r1, r2] = await Promise.all([
      fetch(`https://services.leadconnectorhq.com${path}`, {
        headers: { Authorization: `Bearer ${agencyToken}`, Version: "2021-07-28" },
      }),
      fetch(`https://services.leadconnectorhq.com${path}`, {
        headers: { Authorization: `Bearer ${locationToken}`, Version: "2021-07-28" },
      }),
    ]);
    results[path] = {
      agencyToken: { status: r1.status, body: (await r1.text()).slice(0, 300) },
      locationToken: { status: r2.status, body: (await r2.text()).slice(0, 300) },
    };
  }

  // Also confirm custom values are still good
  const cvRes = await ghlFetch(`/locations/${locationId}/customValues`, { method: "GET", token: locationToken });
  const cv = cvRes.ok ? (await cvRes.json() as { customValues: Array<{ name: string; value?: string }> }).customValues.map(v => ({ name: v.name, value: v.value ?? "(empty)" })) : null;

  return NextResponse.json({ brandBoardTests: results, customValues: cv });
}

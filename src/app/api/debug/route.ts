import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

// Temporary debug endpoint — remove after testing
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const token = await getLocationAccessToken(locationId);

  const [cvRes, bbRes] = await Promise.all([
    ghlFetch(`/locations/${locationId}/customValues`, { method: "GET", token }),
    ghlFetch(`/brand-boards?locationId=${locationId}`, { method: "GET", token }),
  ]);

  const customValues = cvRes.ok ? await cvRes.json() : { error: cvRes.status, body: await cvRes.text() };
  const brandBoards = bbRes.ok ? await bbRes.json() : { error: bbRes.status, body: await bbRes.text() };

  return NextResponse.json({ customValues, brandBoards });
}

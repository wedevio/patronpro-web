import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

// Temporary debug endpoint — remove after testing
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const token = await getLocationAccessToken(locationId);

  const [cvRes, bbRes1, bbRes2] = await Promise.all([
    ghlFetch(`/locations/${locationId}/customValues`, { method: "GET", token }),
    ghlFetch(`/brand-boards?locationId=${locationId}`, { method: "GET", token }),
    ghlFetch(`/locations/${locationId}/brand-boards`, { method: "GET", token }),
  ]);

  const customValues = cvRes.ok ? await cvRes.json() : { error: cvRes.status, body: await cvRes.text() };
  const brandBoards1 = bbRes1.ok ? await bbRes1.json() : { error: bbRes1.status, path: `/brand-boards?locationId=` };
  const brandBoards2 = bbRes2.ok ? await bbRes2.json() : { error: bbRes2.status, path: `/locations/{id}/brand-boards` };

  return NextResponse.json({ customValues, brandBoards1, brandBoards2 });
}

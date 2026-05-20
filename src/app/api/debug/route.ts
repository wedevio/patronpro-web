import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const token = await getLocationAccessToken(locationId);

  // Try all possible brand board paths
  const paths = [
    `/brand-boards?locationId=${locationId}`,
    `/locations/${locationId}/brand-boards`,
    `/brand-boards/${locationId}`,
    `/marketing/brand-boards?locationId=${locationId}`,
    `/locations/${locationId}/marketing/brand-boards`,
  ];

  const bbResults: Record<string, unknown> = {};
  for (const path of paths) {
    const res = await ghlFetch(path, { method: "GET", token });
    const body = await res.text();
    bbResults[path] = { status: res.status, body: body.slice(0, 200) };
  }

  // Also check custom values
  const cvRes = await ghlFetch(`/locations/${locationId}/customValues`, { method: "GET", token });
  const cvData = cvRes.ok
    ? (await cvRes.json()) as { customValues?: Array<{ name: string; fieldKey: string; value?: string }> }
    : null;

  return NextResponse.json({
    customValues: cvData?.customValues?.map((v) => ({
      name: v.name,
      fieldKey: v.fieldKey,
      value: v.value ?? "(empty)",
    })),
    brandBoardPaths: bbResults,
  });
}

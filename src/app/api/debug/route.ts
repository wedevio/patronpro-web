import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const token = await getLocationAccessToken(locationId);

  // 1. GET custom values
  const cvRes = await ghlFetch(`/locations/${locationId}/customValues`, { method: "GET", token });
  const cvData = cvRes.ok
    ? (await cvRes.json()) as { customValues?: Array<{ id: string; name: string; fieldKey: string; value?: string }> }
    : null;

  const values = cvData?.customValues ?? [];

  // 2. Try a direct PUT on company_name to verify PUT works
  const companyNameEntry = values.find((v) => v.fieldKey.includes("company_name"));
  let putResult: unknown = "company_name entry not found";
  if (companyNameEntry) {
    const putRes = await ghlFetch(
      `/locations/${locationId}/customValues/${companyNameEntry.id}`,
      { method: "PUT", token, body: JSON.stringify({ value: "DEBUG_TEST_" + Date.now() }) }
    );
    putResult = {
      status: putRes.status,
      body: await putRes.text(),
    };
  }

  // 3. Check brand board paths
  const [bb1, bb2] = await Promise.all([
    ghlFetch(`/brand-boards?locationId=${locationId}`, { method: "GET", token }),
    ghlFetch(`/locations/${locationId}/brand-boards`, { method: "GET", token }),
  ]);

  return NextResponse.json({
    fieldKeys: values.map((v) => ({ name: v.name, fieldKey: v.fieldKey, hasValue: !!v.value })),
    putCompanyName: putResult,
    brandBoard1: { status: bb1.status, body: await bb1.text() },
    brandBoard2: { status: bb2.status, body: await bb2.text() },
  });
}

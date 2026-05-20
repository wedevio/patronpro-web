import { NextResponse } from "next/server";
import { getAgencyAccessToken } from "@/lib/ghl/oauth";

// TEMPORARY — remove after debugging
export async function GET() {
  try {
    const token = await getAgencyAccessToken();
    const res = await fetch(
      `https://services.leadconnectorhq.com/locations/search?companyId=${process.env.GHL_COMPANY_ID}&limit=5`,
      { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" } }
    );
    const body = await res.json();
    return NextResponse.json({ status: res.status, tokenPrefix: token.slice(0, 20), body });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

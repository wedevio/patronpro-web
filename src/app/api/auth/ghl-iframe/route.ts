import { NextResponse } from "next/server";
import { getAgencyAccessToken } from "@/lib/ghl/oauth";
import { signSupportSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

async function resolveContactFromUser(
  userId: string,
  locationId: string,
  agencyToken: string
): Promise<{ contactId: string | null; userName: string | null }> {
  try {
    // 1. Get GHL user info (name + email)
    const userRes = await fetch(
      `https://services.leadconnectorhq.com/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );
    if (!userRes.ok) return { contactId: null, userName: null };
    const userData = (await userRes.json()) as { name?: string; email?: string };
    const email = userData.email ?? null;
    const userName = userData.name ?? null;

    if (!email) return { contactId: null, userName };

    // 2. Search contact by email in the location
    const searchRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/search?locationId=${locationId}&email=${encodeURIComponent(email)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );
    if (!searchRes.ok) return { contactId: null, userName };
    const searchData = (await searchRes.json()) as { contacts?: { id: string }[] };
    const contactId = searchData.contacts?.[0]?.id ?? null;

    return { contactId, userName };
  } catch {
    return { contactId: null, userName: null };
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { location_id?: string; user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { location_id, user_id } = body;

  if (!location_id) {
    return NextResponse.json({ error: "Missing location_id" }, { status: 400 });
  }

  let agencyToken: string;
  try {
    agencyToken = await getAgencyAccessToken();
  } catch (err) {
    console.error("[ghl-iframe] Failed to get agency token", err);
    return NextResponse.json({ error: "GHL service unavailable" }, { status: 502 });
  }

  // Verify this location belongs to our company
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/locations/${location_id}`,
      {
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("[ghl-iframe] GHL location fetch failed", res.status, text);
      return NextResponse.json({ error: "GHL service unavailable" }, { status: 502 });
    }
    const data = (await res.json()) as { location: { companyId: string } };
    if (data.location.companyId !== process.env.GHL_COMPANY_ID) {
      return NextResponse.json({ error: "Forbidden: wrong company" }, { status: 403 });
    }
  } catch (err) {
    console.error("[ghl-iframe] GHL location fetch error", err);
    return NextResponse.json({ error: "GHL service unavailable" }, { status: 502 });
  }

  // Resolve contact from GHL user ID
  let contactId: string | undefined;
  let userName: string | undefined;
  if (user_id) {
    const resolved = await resolveContactFromUser(user_id, location_id, agencyToken);
    contactId = resolved.contactId ?? undefined;
    userName = resolved.userName ?? undefined;
  }

  const token = await signSupportSession({
    locationId: location_id,
    contactId,
    userName,
  });

  const response = NextResponse.json({ success: true, locationId: location_id, userName: userName ?? null });
  response.cookies.set("support-session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 28800,
  });

  return response;
}

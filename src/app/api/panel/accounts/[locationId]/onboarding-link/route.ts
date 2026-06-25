import { NextResponse } from "next/server";
import { requirePpSession } from "@/lib/auth/require-session";
import { getAllGHLLocations } from "@/lib/panel/ghl-enrich";
import { getStoredOnboardingLink, onboardingLinkIsActive, saveOnboardingLink } from "@/lib/panel/store";
import { buildOnboardingLink } from "@/lib/onboarding/invite";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  try {
    const auth = await requirePpSession();
    if (auth instanceof NextResponse) return auth;

    const { locationId } = await params;
    if (!locationId) {
      return NextResponse.json({ error: "Falta locationId" }, { status: 400 });
    }

    const stored = await getStoredOnboardingLink(locationId);
    if (stored && onboardingLinkIsActive(stored.expiresAt)) {
      return NextResponse.json({
        success: true,
        status: "existing",
        link: stored.link,
        expiresAt: stored.expiresAt,
        generatedAt: stored.generatedAt,
      });
    }

    const locations = await getAllGHLLocations();
    const location = locations.find((item) => item.locationId === locationId);

    if (!location) {
      return NextResponse.json({ error: "No se encontró la cuenta en GHL" }, { status: 404 });
    }

    const payload = await request.json().catch(() => ({})) as {
      email?: string;
      phone?: string;
      businessName?: string;
      firstName?: string;
    };

    const email = (payload.email ?? location.email ?? "").toLowerCase().trim();
    if (!email) {
      return NextResponse.json(
        { error: "La cuenta no tiene email disponible, así que no se puede generar el link." },
        { status: 400 }
      );
    }

    const result = await buildOnboardingLink({
      locationId,
      email,
      phone: payload.phone ?? location.phone,
      businessName: payload.businessName ?? location.name,
      firstName: payload.firstName,
    });

    await saveOnboardingLink(locationId, result.onboardingLink, result.expiresAt);

    return NextResponse.json({
      success: true,
      status: "generated",
      link: result.onboardingLink,
      expiresAt: result.expiresAt,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/panel/accounts/[locationId]/onboarding-link]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncCustomValues } from "@/lib/ghl/custom-values";
import { uploadMedia } from "@/lib/ghl/media";
import { updateBrandColors } from "@/lib/ghl/brand-board";
import { notifyOnboarder } from "@/lib/ghl/notifications";
import type { OnboardingFormData } from "@/lib/onboarding/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const fd = await request.formData();

    const locationId = fd.get("locationId") as string | null;
    const contactId = fd.get("contactId") as string | null;

    if (!locationId || !contactId) {
      return NextResponse.json(
        { error: "locationId y contactId son requeridos" },
        { status: 400 }
      );
    }

    // --- Extract fields ---
    const data: Partial<OnboardingFormData> = {
      businessName: (fd.get("businessName") as string) ?? "",
      legalName: (fd.get("legalName") as string) ?? "",
      address: (fd.get("address") as string) ?? "",
      city: (fd.get("city") as string) ?? "",
      state: (fd.get("state") as string) ?? "",
      zip: (fd.get("zip") as string) ?? "",
      country: (fd.get("country") as string) ?? "US",
      website: (fd.get("website") as string) ?? "",
      phone: (fd.get("phone") as string) ?? "",
      email: (fd.get("email") as string) ?? "",
      ein: (fd.get("ein") as string) ?? undefined,
      primaryColor: (fd.get("primaryColor") as string) ?? "",
      secondaryColor: (fd.get("secondaryColor") as string) ?? "",
      letUsChooseColors: fd.get("letUsChooseColors") === "true",
      hasDomain: fd.get("hasDomain") === "true",
      existingDomain: (fd.get("existingDomain") as string) ?? undefined,
      wantNewDomain: fd.get("wantNewDomain") === "true",
      desiredDomain: (fd.get("desiredDomain") as string) ?? undefined,
      domainRegistrar: (fd.get("domainRegistrar") as string) ?? undefined,
    };

    // Validate required fields
    if (!data.businessName || !data.phone || !data.email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const token = env.ghlLocationToken;

    // --- Upload logo if present ---
    let logoUrl: string | undefined;
    const logoFile = fd.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      const uploaded = await uploadMedia(locationId, logoFile, token);
      logoUrl = uploaded ?? undefined;
    }

    // --- Sync custom values ---
    await syncCustomValues(locationId, { ...data, logoUrl }, token);

    // --- Non-blocking: brand colors ---
    if (!data.letUsChooseColors && data.primaryColor) {
      void updateBrandColors(
        locationId,
        data.primaryColor,
        data.secondaryColor ?? "",
        token
      );
    }

    // --- Non-blocking: notify ---
    const summary = `✅ Onboarding completado para ${data.businessName}.\nNegocio: ${data.businessName}\nEmail: ${data.email}\nTeléfono: ${data.phone}\nDominio: ${data.hasDomain ? data.existingDomain : data.desiredDomain ?? "por definir"}`;
    void notifyOnboarder(locationId, contactId, summary, token);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/onboarding]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 502 }
    );
  }
}

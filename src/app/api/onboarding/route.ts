import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { syncCustomValues } from "@/lib/ghl/custom-values";
import { uploadMedia } from "@/lib/ghl/media";
import { updateBrandColors } from "@/lib/ghl/brand-board";
import { notifyOnboarder } from "@/lib/ghl/notifications";
import { applyDefaultStaffPermissions } from "@/lib/ghl/users";
import type { OnboardingFormData, HoursOfOperation } from "@/lib/onboarding/types";

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

    // Parse hours of operation if present
    let hoursOfOperation: HoursOfOperation | undefined;
    const hoursRaw = fd.get("hoursOfOperation") as string | null;
    if (hoursRaw) {
      try {
        hoursOfOperation = JSON.parse(hoursRaw) as HoursOfOperation;
      } catch {
        // ignore parse error
      }
    }

    const data: Partial<OnboardingFormData> = {
      businessName: (fd.get("businessName") as string) ?? "",
      legalName: (fd.get("legalName") as string) ?? "",
      address: (fd.get("address") as string) ?? "",
      city: (fd.get("city") as string) ?? "",
      state: (fd.get("state") as string) ?? "",
      zip: (fd.get("zip") as string) ?? "",
      country: (fd.get("country") as string) ?? "US",
      phone: (fd.get("phone") as string) ?? "",
      email: (fd.get("email") as string) ?? "",
      ein: (fd.get("ein") as string) ?? undefined,
      primaryColor: (fd.get("primaryColor") as string) ?? "",
      secondaryColor: (fd.get("secondaryColor") as string) ?? "",
      complementaryColor: (fd.get("complementaryColor") as string) ?? "",
      letUsChooseColors: fd.get("letUsChooseColors") === "true",
      hasDomain: fd.get("hasDomain") === "true",
      existingDomain: (fd.get("existingDomain") as string) ?? undefined,
      wantNewDomain: fd.get("wantNewDomain") === "true",
      desiredDomain: (fd.get("desiredDomain") as string) ?? undefined,
      domainRegistrar: (fd.get("domainRegistrar") as string) ?? undefined,
      authorizeDomainPurchase: fd.get("authorizeDomainPurchase") === "true",
      hoursOfOperation,
    };

    if (!data.businessName || !data.phone || !data.email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const token = await getLocationAccessToken(locationId);

    // --- Get companyId from location (needed for users API) ---
    let companyId: string | undefined;
    try {
      const locRes = await fetch(
        `https://services.leadconnectorhq.com/locations/${locationId}`,
        { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" } }
      );
      const locJson = await locRes.json();
      companyId = locJson?.location?.companyId ?? locJson?.companyId;
    } catch (err) {
      console.error("[onboarding] Failed to fetch location companyId:", err);
    }

    // --- Upload logo if present ---
    let logoUrl: string | undefined;
    const logoFile = fd.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      const uploaded = await uploadMedia(locationId, logoFile, token);
      logoUrl = uploaded ?? undefined;
    }

    // --- Sync custom values ---
    await syncCustomValues(locationId, { ...data, logoUrl }, token);

    // --- Apply default staff permissions ---
    if (companyId) {
      try {
        await applyDefaultStaffPermissions(locationId, companyId, token);
      } catch (err) {
        console.error("[onboarding] applyDefaultStaffPermissions failed:", err);
      }
    }

    // --- Brand colors — disabled until brand-board API path is confirmed ---
    // GHL returns 404 for both /brand-boards?locationId= and /locations/{id}/brand-boards
    // if (!data.letUsChooseColors && data.primaryColor) { ... }

    // --- Notify: note on contact with full summary ---
    const domain = data.hasDomain
      ? data.existingDomain
      : data.desiredDomain ?? "por definir";

    const colorLines = data.letUsChooseColors
      ? "Colores: PatronPro elige"
      : [
          `Color Principal (Main):       ${data.primaryColor ?? "-"}`,
          `Color Acento (Accent):        ${data.secondaryColor ?? "-"}`,
          `Color Complementario:         ${data.complementaryColor ?? "-"}`,
          `→ Configurar en: Marketing → Brand Boards → Global Colors`,
        ].join("\n");

    const summary = [
      `✅ Onboarding completado`,
      `Negocio:  ${data.businessName}`,
      `Email:    ${data.email}`,
      `Teléfono: ${data.phone}`,
      `Dominio:  ${domain}`,
      ``,
      colorLines,
    ].join("\n");

    try {
      await notifyOnboarder(locationId, contactId, summary, token);
    } catch (err) {
      console.error("[onboarding] notifyOnboarder failed:", err);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/onboarding]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 502 }
    );
  }
}

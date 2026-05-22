import { NextResponse } from "next/server";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { syncCustomValues } from "@/lib/ghl/custom-values";
import { uploadMedia } from "@/lib/ghl/media";
import { updateBrandColors } from "@/lib/ghl/brand-board";
import { notifyOnboarder } from "@/lib/ghl/notifications";
import { applyDefaultStaffPermissions } from "@/lib/ghl/users";
import { saveSubmission } from "@/lib/panel/store";
import { getAdminClient } from "@/lib/supabase/client";
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
      websiteTagline: (fd.get("websiteTagline") as string) ?? "",
      websiteServices: (() => {
        const raw = fd.get("websiteServices") as string | null;
        if (!raw) return [];
        try { return JSON.parse(raw) as string[]; } catch { return []; }
      })(),
    };

    if (!data.businessName) {
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
    let logoSquareUrl: string | undefined;

    const logoFile = fd.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      // Upload to GHL for custom values sync
      const ghlLogoUrl = await uploadMedia(locationId, logoFile, token);
      logoUrl = ghlLogoUrl ?? undefined;

      // Also upload to Supabase Storage for own copy
      try {
        const db = getAdminClient();
        const ext = logoFile.name.split(".").pop() ?? "png";
        const path = `logos/${locationId}/logo.${ext}`;
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const { error } = await db.storage
          .from("logos")
          .upload(path, buffer, {
            contentType: logoFile.type,
            upsert: true,
          });
        if (!error) {
          const { data: urlData } = db.storage.from("logos").getPublicUrl(path);
          logoUrl = urlData.publicUrl; // prefer Supabase URL
        }
      } catch (err) {
        console.error("[onboarding] Supabase logo upload failed:", err);
        // fallback to GHL URL already set above
      }
    }

    // --- Upload square logo (AI-generated) if present ---
    const logoSquareFile = fd.get("logoSquareFile");
    if (logoSquareFile instanceof File && logoSquareFile.size > 0) {
      try {
        const db = getAdminClient();
        const path = `logos/${locationId}/logo_square.png`;
        const buffer = Buffer.from(await logoSquareFile.arrayBuffer());
        const { error } = await db.storage
          .from("logos")
          .upload(path, buffer, {
            contentType: "image/png",
            upsert: true,
          });
        if (!error) {
          const { data: urlData } = db.storage.from("logos").getPublicUrl(path);
          logoSquareUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error("[onboarding] Supabase square logo upload failed:", err);
      }
    }

    // --- Sync custom values ---
    await syncCustomValues(locationId, { ...data, logoUrl, logoSquareUrl }, token);

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
      `Dominio:  ${domain}`,
      ``,
      colorLines,
    ].join("\n");

    try {
      await notifyOnboarder(locationId, contactId, summary, token);
    } catch (err) {
      console.error("[onboarding] notifyOnboarder failed:", err);
    }

    // --- Save to panel store ---
    let savedAccountId: string | undefined;
    try {      // Determine domain type and value
      let domainType: "existing" | "new" | "none" = "none";
      let domainValue = "";
      if (data.hasDomain && data.existingDomain) {
        domainType = "existing";
        domainValue = data.existingDomain;
      } else if (data.wantNewDomain && data.desiredDomain) {
        domainType = "new";
        domainValue = data.desiredDomain;
      }

      savedAccountId = await saveSubmission({
        locationId,
        contactId,
        businessName:       data.businessName ?? "",
        legalName:          data.legalName ?? "",
        email:              "",
        phone:              "",
        address:            data.address ?? "",
        city:               data.city ?? "",
        state:              data.state ?? "",
        zip:                data.zip ?? "",
        country:            data.country ?? "US",
        ein:                data.ein ?? "",
        domain:             domainValue,
        domainType,
        domainRegistrar:    data.domainRegistrar ?? "",
        primaryColor:       data.primaryColor ?? "",
        secondaryColor:     data.secondaryColor ?? "",
        complementaryColor: data.complementaryColor ?? "",
        letUsChooseColors:  data.letUsChooseColors ?? false,
        logoUrl:            logoUrl ?? "",
        logoSquareUrl:      logoSquareUrl ?? "",
        hoursOfOperation:   data.hoursOfOperation,
        websiteTagline:     data.websiteTagline ?? "",
        websiteServices:    data.websiteServices ?? [],
      });
    } catch (err) {
      console.error("[onboarding] saveSubmission failed:", err);
    }

    // --- Trigger website generation in background (non-blocking) ---
    if (savedAccountId && (data.websiteServices?.length ?? 0) > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://patronpro-web.vercel.app";
      const domain = data.hasDomain
        ? (data.existingDomain ?? "")
        : (data.desiredDomain ?? "");

      fetch(`${baseUrl}/api/website/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INTERNAL_API_SECRET ? { "x-internal-secret": process.env.INTERNAL_API_SECRET } : {}),
        },
        body: JSON.stringify({
          accountId:        savedAccountId,
          locationId,
          businessName:     data.businessName ?? "",
          address:          data.address ?? "",
          city:             data.city ?? "",
          state:            data.state ?? "",
          zip:              data.zip ?? "",
          tagline:            data.websiteTagline ?? "",
          services:           data.websiteServices ?? [],
          primaryColor:       data.primaryColor ?? "#1E2C46",
          secondaryColor:     data.secondaryColor ?? "#F67D0A",
          complementaryColor: data.complementaryColor ?? "#FFFFFF",
          domain,
          hoursOfOperation:   data.hoursOfOperation ?? null,
        }),
      }).catch((err) => console.error("[onboarding] website generation trigger failed:", err));
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

import { SignJWT } from "jose";
import { defaultChecklist, type PanelSubmission } from "@/lib/panel/store";
import type { GHLLocationData, GHLSubAccount } from "@/lib/panel/ghl-enrich";

export const LAB_LOCATION_ID = "lab-location-001";
export const LAB_ACCOUNT_ID = "lab-account-001";

export function isPanelLabMode(): boolean {
  return process.env.PATRONPRO_PANEL_LAB === "true";
}

export function labPanelCredentials(): { email: string; password: string } {
  const password = process.env.LAB_PANEL_PASSWORD;
  if (!password) throw new Error("LAB_PANEL_PASSWORD is not set");

  return {
    email: process.env.LAB_PANEL_EMAIL || "lab@getpatronpro.test",
    password,
  };
}

export async function signLabPanelSession(email: string): Promise<string> {
  const secret = process.env.SUPPORT_SESSION_SECRET;
  if (!secret) throw new Error("SUPPORT_SESSION_SECRET is not set");
  return new SignJWT({ email, sub: "lab-panel-user", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));
}

export function labSubmission(): PanelSubmission {
  return {
    locationId: LAB_LOCATION_ID,
    contactId: "lab-contact-001",
    submittedAt: new Date("2026-06-23T00:00:00Z").toISOString(),
    approvedAt: null,
    checklist: { ...defaultChecklist(), form: true },
    businessName: "Liverpool Digital Lab",
    legalName: "Liverpool Digital Lab LLC",
    email: "owner@example.com",
    phone: "+1 555 010 2026",
    address: "123 Brand Street",
    city: "Glendale",
    state: "CA",
    zip: "91201",
    country: "US",
    ein: "",
    domain: "liverpooldigital.example",
    domainType: "existing",
    domainRegistrar: "Lab Registrar",
    primaryColor: "#471f23",
    secondaryColor: "#f69309",
    complementaryColor: "#ffffff",
    letUsChooseColors: false,
    logoUrl: "",
    logoSquareUrl: "",
    hoursOfOperation: {
      monday: { open: true, from: "08:00", to: "17:00" },
      tuesday: { open: true, from: "08:00", to: "17:00" },
      wednesday: { open: true, from: "08:00", to: "17:00" },
      thursday: { open: true, from: "08:00", to: "17:00" },
      friday: { open: true, from: "08:00", to: "17:00" },
      saturday: { open: true, from: "09:00", to: "13:00" },
      sunday: { open: false, from: "09:00", to: "13:00" },
    },
    websiteTagline: "Roofing confiable para propietarios exigentes",
    websiteServices: [
      "Reemplazo de techo",
      "Reparacion de fugas",
      "Inspeccion de techo",
      "Daños por tormenta",
      "Roofing comercial",
      "Mantenimiento preventivo",
    ],
    businessLegalStructure: "LLC",
    hasStripeAccount: true,
    taxIdStatus: "available",
    teamSize: "3-10",
    preferredPlatformLanguage: "es",
    customerCommunicationLanguage: "es",
  };
}

export function labGhlLocation(): GHLLocationData {
  const submission = labSubmission();
  return {
    locationId: submission.locationId,
    name: submission.businessName,
    address: submission.address,
    phone: submission.phone,
    email: submission.email,
    website: submission.domain,
    createdAt: submission.submittedAt,
    planName: "Lab Plan",
    planStatus: "active",
    mrr: 99,
    phoneNumbers: ["+1 555 010 2026"],
    twilioActive: true,
    stripeConnected: true,
    customDomain: submission.domain,
    workflowsCount: 4,
    smsSent: true,
    appointmentDate: new Date("2026-06-24T16:00:00Z").toISOString(),
  };
}

export function labGhlSubAccount(): GHLSubAccount {
  const ghl = labGhlLocation();
  return {
    locationId: ghl.locationId,
    name: ghl.name,
    email: ghl.email,
    phone: ghl.phone,
    website: ghl.website,
    createdAt: ghl.createdAt,
  };
}

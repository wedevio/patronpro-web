/**
 * Panel data store — Supabase
 *
 * Tables:
 *   accounts            — one row per locationId
 *   account_submissions — full form data per account
 *   account_checklist   — per-item checked state
 */

import { getAdminClient } from "@/lib/supabase/client";
import type { HoursOfOperation } from "@/lib/onboarding/types";
import { isPanelLabMode, labSubmission } from "@/lib/lab/panel-lab";

export const CHECKLIST_ITEMS = [
  { id: "form",       label: "Formulario de onboarding recibido" },
  { id: "domain",     label: "Dominio conectado / DNS configurado" },
  { id: "phone",      label: "Número de teléfono asignado en GHL" },
  { id: "email",      label: "Email de negocio conectado" },
  { id: "landing",    label: "Landing page publicada" },
  { id: "calendar",   label: "Calendario configurado" },
  { id: "stripe",     label: "Stripe conectado" },
  { id: "client_ok",  label: "Acceso verificado con el cliente" },
] as const;

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]["id"];

export interface PanelSubmission {
  locationId:         string;
  contactId:          string;
  submittedAt:        string;
  approvedAt:         string | null;
  checklist:          Record<ChecklistItemId, boolean>;
  businessName:       string;
  legalName:          string;
  email:              string;
  phone:              string;
  address:            string;
  city:               string;
  state:              string;
  zip:                string;
  country:            string;
  ein:                string;
  domain:             string;
  domainType:         "existing" | "new" | "none";
  domainRegistrar:    string;
  primaryColor:       string;
  secondaryColor:     string;
  complementaryColor: string;
  letUsChooseColors:  boolean;
  logoUrl:            string;
  logoSquareUrl?:     string;
  hoursOfOperation?:       HoursOfOperation;
  websiteTagline?:         string;
  websiteServices?:        string[];
  businessLegalStructure?: string;
  hasStripeAccount?:       boolean;
  taxIdStatus?:            string;
  teamSize?:               string;
  preferredPlatformLanguage?: string;
  customerCommunicationLanguage?: string;
}

export function defaultChecklist(): Record<ChecklistItemId, boolean> {
  return Object.fromEntries(
    CHECKLIST_ITEMS.map((item) => [item.id, false])
  ) as Record<ChecklistItemId, boolean>;
}

/** Upsert account + submission + default checklist in Supabase. Returns accountId. */
export async function saveSubmission(
  data: Omit<PanelSubmission, "checklist" | "submittedAt" | "approvedAt">
): Promise<string> {
  const db = getAdminClient();
  const now = new Date().toISOString();

  // 1. Upsert account row
  const { data: account, error: accErr } = await db
    .from("accounts")
    .upsert(
      {
        location_id:   data.locationId,
        contact_id:    data.contactId,
        onboarding_at: now,
      },
      { onConflict: "location_id" }
    )
    .select("id")
    .single();

  if (accErr || !account) {
    throw new Error(`Failed to upsert account: ${accErr?.message}`);
  }

  const accountId = account.id as string;

  // 2. Insert submission row (always a new record per submit)
  const { error: subErr } = await db.from("account_submissions").insert({
    account_id:          accountId,
    submitted_at:        now,
    business_name:       data.businessName,
    legal_name:          data.legalName,
    email:               data.email,
    phone:               data.phone,
    address:             data.address,
    city:                data.city,
    state:               data.state,
    zip:                 data.zip,
    country:             data.country,
    ein:                 data.ein,
    domain:              data.domain,
    domain_type:         data.domainType,
    domain_registrar:    data.domainRegistrar,
    primary_color:       data.primaryColor,
    secondary_color:     data.secondaryColor,
    complementary_color: data.complementaryColor,
    let_patronpro_choose_colors: data.letUsChooseColors,
    logo_url:            data.logoUrl,
    logo_square_url:     data.logoSquareUrl ?? null,
    hours_of_operation:  data.hoursOfOperation ?? null,
    website_tagline:     data.websiteTagline ?? null,
    website_services:    data.websiteServices ?? [],
    business_legal_structure: data.businessLegalStructure ?? null,
    has_stripe_account:  data.hasStripeAccount ?? null,
    tax_id_status:       data.taxIdStatus ?? null,
    team_size:           data.teamSize ?? null,
    preferred_platform_language: data.preferredPlatformLanguage ?? null,
    customer_communication_language: data.customerCommunicationLanguage ?? null,
  });

  if (subErr) {
    throw new Error(`Failed to insert submission: ${subErr.message}`);
  }

  // 3. Seed checklist with "form" auto-checked (upsert — skip if already exists)
  const checklistRows = CHECKLIST_ITEMS.map((item) => ({
    account_id: accountId,
    item_id:    item.id,
    checked:    item.id === "form",
    checked_at: item.id === "form" ? now : null,
  }));

  const { error: clErr } = await db
    .from("account_checklist")
    .upsert(checklistRows, { onConflict: "account_id,item_id", ignoreDuplicates: true });

  if (clErr) {
    throw new Error(`Failed to seed checklist: ${clErr.message}`);
  }

  return accountId;
}

/** Returns all submissions ordered by onboarding_at desc */
export async function getAllSubmissions(): Promise<PanelSubmission[]> {
  if (isPanelLabMode()) {
    return [labSubmission()];
  }

  const db = getAdminClient();

  // Fetch accounts with latest submission and checklist
  const { data: accounts, error } = await db
    .from("accounts")
    .select(`
      id,
      location_id,
      contact_id,
      onboarding_at,
      approved_at,
      account_submissions ( * ),
      account_checklist ( item_id, checked )
    `)
    .order("onboarding_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`getAllSubmissions failed: ${error.message}`);
  if (!accounts?.length) return [];

  return accounts.map((acc) => {
    // Latest submission (last inserted)
    const subs = (acc.account_submissions as Record<string, unknown>[]) ?? [];
    const sub = subs.sort((a, b) =>
      String(b.submitted_at ?? "").localeCompare(String(a.submitted_at ?? ""))
    )[0] ?? {};

    // Build checklist
    const checklist = defaultChecklist();
    const items = (acc.account_checklist as { item_id: string; checked: boolean }[]) ?? [];
    for (const item of items) {
      if (item.item_id in checklist) {
        checklist[item.item_id as ChecklistItemId] = item.checked;
      }
    }

    return {
      locationId:         acc.location_id as string,
      contactId:          (acc.contact_id as string) ?? "",
      submittedAt:        (acc.onboarding_at as string) ?? "",
      approvedAt:         (acc.approved_at as string | null) ?? null,
      checklist,
      businessName:       (sub.business_name as string) ?? "",
      legalName:          (sub.legal_name as string) ?? "",
      email:              (sub.email as string) ?? "",
      phone:              (sub.phone as string) ?? "",
      address:            (sub.address as string) ?? "",
      city:               (sub.city as string) ?? "",
      state:              (sub.state as string) ?? "",
      zip:                (sub.zip as string) ?? "",
      country:            (sub.country as string) ?? "US",
      ein:                (sub.ein as string) ?? "",
      domain:             (sub.domain as string) ?? "",
      domainType:         ((sub.domain_type as string) ?? "none") as "existing" | "new" | "none",
      domainRegistrar:    (sub.domain_registrar as string) ?? "",
      primaryColor:       (sub.primary_color as string) ?? "",
      secondaryColor:     (sub.secondary_color as string) ?? "",
      complementaryColor: (sub.complementary_color as string) ?? "",
      letUsChooseColors:  (sub.let_patronpro_choose_colors as boolean) ?? false,
      logoUrl:            (sub.logo_url as string) ?? "",
      logoSquareUrl:      (sub.logo_square_url as string) ?? undefined,
      hoursOfOperation:   sub.hours_of_operation as HoursOfOperation | undefined,
      websiteTagline:     (sub.website_tagline as string) ?? "",
      websiteServices:    (sub.website_services as string[]) ?? [],
      businessLegalStructure: (sub.business_legal_structure as string) ?? undefined,
      hasStripeAccount:   sub.has_stripe_account as boolean | undefined,
      taxIdStatus:        (sub.tax_id_status as string) ?? undefined,
      teamSize:           (sub.team_size as string) ?? undefined,
      preferredPlatformLanguage: (sub.preferred_platform_language as string) ?? undefined,
      customerCommunicationLanguage: (sub.customer_communication_language as string) ?? undefined,
    };
  });
}

/** Toggle a checklist item for a locationId.
 *  Creates the account + all checklist rows on-demand if they don't exist yet. */
export async function updateChecklist(
  locationId: string,
  itemId: ChecklistItemId,
  checked: boolean,
  checkedBy: string = ""
): Promise<PanelSubmission | null> {
  if (isPanelLabMode()) {
    const submission = labSubmission();
    if (submission.locationId !== locationId) return null;
    return {
      ...submission,
      checklist: {
        ...submission.checklist,
        [itemId]: checked,
      },
    };
  }

  const db = getAdminClient();
  const now = new Date().toISOString();

  // Upsert account (may not exist yet for GHL-only accounts)
  // NOTE: no ignoreDuplicates — we need the id back whether inserted or existing
  await db
    .from("accounts")
    .upsert(
      { location_id: locationId, onboarding_at: now },
      { onConflict: "location_id", ignoreDuplicates: true }
    );

  const { data: acc, error: accErr } = await db
    .from("accounts")
    .select("id")
    .eq("location_id", locationId)
    .single();

  if (accErr || !acc) return null;

  const accountId = acc.id as string;

  // Seed all checklist rows if they don't exist yet
  const seedRows = CHECKLIST_ITEMS.map((item) => ({
    account_id: accountId,
    item_id:    item.id,
    checked:    false,
    checked_at: null,
  }));
  await db
    .from("account_checklist")
    .upsert(seedRows, { onConflict: "account_id,item_id", ignoreDuplicates: true });

  // Now upsert the specific item
  const { error } = await db
    .from("account_checklist")
    .upsert(
      {
        account_id: accountId,
        item_id:    itemId,
        checked,
        checked_at: checked ? now : null,
        checked_by: checked ? checkedBy : null,
      },
      { onConflict: "account_id,item_id" }
    );

  if (error) throw new Error(`updateChecklist failed: ${error.message}`);

  // Return fresh data
  const all = await getAllSubmissions();
  return all.find((s) => s.locationId === locationId) ?? null;
}

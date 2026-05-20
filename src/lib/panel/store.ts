/**
 * Panel data store — Upstash Redis
 *
 * Keys:
 *   panel:index          → Redis sorted set  { score: timestamp, member: locationId }
 *   panel:sub:{locationId} → JSON string with PanelSubmission
 */

import { Redis } from "@upstash/redis";
import type { HoursOfOperation } from "@/lib/onboarding/types";

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
  locationId:   string;
  contactId:    string;
  submittedAt:  string;
  checklist:    Record<ChecklistItemId, boolean>;
  // Full form data
  businessName: string;
  legalName:    string;
  email:        string;
  phone:        string;
  address:      string;
  city:         string;
  state:        string;
  zip:          string;
  country:      string;
  ein:          string;
  domain:       string;
  domainType:   "existing" | "new" | "none";
  domainRegistrar: string;
  primaryColor:    string;
  secondaryColor:  string;
  complementaryColor: string;
  letUsChooseColors: boolean;
  logoUrl:         string;
  hoursOfOperation?: HoursOfOperation;
}

function getRedis(): Redis {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error("Redis env vars not configured");
  }
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export function defaultChecklist(): Record<ChecklistItemId, boolean> {
  return Object.fromEntries(
    CHECKLIST_ITEMS.map((item) => [item.id, false])
  ) as Record<ChecklistItemId, boolean>;
}

export async function saveSubmission(
  data: Omit<PanelSubmission, "checklist" | "submittedAt">
): Promise<void> {
  const redis = getRedis();
  const now = new Date().toISOString();
  const score = Date.now();

  const submission: PanelSubmission = {
    ...data,
    submittedAt: now,
    checklist: { ...defaultChecklist(), form: true }, // "form received" auto-checked
  };

  await redis.set(`panel:sub:${data.locationId}`, JSON.stringify(submission));
  await redis.zadd("panel:index", { score, member: data.locationId });
}

export async function getAllSubmissions(): Promise<PanelSubmission[]> {
  const redis = getRedis();

  // Get all locationIds ordered by submission date (newest first)
  const locationIds = await redis.zrange("panel:index", 0, -1, { rev: true });
  if (!locationIds.length) return [];

  const results: PanelSubmission[] = [];
  for (const id of locationIds) {
    const raw = await redis.get<string>(`panel:sub:${id}`);
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      results.push(parsed as PanelSubmission);
    }
  }
  return results;
}

export async function updateChecklist(
  locationId: string,
  itemId: ChecklistItemId,
  checked: boolean
): Promise<PanelSubmission | null> {
  const redis = getRedis();
  const raw = await redis.get<string>(`panel:sub:${locationId}`);
  if (!raw) return null;

  const submission: PanelSubmission =
    typeof raw === "string" ? JSON.parse(raw) : raw;

  submission.checklist[itemId] = checked;
  await redis.set(`panel:sub:${locationId}`, JSON.stringify(submission));
  return submission;
}

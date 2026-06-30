export const PATRONPRO_ONBOARDING_GHL = {
  locationId: "hHLZC7FaTtUINPf3cbHd",
  calendarId: "D7x8ts5xcdNOWnd6Pjlq",
  assignedUserId: "r2NA4HiIxWRvKwzuYpzv",
  proofAppointmentId: "Cxa6iMN4am9r1XUdJWWS",
  proofContactId: "rSBhh1nzHdjaRXOF3F0A",
  timeZone: "America/Mexico_City",
} as const;

export type OnboardingGhlAppointmentErrorCode =
  | "wrong-account"
  | "deleted"
  | "naive-timestamp"
  | "inverted-range"
  | "missing-id"
  | "missing-contact"
  | "invalid-date";

export interface GhlAppointmentReadback {
  id?: string;
  _id?: string;
  locationId?: string;
  calendarId?: string;
  contactId?: string;
  assignedUserId?: string;
  title?: string;
  appointmentStatus?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  source?: string;
  deleted?: boolean;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface OnboardingGhlAppointment {
  provider: "ghl";
  mode: "read-only-import";
  sourceOfTruth: "ghl-main-account";
  appointmentId: string;
  locationId: string;
  calendarId: string;
  contactId: string;
  assignedUserId: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  startEpochMs: number;
  endEpochMs: number;
  timeZone: typeof PATRONPRO_ONBOARDING_GHL.timeZone;
  joinUrl: string | null;
  deleted: boolean;
  importable: boolean;
  nonImportableReason: "deleted" | null;
  source: string | null;
  dateAdded: string | null;
  dateUpdated: string | null;
  readbackHash: string;
  warnings: string[];
}

export interface OnboardingGhlAppointmentImportAudit {
  bead: "ppweb-0ka.7";
  mode: "dry-run";
  createdAt: string;
  source: {
    provider: "ghl";
    sourceOfTruth: "ghl-main-account";
    appointmentId: string;
    contactId: string;
    calendarId: string;
    locationId: string;
    assignedUserId: string;
    readbackHash: string;
  };
  status: {
    importable: boolean;
    nonImportableReason: "deleted" | null;
    ghlMutation: false;
    googleCalendarMutation: false;
    emailSent: false;
    databaseWrite: false;
  };
}

export class OnboardingGhlAppointmentContractError extends Error {
  readonly code: OnboardingGhlAppointmentErrorCode;

  constructor(code: OnboardingGhlAppointmentErrorCode, message: string) {
    super(message);
    this.name = "OnboardingGhlAppointmentContractError";
    this.code = code;
  }
}

const TZ_AWARE_ISO_RE = /(?:Z|[+-]\d{2}:\d{2})$/;

export function sameInstant(leftIso: string, rightIso: string): boolean {
  const left = new Date(leftIso).getTime();
  const right = new Date(rightIso).getTime();
  return Number.isFinite(left) && Number.isFinite(right) && left === right;
}

export function normalizeGhlOnboardingAppointment(
  readback: GhlAppointmentReadback,
  options: { expectedStartTime?: string; expectedEndTime?: string } = {}
): OnboardingGhlAppointment {
  const appointmentId = requiredText(readback.id ?? readback._id, "missing-id", "appointment id is required");
  const contactId = requiredText(readback.contactId, "missing-contact", "contactId is required");

  assertExpectedIdentity(readback.locationId, PATRONPRO_ONBOARDING_GHL.locationId, "locationId");
  assertExpectedIdentity(readback.calendarId, PATRONPRO_ONBOARDING_GHL.calendarId, "calendarId");
  assertExpectedIdentity(readback.assignedUserId, PATRONPRO_ONBOARDING_GHL.assignedUserId, "assignedUserId");

  const startTime = requiredTimestamp(readback.startTime, "startTime");
  const endTime = requiredTimestamp(readback.endTime, "endTime");
  const startEpochMs = parseTimestamp(startTime, "startTime");
  const endEpochMs = parseTimestamp(endTime, "endTime");
  if (endEpochMs <= startEpochMs) {
    throw new OnboardingGhlAppointmentContractError("inverted-range", "endTime must be after startTime");
  }

  const warnings: string[] = [];
  const title = optionalText(readback.title);
  const status = optionalText(readback.appointmentStatus);
  const joinUrl = httpUrlOrNull(readback.address);
  if (!title) warnings.push("missing-title");
  if (!status) warnings.push("missing-appointment-status");
  if (!joinUrl) warnings.push("missing-join-url");
  if (options.expectedStartTime && !sameInstant(startTime, options.expectedStartTime)) {
    warnings.push("start-time-does-not-match-expected-instant");
  }
  if (options.expectedEndTime && !sameInstant(endTime, options.expectedEndTime)) {
    warnings.push("end-time-does-not-match-expected-instant");
  }

  const deleted = readback.deleted === true;
  const stableReadback = {
    appointmentId,
    locationId: PATRONPRO_ONBOARDING_GHL.locationId,
    calendarId: PATRONPRO_ONBOARDING_GHL.calendarId,
    contactId,
    assignedUserId: PATRONPRO_ONBOARDING_GHL.assignedUserId,
    title: title || "PatronPro Onboarding",
    status: status || "unknown",
    startTime,
    endTime,
    deleted,
    source: optionalText(readback.source),
    dateAdded: optionalText(readback.dateAdded),
    dateUpdated: optionalText(readback.dateUpdated),
  };

  return {
    provider: "ghl",
    mode: "read-only-import",
    sourceOfTruth: "ghl-main-account",
    appointmentId,
    locationId: PATRONPRO_ONBOARDING_GHL.locationId,
    calendarId: PATRONPRO_ONBOARDING_GHL.calendarId,
    contactId,
    assignedUserId: PATRONPRO_ONBOARDING_GHL.assignedUserId,
    title: stableReadback.title,
    status: stableReadback.status,
    startTime,
    endTime,
    startEpochMs,
    endEpochMs,
    timeZone: PATRONPRO_ONBOARDING_GHL.timeZone,
    joinUrl,
    deleted,
    importable: !deleted,
    nonImportableReason: deleted ? "deleted" : null,
    source: stableReadback.source || null,
    dateAdded: stableReadback.dateAdded || null,
    dateUpdated: stableReadback.dateUpdated || null,
    readbackHash: stableHash(stableReadback),
    warnings,
  };
}

export function assertGhlOnboardingAppointmentImportable(
  appointment: OnboardingGhlAppointment
): OnboardingGhlAppointment {
  if (!appointment.importable || appointment.deleted) {
    throw new OnboardingGhlAppointmentContractError("deleted", "deleted appointments are not importable");
  }
  return appointment;
}

export function buildGhlAppointmentImportAudit(
  appointment: OnboardingGhlAppointment,
  options: { createdAt?: string } = {}
): OnboardingGhlAppointmentImportAudit {
  return {
    bead: "ppweb-0ka.7",
    mode: "dry-run",
    createdAt: options.createdAt ?? new Date().toISOString(),
    source: {
      provider: "ghl",
      sourceOfTruth: "ghl-main-account",
      appointmentId: appointment.appointmentId,
      contactId: appointment.contactId,
      calendarId: appointment.calendarId,
      locationId: appointment.locationId,
      assignedUserId: appointment.assignedUserId,
      readbackHash: appointment.readbackHash,
    },
    status: {
      importable: appointment.importable,
      nonImportableReason: appointment.nonImportableReason,
      ghlMutation: false,
      googleCalendarMutation: false,
      emailSent: false,
      databaseWrite: false,
    },
  };
}

function requiredText(
  value: string | undefined,
  code: OnboardingGhlAppointmentErrorCode,
  message: string
): string {
  const trimmed = optionalText(value);
  if (!trimmed) throw new OnboardingGhlAppointmentContractError(code, message);
  return trimmed;
}

function optionalText(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function assertExpectedIdentity(value: string | undefined, expected: string, field: string): void {
  if (optionalText(value) !== expected) {
    throw new OnboardingGhlAppointmentContractError("wrong-account", `${field} must be ${expected}`);
  }
}

function requiredTimestamp(value: string | undefined, field: string): string {
  const trimmed = optionalText(value);
  if (!trimmed) {
    throw new OnboardingGhlAppointmentContractError("invalid-date", `${field} is required`);
  }
  if (!TZ_AWARE_ISO_RE.test(trimmed)) {
    throw new OnboardingGhlAppointmentContractError("naive-timestamp", `${field} must include Z or an explicit offset`);
  }
  return trimmed;
}

function parseTimestamp(value: string, field: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) {
    throw new OnboardingGhlAppointmentContractError("invalid-date", `${field} must be a valid ISO timestamp`);
  }
  return parsed;
}

function httpUrlOrNull(value: string | undefined): string | null {
  const trimmed = optionalText(value);
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function stableHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

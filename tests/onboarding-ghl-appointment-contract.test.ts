import { describe, expect, test } from "bun:test";
import {
  assertGhlOnboardingAppointmentImportable,
  buildGhlAppointmentImportAudit,
  normalizeGhlOnboardingAppointment,
  OnboardingGhlAppointmentContractError,
  PATRONPRO_ONBOARDING_GHL,
  sameInstant,
  type GhlAppointmentReadback,
} from "../src/lib/onboarding/ghl-appointment-contract";

const expectedStart = "2026-06-12T11:00:00-06:00";
const expectedEnd = "2026-06-12T12:00:00-06:00";
const ghlStartReadback = "2026-06-12T10:00:00-07:00";
const ghlEndReadback = "2026-06-12T11:00:00-07:00";

const proofReadback: GhlAppointmentReadback = {
  id: PATRONPRO_ONBOARDING_GHL.proofAppointmentId,
  locationId: PATRONPRO_ONBOARDING_GHL.locationId,
  calendarId: PATRONPRO_ONBOARDING_GHL.calendarId,
  contactId: PATRONPRO_ONBOARDING_GHL.proofContactId,
  assignedUserId: PATRONPRO_ONBOARDING_GHL.assignedUserId,
  title: "PatronPro Onboarding",
  appointmentStatus: "confirmed",
  startTime: ghlStartReadback,
  endTime: ghlEndReadback,
  address: "https://meet.google.com/demo-demo-demo",
  source: "api",
  deleted: false,
  dateAdded: "2026-06-12T17:00:00.000Z",
  dateUpdated: "2026-06-12T17:05:00.000Z",
};

function expectContractError(fn: () => unknown, code: OnboardingGhlAppointmentContractError["code"]): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(OnboardingGhlAppointmentContractError);
    expect((error as OnboardingGhlAppointmentContractError).code).toBe(code);
    return;
  }
  throw new Error(`Expected OnboardingGhlAppointmentContractError with code ${code}`);
}

describe("GHL onboarding appointment contract", () => {
  test("normalizes the proof appointment and compares expected CDMX instants", () => {
    const appointment = normalizeGhlOnboardingAppointment(proofReadback, {
      expectedStartTime: expectedStart,
      expectedEndTime: expectedEnd,
    });

    expect(appointment.provider).toBe("ghl");
    expect(appointment.mode).toBe("read-only-import");
    expect(appointment.sourceOfTruth).toBe("ghl-main-account");
    expect(appointment.appointmentId).toBe(PATRONPRO_ONBOARDING_GHL.proofAppointmentId);
    expect(appointment.locationId).toBe(PATRONPRO_ONBOARDING_GHL.locationId);
    expect(appointment.calendarId).toBe(PATRONPRO_ONBOARDING_GHL.calendarId);
    expect(appointment.contactId).toBe(PATRONPRO_ONBOARDING_GHL.proofContactId);
    expect(appointment.assignedUserId).toBe(PATRONPRO_ONBOARDING_GHL.assignedUserId);
    expect(appointment.startTime).toBe(ghlStartReadback);
    expect(appointment.endTime).toBe(ghlEndReadback);
    expect(appointment.startEpochMs).toBe(new Date(expectedStart).getTime());
    expect(appointment.endEpochMs).toBe(new Date(expectedEnd).getTime());
    expect(appointment.timeZone).toBe("America/Mexico_City");
    expect(appointment.importable).toBe(true);
    expect(appointment.nonImportableReason).toBeNull();
    expect(appointment.warnings).toEqual([]);
    expect(appointment.readbackHash).toMatch(/^[a-f0-9]{8}$/);
  });

  test("proves offset-string divergence still represents the same instant", () => {
    expect(ghlStartReadback).not.toBe(expectedStart);
    expect(ghlEndReadback).not.toBe(expectedEnd);
    expect(sameInstant(ghlStartReadback, expectedStart)).toBe(true);
    expect(sameInstant(ghlEndReadback, expectedEnd)).toBe(true);
  });

  test("throws wrong-account for wrong location", () => {
    expectContractError(() => normalizeGhlOnboardingAppointment({ ...proofReadback, locationId: "wrong-location" }), "wrong-account");
  });

  test("throws wrong-account for wrong calendar", () => {
    expectContractError(() => normalizeGhlOnboardingAppointment({ ...proofReadback, calendarId: "wrong-calendar" }), "wrong-account");
  });

  test("throws wrong-account for wrong assignee", () => {
    expectContractError(
      () => normalizeGhlOnboardingAppointment({ ...proofReadback, assignedUserId: "wrong-user" }),
      "wrong-account"
    );
  });

  test("treats omitted deleted flag as importable", () => {
    const withoutDeleted = { ...proofReadback };
    delete withoutDeleted.deleted;
    const appointment = normalizeGhlOnboardingAppointment(withoutDeleted);
    expect(appointment.deleted).toBe(false);
    expect(appointment.importable).toBe(true);
    expect(assertGhlOnboardingAppointmentImportable(appointment)).toBe(appointment);
  });

  test("treats deleted readbacks as readable but not importable", () => {
    const appointment = normalizeGhlOnboardingAppointment({ ...proofReadback, deleted: true });
    expect(appointment.deleted).toBe(true);
    expect(appointment.importable).toBe(false);
    expect(appointment.nonImportableReason).toBe("deleted");
    expectContractError(() => assertGhlOnboardingAppointmentImportable(appointment), "deleted");
  });

  test("throws naive-timestamp for timezone-naive timestamps", () => {
    expectContractError(
      () => normalizeGhlOnboardingAppointment({ ...proofReadback, startTime: "2026-06-12T11:00:00" }),
      "naive-timestamp"
    );
    expectContractError(
      () => normalizeGhlOnboardingAppointment({ ...proofReadback, endTime: "2026-06-12T12:00:00" }),
      "naive-timestamp"
    );
  });

  test("throws inverted-range when endTime is not after startTime", () => {
    expectContractError(
      () => normalizeGhlOnboardingAppointment({ ...proofReadback, endTime: "2026-06-12T09:00:00-07:00" }),
      "inverted-range"
    );
  });

  test("throws required id errors", () => {
    expectContractError(() => normalizeGhlOnboardingAppointment({ ...proofReadback, id: undefined, _id: undefined }), "missing-id");
    expectContractError(() => normalizeGhlOnboardingAppointment({ ...proofReadback, contactId: undefined }), "missing-contact");
  });

  test("produces dry-run audit with all mutation flags false", () => {
    const appointment = normalizeGhlOnboardingAppointment(proofReadback);
    const audit = buildGhlAppointmentImportAudit(appointment, { createdAt: "2026-06-12T18:00:00.000Z" });

    expect(audit.bead).toBe("ppweb-0ka.7");
    expect(audit.mode).toBe("dry-run");
    expect(audit.createdAt).toBe("2026-06-12T18:00:00.000Z");
    expect(audit.source.appointmentId).toBe(PATRONPRO_ONBOARDING_GHL.proofAppointmentId);
    expect(audit.source.contactId).toBe(PATRONPRO_ONBOARDING_GHL.proofContactId);
    expect(audit.source.calendarId).toBe(PATRONPRO_ONBOARDING_GHL.calendarId);
    expect(audit.source.locationId).toBe(PATRONPRO_ONBOARDING_GHL.locationId);
    expect(audit.source.assignedUserId).toBe(PATRONPRO_ONBOARDING_GHL.assignedUserId);
    expect(audit.source.readbackHash).toBe(appointment.readbackHash);
    expect(audit.status).toEqual({
      importable: true,
      nonImportableReason: null,
      ghlMutation: false,
      googleCalendarMutation: false,
      emailSent: false,
      databaseWrite: false,
    });
  });

  test("scrubs untrusted raw credential fields from normalized output and audit", () => {
    const appointment = normalizeGhlOnboardingAppointment({
      ...proofReadback,
      ["api" + "Key"]: "opaque-credential",
      authorization: "Bearer opaque-auth",
      cookie: "session=opaque-cookie",
      bearer: "opaque-bearer",
    });
    const audit = buildGhlAppointmentImportAudit(appointment, { createdAt: "2026-06-12T18:00:00.000Z" });
    const serialized = JSON.stringify({ appointment, audit });

    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("bearer");
    expect(serialized).not.toContain("opaque-credential");
    expect(serialized).not.toContain("opaque-auth");
    expect(serialized).not.toContain("opaque-cookie");
    expect(serialized).not.toContain("opaque-bearer");
  });
});

import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  buildOnboardingInvitePreview,
  DEFAULT_ONBOARDING_INVITE_FORM,
  OnboardingInvitePreviewError,
} from "../src/lib/onboarding/invite-preview";

const createdAt = "2026-06-12T18:00:00Z";

describe("buildOnboardingInvitePreview", () => {
  test("preview subject includes business name", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(preview.subject).toBe("PatronPro onboarding: Demo Auto Shop");
  });

  test("preview body includes meeting time timezone join link and organizer email", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(preview.bodyText).toContain("Jun 15, 2026");
    expect(preview.bodyText).toContain("America/Mexico_City");
    expect(preview.bodyText).toContain("https://meet.google.com/demo-demo-demo");
    expect(preview.bodyText).toContain("support@example.com");
  });

  test("form maps to CalendarInviteInput without losing attendee organizer or location fields", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(preview.input.attendeeName).toBe("Demo Client");
    expect(preview.input.attendeeEmail).toBe("client@example.com");
    expect(preview.input.organizerName).toBe("PatronPro");
    expect(preview.input.organizerEmail).toBe("support@example.com");
    expect(preview.input.location).toBe("Google Meet");
    expect(preview.input.joinUrl).toBe("https://meet.google.com/demo-demo-demo");
    expect(preview.input.timeZone).toBe("America/Mexico_City");
    expect(preview.input.start).toBe("2026-06-15T10:00:00-06:00");
    expect(preview.input.end).toBe("2026-06-15T11:00:00-06:00");
  });

  test("audit payload is dry-run safe", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(preview.auditPayload.mode).toBe("dry-run");
    expect(preview.auditPayload.status.sent).toBe(false);
    expect(preview.auditPayload.status.ghlMutation).toBe(false);
    expect(preview.auditPayload.status.persisted).toBe("not-recorded");
  });

  test("audit payload icsTextSha256 is lowercase sha256 of final icsText", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    const checksum = createHash("sha256").update(preview.calendar.icsText, "utf8").digest("hex");
    expect(preview.auditPayload.calendar.icsTextSha256).toBe(checksum);
    expect(preview.auditPayload.calendar.icsTextSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  test("generator integration exposes google outlook office365 apple zoho and ics keys", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(Object.keys(preview.calendar.links).sort()).toEqual(["apple", "google", "ics", "office365", "outlook", "zoho"]);
  });

  test("ics filename uses generator safe filename", () => {
    const preview = buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt });
    expect(preview.calendar.fileName).toBe("demo-auto-shop-patronpro-onboarding-2026-06-15t10-00-00-06-00.ics");
  });

  test("invalid client email is rejected before audit creation", () => {
    expect(() =>
      buildOnboardingInvitePreview(
        {
          ...DEFAULT_ONBOARDING_INVITE_FORM,
          clientEmail: "not-an-email",
        },
        { createdAt }
      )
    ).toThrow(OnboardingInvitePreviewError);
  });
});

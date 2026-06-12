import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  buildCalendarInvite,
  CalendarInviteValidationError,
  escapeIcsText,
  type CalendarInviteInput,
} from "../src/lib/onboarding/calendar-invite";

const payload: CalendarInviteInput = {
  id: "demo-onboarding",
  title: "PatronPro Onboarding",
  start: "2026-06-15T10:00:00-06:00",
  end: "2026-06-15T11:00:00-06:00",
  timeZone: "America/Mexico_City",
  description: "Line 1, with semicolon; and backslash \\ plus\nLine 2",
  location: "Google Meet",
  joinUrl: "https://meet.google.com/demo-demo-demo",
  organizerName: "PatronPro",
  organizerEmail: "support@example.com",
  attendeeName: "Demo Client",
  attendeeEmail: "client@example.com",
  createdAt: "2026-06-12T18:00:00Z",
};

function decodedDataUrl(dataUrl: string): string {
  const prefix = "data:text/calendar;charset=utf-8;base64,";
  expect(dataUrl.startsWith(prefix)).toBe(true);
  return Buffer.from(dataUrl.slice(prefix.length), "base64").toString("utf8");
}

describe("buildCalendarInvite", () => {
  test("generates deterministic ICS with required sections and reminders", () => {
    const invite = buildCalendarInvite(payload);

    expect(invite.fileName).toBe("demo-onboarding.ics");
    expect(invite.icsText.endsWith("\r\n")).toBe(true);
    expect(invite.icsText).toContain("BEGIN:VCALENDAR\r\n");
    expect(invite.icsText).toContain("VERSION:2.0\r\n");
    expect(invite.icsText).toContain("PRODID:-//PatronPro//Onboarding Calendar Invite//EN\r\n");
    expect(invite.icsText).toContain("BEGIN:VEVENT\r\n");
    expect(invite.icsText).toContain("UID:demo-onboarding@patronpro.com\r\n");
    expect(invite.icsText).toContain("DTSTAMP:20260612T180000Z\r\n");
    expect(invite.icsText).toContain("DTSTART:20260615T160000Z\r\n");
    expect(invite.icsText).toContain("DTEND:20260615T170000Z\r\n");
    expect(invite.icsText).toContain("SUMMARY:PatronPro Onboarding\r\n");
    expect(invite.icsText).toContain("TRIGGER:-P1D\r\n");
    expect(invite.icsText).toContain("TRIGGER:-PT1H\r\n");
    expect(invite.icsText).toContain("TRIGGER:-PT15M\r\n");
    expect(invite.icsText.match(/ACTION:DISPLAY/g)?.length).toBe(3);
  });

  test("escapes ICS text values and base64 data URL decodes to the exact ICS", () => {
    const invite = buildCalendarInvite(payload);

    expect(escapeIcsText(payload.description ?? "")).toBe(
      "Line 1\\, with semicolon\\; and backslash \\\\ plus\\nLine 2"
    );
    expect(invite.icsText).toContain("Line 1\\, with semicolon\\; and backslash \\\\ plus\\nLine 2");
    expect(decodedDataUrl(invite.icsDataUrl)).toBe(invite.icsText);
  });

  test("folds every ICS line to 75 UTF-8 octets or less", () => {
    const invite = buildCalendarInvite({
      ...payload,
      description: "A".repeat(220),
    });

    for (const line of invite.icsText.split("\r\n").filter(Boolean)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
      if (line.startsWith(" ")) expect(line.length).toBeGreaterThan(1);
    }
  });

  test("builds parseable provider URLs and ICS fallbacks", () => {
    const invite = buildCalendarInvite(payload);
    const google = new URL(invite.links.google);
    const outlook = new URL(invite.links.outlook);
    const office365 = new URL(invite.links.office365);

    expect(google.origin + google.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(google.searchParams.get("action")).toBe("TEMPLATE");
    expect(google.searchParams.get("text")).toBe(payload.title);
    expect(google.searchParams.get("dates")).toBe("20260615T160000Z/20260615T170000Z");
    expect(google.searchParams.get("ctz")).toBe("America/Mexico_City");
    expect(google.searchParams.get("details")).toContain("https://meet.google.com/demo-demo-demo");

    expect(outlook.origin + outlook.pathname).toBe("https://outlook.live.com/calendar/0/deeplink/compose");
    expect(office365.origin + office365.pathname).toBe("https://outlook.office.com/calendar/0/deeplink/compose");
    for (const url of [outlook, office365]) {
      expect(url.searchParams.get("path")).toBe("/calendar/action/compose");
      expect(url.searchParams.get("rru")).toBe("addevent");
      expect(url.searchParams.get("subject")).toBe(payload.title);
      expect(url.searchParams.get("startdt")).toBe("2026-06-15T16:00:00.000Z");
      expect(url.searchParams.get("enddt")).toBe("2026-06-15T17:00:00.000Z");
      expect(url.searchParams.get("body")).toContain("https://meet.google.com/demo-demo-demo");
    }

    expect(invite.links.apple).toBe(invite.icsDataUrl);
    expect(invite.links.zoho).toBe(invite.icsDataUrl);
    expect(invite.links.ics).toBe(invite.icsDataUrl);
    expect(Object.keys(invite.providerNotes).sort()).toEqual(["apple", "google", "ics", "office365", "outlook", "zoho"]);
    expect(invite.providerNotes.zoho).toContain("ICS fallback");
  });

  test("falls back DTSTAMP to start when createdAt is omitted", () => {
    const withoutCreatedAt = { ...payload };
    delete withoutCreatedAt.createdAt;
    const invite = buildCalendarInvite(withoutCreatedAt);
    expect(invite.icsText).toContain("DTSTAMP:20260615T160000Z\r\n");
  });

  test("rejects invalid input", () => {
    expect(() => buildCalendarInvite({ ...payload, start: "2026-06-15T10:00:00" })).toThrow(CalendarInviteValidationError);
    expect(() => buildCalendarInvite({ ...payload, end: "2026-06-15T09:00:00-06:00" })).toThrow(CalendarInviteValidationError);
    expect(() => buildCalendarInvite({ ...payload, organizerEmail: "not-an-email" })).toThrow(CalendarInviteValidationError);
    expect(() => buildCalendarInvite({ ...payload, timeZone: "Not/A_Timezone" })).toThrow(CalendarInviteValidationError);
    expect(() => buildCalendarInvite({ ...payload, description: "A".repeat(9000) })).toThrow(CalendarInviteValidationError);
  });

  test("guards against adding excluded calendar dependencies in this slice", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    expect(deps.datebook).toBeUndefined();
    expect(deps["add-to-calendar-button"]).toBeUndefined();
  });

  test("sample payload checksum can be generated from fake data", () => {
    const invite = buildCalendarInvite(payload);
    const checksum = createHash("sha256").update(invite.icsText).digest("hex");
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.organizerEmail).toEndWith("@example.com");
    expect(payload.attendeeEmail).toEndWith("@example.com");
  });
});

export type CalendarProvider = "google" | "outlook" | "office365" | "apple" | "zoho" | "ics";

export type CalendarReminderTrigger = "-P1D" | "-PT1H" | "-PT15M";

export interface CalendarReminder {
  trigger: CalendarReminderTrigger;
  description?: string;
}

export interface CalendarInviteInput {
  id: string;
  title: string;
  start: string;
  end: string;
  timeZone?: string;
  description?: string;
  location?: string;
  joinUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  createdAt?: string;
  reminders?: CalendarReminder[];
}

export interface CalendarInviteOutput {
  icsText: string;
  icsDataUrl: string;
  fileName: string;
  links: Record<CalendarProvider, string>;
  providerNotes: Record<CalendarProvider, string>;
}

interface NormalizedInvite {
  id: string;
  title: string;
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  timeZone: string;
  description: string;
  location: string;
  joinUrl: string;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  createdAt: Date;
  reminders: CalendarReminder[];
}

const PROD_ID = "-//PatronPro//Onboarding Calendar Invite//EN";
const DATA_URL_PREFIX = "data:text/calendar;charset=utf-8;base64,";
const DEFAULT_TIME_ZONE = "America/Mexico_City";
const MAX_PROVIDER_URL_LENGTH = 8000;
const TZ_AWARE_ISO_RE = /(?:Z|[+-]\d{2}:\d{2})$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DEFAULT_REMINDERS: CalendarReminder[] = [
  { trigger: "-P1D", description: "Reminder" },
  { trigger: "-PT1H", description: "Reminder" },
  { trigger: "-PT15M", description: "Reminder" },
];

export class CalendarInviteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarInviteValidationError";
  }
}

export function buildCalendarInvite(input: CalendarInviteInput): CalendarInviteOutput {
  const invite = normalizeInvite(input);
  const icsText = buildIcs(invite);
  const icsDataUrl = `${DATA_URL_PREFIX}${base64Utf8(icsText)}`;
  const providerNotes = buildProviderNotes();
  const links: Record<CalendarProvider, string> = {
    google: buildGoogleUrl(invite),
    outlook: buildOutlookUrl(invite, "https://outlook.live.com/calendar/0/deeplink/compose"),
    office365: buildOutlookUrl(invite, "https://outlook.office.com/calendar/0/deeplink/compose"),
    apple: icsDataUrl,
    zoho: icsDataUrl,
    ics: icsDataUrl,
  };

  for (const [provider, url] of Object.entries(links)) {
    if (url.length > MAX_PROVIDER_URL_LENGTH) {
      throw new CalendarInviteValidationError(`${provider} calendar URL exceeds ${MAX_PROVIDER_URL_LENGTH} characters`);
    }
  }

  return {
    icsText,
    icsDataUrl,
    fileName: `${safeFileName(invite.id)}.ics`,
    links,
    providerNotes,
  };
}

function normalizeInvite(input: CalendarInviteInput): NormalizedInvite {
  const id = requiredText(input.id, "id");
  const title = requiredText(input.title, "title");
  const startIso = requiredText(input.start, "start");
  const endIso = requiredText(input.end, "end");
  assertTimezoneAwareIso(startIso, "start");
  assertTimezoneAwareIso(endIso, "end");

  const start = parseDate(startIso, "start");
  const end = parseDate(endIso, "end");
  if (end.getTime() <= start.getTime()) {
    throw new CalendarInviteValidationError("end must be after start");
  }

  const timeZone = (input.timeZone ?? DEFAULT_TIME_ZONE).trim();
  assertValidTimeZone(timeZone);

  const createdIso = input.createdAt?.trim();
  if (createdIso) assertTimezoneAwareIso(createdIso, "createdAt");
  const createdAt = createdIso ? parseDate(createdIso, "createdAt") : start;

  const organizerEmail = optionalText(input.organizerEmail);
  const attendeeEmail = optionalText(input.attendeeEmail);
  if (organizerEmail) assertValidEmail(organizerEmail, "organizerEmail");
  if (attendeeEmail) assertValidEmail(attendeeEmail, "attendeeEmail");

  const reminders = input.reminders?.length ? input.reminders : DEFAULT_REMINDERS;
  for (const reminder of reminders) {
    if (!["-P1D", "-PT1H", "-PT15M"].includes(reminder.trigger)) {
      throw new CalendarInviteValidationError(`unsupported reminder trigger: ${reminder.trigger}`);
    }
  }

  return {
    id,
    title,
    start,
    end,
    startIso,
    endIso,
    timeZone,
    description: optionalText(input.description),
    location: optionalText(input.location),
    joinUrl: optionalText(input.joinUrl),
    organizerName: optionalText(input.organizerName),
    organizerEmail,
    attendeeName: optionalText(input.attendeeName),
    attendeeEmail,
    createdAt,
    reminders,
  };
}

function requiredText(value: string | undefined, field: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) throw new CalendarInviteValidationError(`${field} is required`);
  return trimmed;
}

function optionalText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function assertTimezoneAwareIso(value: string, field: string): void {
  if (!TZ_AWARE_ISO_RE.test(value)) {
    throw new CalendarInviteValidationError(`${field} must include Z or an explicit timezone offset`);
  }
}

function parseDate(value: string, field: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new CalendarInviteValidationError(`${field} must be a valid ISO timestamp`);
  }
  return parsed;
}

function assertValidTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date("2026-01-01T00:00:00Z"));
  } catch {
    throw new CalendarInviteValidationError(`timeZone is not a valid IANA timezone: ${timeZone}`);
  }
}

function assertValidEmail(value: string, field: string): void {
  if (!EMAIL_RE.test(value)) {
    throw new CalendarInviteValidationError(`${field} must be a valid email address`);
  }
}

function buildIcs(invite: NormalizedInvite): string {
  const description = eventDescription(invite);
  const location = invite.location || invite.joinUrl;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PROD_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(invite.id)}@patronpro.com`,
    `DTSTAMP:${formatIcsUtc(invite.createdAt)}`,
    `DTSTART:${formatIcsUtc(invite.start)}`,
    `DTEND:${formatIcsUtc(invite.end)}`,
    `SUMMARY:${escapeIcsText(invite.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    ...(invite.joinUrl ? [`URL:${escapeIcsText(invite.joinUrl)}`] : []),
    ...(invite.organizerEmail
      ? [`ORGANIZER${invite.organizerName ? `;CN=${escapeIcsText(invite.organizerName)}` : ""}:mailto:${invite.organizerEmail}`]
      : []),
    ...(invite.attendeeEmail
      ? [
          `ATTENDEE${invite.attendeeName ? `;CN=${escapeIcsText(invite.attendeeName)}` : ""};ROLE=REQ-PARTICIPANT:mailto:${invite.attendeeEmail}`,
        ]
      : []),
    ...invite.reminders.flatMap((reminder) => buildAlarm(reminder)),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function buildAlarm(reminder: CalendarReminder): string[] {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(reminder.description || "Reminder")}`,
    `TRIGGER:${reminder.trigger}`,
    "END:VALARM",
  ];
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string): string {
  if (utf8Length(line) <= 75) return line;

  const chunks: string[] = [];
  let remaining = line;
  let first = true;
  while (remaining.length > 0) {
    const limit = first ? 75 : 74;
    const chunk = takeUtf8Chunk(remaining, limit);
    chunks.push(first ? chunk.text : ` ${chunk.text}`);
    remaining = remaining.slice(chunk.length);
    first = false;
  }
  return chunks.join("\r\n");
}

function takeUtf8Chunk(value: string, byteLimit: number): { text: string; length: number } {
  let text = "";
  let length = 0;
  for (const char of value) {
    const candidate = text + char;
    if (utf8Length(candidate) > byteLimit) break;
    text = candidate;
    length += char.length;
  }
  if (!text) {
    throw new CalendarInviteValidationError("cannot fold ICS line containing an overlong character");
  }
  return { text, length };
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function eventDescription(invite: NormalizedInvite): string {
  const parts = [invite.description];
  if (invite.joinUrl) parts.push(`Join: ${invite.joinUrl}`);
  return parts.filter(Boolean).join("\n\n");
}

function providerDescription(invite: NormalizedInvite): string {
  return eventDescription(invite);
}

function providerLocation(invite: NormalizedInvite): string {
  return invite.location || invite.joinUrl;
}

function buildGoogleUrl(invite: NormalizedInvite): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.search = new URLSearchParams({
    action: "TEMPLATE",
    text: invite.title,
    dates: `${formatIcsUtc(invite.start)}/${formatIcsUtc(invite.end)}`,
    details: providerDescription(invite),
    location: providerLocation(invite),
    ctz: invite.timeZone,
  }).toString();
  return url.toString();
}

function buildOutlookUrl(invite: NormalizedInvite, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: invite.title,
    startdt: invite.start.toISOString(),
    enddt: invite.end.toISOString(),
    body: providerDescription(invite),
    location: providerLocation(invite),
  }).toString();
  return url.toString();
}

function buildProviderNotes(): Record<CalendarProvider, string> {
  return {
    google: "Google Calendar opens a web prefill URL. User must save the event.",
    outlook: "Outlook.com opens a web prefill URL. User must save the event.",
    office365: "Microsoft 365 opens a web prefill URL. Tenant rendering may vary; user must save the event.",
    apple: "Apple Calendar does not have a stable public web compose URL for this scope. Open or import the ICS file.",
    zoho: "Zoho uses the ICS fallback in this scope. Open or import the ICS file unless a Zoho-specific URL/API path is approved later.",
    ics: "Portable RFC 5545 ICS fallback for calendar clients that support importing or opening .ics files.",
  };
}

function base64Utf8(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function safeFileName(value: string): string {
  const safe = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "onboarding-calendar-invite";
}

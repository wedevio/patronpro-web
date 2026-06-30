import { z } from "zod";
import {
  buildCalendarInvite,
  CalendarInviteValidationError,
  type CalendarInviteInput,
  type CalendarInviteOutput,
  type CalendarProvider,
} from "./calendar-invite";

export interface OnboardingInviteFormState {
  clientName: string;
  businessName: string;
  clientEmail: string;
  meetingTitle: string;
  start: string;
  end: string;
  timeZone: string;
  description: string;
  location: string;
  joinUrl: string;
  organizerName: string;
  organizerEmail: string;
}

export interface OnboardingInviteAuditPayload {
  id: string;
  bead: "ppweb-0ka.3";
  createdAt: string;
  mode: "dry-run";
  client: {
    name: string;
    businessName: string;
    email: string;
  };
  meeting: CalendarInviteInput;
  emailPreview: {
    subject: string;
    bodyText: string;
  };
  calendar: {
    fileName: string;
    providerLinks: Record<CalendarProvider, string>;
    icsTextSha256: string;
  };
  status: {
    generated: true;
    previewed: true;
    persisted: "not-recorded" | "dry-run-no-database" | "dry-run-adapter-deferred";
    sent: false;
    ghlMutation: false;
  };
}

export interface OnboardingInvitePreviewResult {
  input: CalendarInviteInput;
  calendar: CalendarInviteOutput;
  subject: string;
  bodyText: string;
  auditPayload: OnboardingInviteAuditPayload;
}

export type OnboardingInviteFieldErrors = Partial<Record<keyof OnboardingInviteFormState | "_form", string>>;

export class OnboardingInvitePreviewError extends Error {
  readonly fieldErrors: OnboardingInviteFieldErrors;

  constructor(message: string, fieldErrors: OnboardingInviteFieldErrors) {
    super(message);
    this.name = "OnboardingInvitePreviewError";
    this.fieldErrors = fieldErrors;
  }
}

export const DEFAULT_ONBOARDING_INVITE_FORM: OnboardingInviteFormState = {
  clientName: "Demo Client",
  businessName: "Demo Auto Shop",
  clientEmail: "client@example.com",
  meetingTitle: "PatronPro Onboarding",
  start: "2026-06-15T10:00:00-06:00",
  end: "2026-06-15T11:00:00-06:00",
  timeZone: "America/Mexico_City",
  description: "We will review your PatronPro setup, calendars, website, phone, and launch checklist.",
  location: "Google Meet",
  joinUrl: "https://meet.google.com/demo-demo-demo",
  organizerName: "PatronPro",
  organizerEmail: "support@example.com",
};

const inviteFormSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  businessName: z.string().trim().min(1, "Business name is required"),
  clientEmail: z.email("Client email must be valid"),
  meetingTitle: z.string().trim().min(1, "Meeting title is required"),
  start: z.string().trim().min(1, "Start time is required"),
  end: z.string().trim().min(1, "End time is required"),
  timeZone: z.string().trim().min(1, "Timezone is required"),
  description: z.string().trim(),
  location: z.string().trim(),
  joinUrl: z.string().trim(),
  organizerName: z.string().trim().min(1, "Organizer name is required"),
  organizerEmail: z.email("Organizer email must be valid"),
});

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function buildOnboardingInvitePreview(
  form: OnboardingInviteFormState,
  options: { createdAt?: string } = {}
): OnboardingInvitePreviewResult {
  const data = parseForm(form);
  const createdAt = options.createdAt ?? new Date().toISOString();
  const input = toCalendarInput(data, createdAt);

  try {
    const calendar = buildCalendarInvite(input);
    const subject = `PatronPro onboarding: ${data.businessName}`;
    const bodyText = buildBodyText(data, input);
    const icsTextSha256 = sha256Hex(calendar.icsText);

    return {
      input,
      calendar,
      subject,
      bodyText,
      auditPayload: {
        id: input.id,
        bead: "ppweb-0ka.3",
        createdAt,
        mode: "dry-run",
        client: {
          name: data.clientName,
          businessName: data.businessName,
          email: data.clientEmail,
        },
        meeting: input,
        emailPreview: {
          subject,
          bodyText,
        },
        calendar: {
          fileName: calendar.fileName,
          providerLinks: calendar.links,
          icsTextSha256,
        },
        status: {
          generated: true,
          previewed: true,
          persisted: "not-recorded",
          sent: false,
          ghlMutation: false,
        },
      },
    };
  } catch (err) {
    if (err instanceof CalendarInviteValidationError) {
      throw new OnboardingInvitePreviewError(err.message, { _form: err.message });
    }
    throw err;
  }
}

export function updateAuditPersistence(
  payload: OnboardingInviteAuditPayload,
  persisted: "dry-run-no-database" | "dry-run-adapter-deferred"
): OnboardingInviteAuditPayload {
  return {
    ...payload,
    status: {
      ...payload.status,
      persisted,
      sent: false,
      ghlMutation: false,
    },
  };
}

export function sha256Hex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const bitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, bitLength, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      words[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(words[i - 15], 7) ^ rotr(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rotr(words[i - 2], 17) ^ rotr(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((word) => word.toString(16).padStart(8, "0")).join("");
}

function parseForm(form: OnboardingInviteFormState): OnboardingInviteFormState {
  const parsed = inviteFormSchema.safeParse(form);
  if (!parsed.success) {
    const fieldErrors: OnboardingInviteFieldErrors = {};
    const flattened = parsed.error.flatten().fieldErrors;
    for (const [key, messages] of Object.entries(flattened)) {
      if (messages?.[0]) fieldErrors[key as keyof OnboardingInviteFormState] = messages[0];
    }
    throw new OnboardingInvitePreviewError("Invalid onboarding invite form", fieldErrors);
  }
  return parsed.data;
}

function toCalendarInput(form: OnboardingInviteFormState, createdAt: string): CalendarInviteInput {
  return {
    id: slugify(`${form.businessName}-${form.meetingTitle}-${form.start}`),
    title: form.meetingTitle,
    start: form.start,
    end: form.end,
    timeZone: form.timeZone,
    description: form.description,
    location: form.location || form.joinUrl,
    joinUrl: form.joinUrl,
    organizerName: form.organizerName,
    organizerEmail: form.organizerEmail,
    attendeeName: form.clientName,
    attendeeEmail: form.clientEmail,
    createdAt,
  };
}

function buildBodyText(form: OnboardingInviteFormState, input: CalendarInviteInput): string {
  const start = formatInTimeZone(input.start, form.timeZone);
  const end = formatInTimeZone(input.end, form.timeZone);
  return [
    `Hi ${form.clientName},`,
    "",
    `Your PatronPro onboarding meeting is scheduled for ${start} - ${end} (${form.timeZone}).`,
    "",
    `Meeting: ${form.meetingTitle}`,
    `Business: ${form.businessName}`,
    `Join link: ${form.joinUrl || "Provided separately"}`,
    "",
    "Add this meeting to your calendar using one of the links below:",
    "- Google Calendar",
    "- Outlook.com",
    "- Microsoft 365",
    "- Apple/iOS or other calendar app via .ics",
    "",
    `Reply to ${form.organizerEmail} if anything needs to change.`,
  ].join("\n");
}

function formatInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "onboarding-invite";
}

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

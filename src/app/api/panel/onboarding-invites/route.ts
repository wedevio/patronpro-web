import { NextResponse } from "next/server";
import { buildCalendarInvite, CalendarInviteValidationError } from "@/lib/onboarding/calendar-invite";
import { sha256Hex, type OnboardingInviteAuditPayload } from "@/lib/onboarding/invite-preview";

export const dynamic = "force-dynamic";

const SHA256_RE = /^[a-f0-9]{64}$/;

interface InviteRecordResponse {
  ok: true;
  mode: "dry-run";
  persisted: "dry-run-no-database" | "dry-run-adapter-deferred";
  sent: false;
  ghlMutation: false;
}

export async function POST(request: Request): Promise<Response> {
  let payload: OnboardingInviteAuditPayload;
  try {
    payload = (await request.json()) as OnboardingInviteAuditPayload;
  } catch {
    return errorResponse("invalid_json", "Request body must be valid JSON");
  }

  const validationError = validatePayload(payload);
  if (validationError) return validationError;

  let checksum: string;
  try {
    const rebuilt = buildCalendarInvite(payload.meeting);
    checksum = sha256Hex(rebuilt.icsText);
  } catch (err) {
    if (err instanceof CalendarInviteValidationError) {
      return errorResponse("invalid_meeting", err.message);
    }
    throw err;
  }
  if (checksum !== payload.calendar.icsTextSha256) {
    return errorResponse("checksum_mismatch", "ICS checksum does not match meeting payload");
  }

  const persisted: InviteRecordResponse["persisted"] =
    process.env.POSTGRES_URL || process.env.DATABASE_URL ? "dry-run-adapter-deferred" : "dry-run-no-database";

  return NextResponse.json({
    ok: true,
    mode: "dry-run",
    persisted,
    sent: false,
    ghlMutation: false,
  } satisfies InviteRecordResponse);
}

function validatePayload(payload: OnboardingInviteAuditPayload): Response | null {
  if (!payload || typeof payload !== "object") {
    return errorResponse("invalid_payload", "Payload is required");
  }
  if (payload.mode !== "dry-run") {
    return errorResponse("live_mode_rejected", "Only dry-run invite records are accepted");
  }
  if (payload.status?.sent !== false) {
    return errorResponse("sent_rejected", "Invite records cannot mark email as sent in this dry-run route");
  }
  if (payload.status?.ghlMutation !== false) {
    return errorResponse("ghl_mutation_rejected", "Invite records cannot mark GHL mutation in this dry-run route");
  }
  if (payload.bead !== "ppweb-0ka.3") {
    return errorResponse("invalid_bead", "Payload bead must be ppweb-0ka.3");
  }
  if (!SHA256_RE.test(payload.calendar?.icsTextSha256 ?? "")) {
    return errorResponse("invalid_checksum", "ICS checksum must be lowercase SHA-256 hex");
  }
  if (!payload.meeting || typeof payload.meeting !== "object") {
    return errorResponse("invalid_meeting", "Meeting payload is required");
  }
  return null;
}

function errorResponse(code: string, message: string): Response {
  return NextResponse.json({ ok: false, code, error: message }, { status: 400 });
}

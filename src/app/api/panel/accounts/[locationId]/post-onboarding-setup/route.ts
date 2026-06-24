import { NextResponse } from "next/server";
import { requirePpSession } from "@/lib/auth/require-session";
import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { runPostOnboardingSetup, type PostOnboardingSetupMode } from "@/lib/ghl/post-onboarding-setup";
import { getAllSubmissions } from "@/lib/panel/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MODES = new Set<PostOnboardingSetupMode>(["inspect", "apply", "verify", "reset"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
): Promise<Response> {
  try {
    const auth = await requirePpSession();
    if (auth instanceof NextResponse) return auth;

    const { locationId } = await params;
    if (!locationId) {
      return NextResponse.json({ error: "Falta locationId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({})) as {
      mode?: PostOnboardingSetupMode;
      resetText?: string;
      resetLocationId?: string;
    };
    const mode = body.mode ?? "inspect";
    if (!MODES.has(mode)) {
      return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
    }

    const token = await getLocationAccessToken(locationId);
    const submissions = await getAllSubmissions();
    const submission = submissions.find((item) => item.locationId === locationId) ?? null;
    const result = await runPostOnboardingSetup({
      mode,
      locationId,
      token,
      submission,
      resetText: body.resetText,
      resetLocationId: body.resetLocationId,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (err) {
    console.error("[POST /api/panel/accounts/[locationId]/post-onboarding-setup]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

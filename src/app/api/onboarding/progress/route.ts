import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";
import type { OnboardingFormData } from "@/lib/onboarding/types";

export const dynamic = "force-dynamic";

interface SaveProgressRequest {
  locationId: string;
  contactId: string;
  currentStep: number;
  formData: Partial<OnboardingFormData>;
}

interface LoadProgressResponse {
  success: boolean;
  data?: {
    currentStep: number;
    formData: Partial<OnboardingFormData>;
  } | null;
  error?: string;
}

/**
 * GET: Loads the saved onboarding progress for a given location and contact
 * Returns null if no progress is found
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const contactId = searchParams.get("contactId");

    // Validate inputs
    if (!locationId || !contactId) {
      return NextResponse.json(
        { error: "locationId and contactId are required query parameters" } as LoadProgressResponse,
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    const { data, error } = await adminClient
      .from("onboarding_progress")
      .select("current_step, form_data")
      .eq("location_id", locationId)
      .eq("contact_id", contactId)
      .single();

    // If no record found, that's not an error - just return no data
    if (error) {
      // PGRST116 = no rows found - that's expected, not an error
      if (error.code === "PGRST116" || error.message?.includes("No rows")) {
        return NextResponse.json(
          {
            success: true,
            data: null,
          } as LoadProgressResponse,
          { status: 200 }
        );
      }
      // Any other error is a real problem
      console.error("[onboarding-progress] Load error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return NextResponse.json(
        { error: "Failed to load progress", success: false } as LoadProgressResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          currentStep: data.current_step,
          formData: data.form_data,
        },
      } as LoadProgressResponse,
      { status: 200 }
    );
  } catch (err) {
    console.error("[onboarding-progress] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error", success: false } as LoadProgressResponse,
      { status: 500 }
    );
  }
}

/**
 * POST: Saves the current onboarding progress to the database
 * Allows multi-device resumption
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveProgressRequest;

    const { locationId, contactId, currentStep, formData } = body;

    // Validate inputs
    if (!locationId || !contactId) {
      return NextResponse.json(
        { error: "locationId and contactId are required" },
        { status: 400 }
      );
    }

    if (currentStep < 1 || currentStep > 5) {
      return NextResponse.json(
        { error: "currentStep must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!formData || typeof formData !== "object") {
      return NextResponse.json(
        { error: "formData must be an object" },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    // Upsert the progress record
    const { data, error } = await adminClient
      .from("onboarding_progress")
      .upsert(
        {
          location_id: locationId,
          contact_id: contactId,
          current_step: currentStep,
          form_data: formData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "location_id,contact_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[onboarding-progress] Save error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return NextResponse.json(
        { error: "Failed to save progress", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          updatedAt: data.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[onboarding-progress] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes the saved onboarding progress for a given location and contact
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { locationId: string; contactId: string };

    const { locationId, contactId } = body;

    // Validate inputs
    if (!locationId || !contactId) {
      return NextResponse.json(
        { error: "locationId and contactId are required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    const { error } = await adminClient
      .from("onboarding_progress")
      .delete()
      .eq("location_id", locationId)
      .eq("contact_id", contactId);

    if (error) {
      console.error("[onboarding-progress] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete progress" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[onboarding-progress] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


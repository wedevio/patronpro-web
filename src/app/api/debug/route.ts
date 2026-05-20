import { NextResponse } from "next/server";

// TEMPORARY — remove after debugging
export async function GET() {
  return NextResponse.json({
    // Supabase
    SUPABASE_URL:   process.env.NEXT_PUBLIC_SUPABASE_URL   ? "SET" : "MISSING",
    SUPABASE_ANON:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    SERVICE_ROLE:   process.env.SUPABASE_SERVICE_ROLE_KEY  ? "SET" : "MISSING",
    // GHL
    GHL_CLIENT_ID:      process.env.GHL_CLIENT_ID      ? "SET" : "MISSING",
    GHL_CLIENT_SECRET:  process.env.GHL_CLIENT_SECRET  ? "SET" : "MISSING",
    GHL_COMPANY_ID:     process.env.GHL_COMPANY_ID     ? "SET" : "MISSING",
    GHL_REFRESH_TOKEN:  process.env.GHL_REFRESH_TOKEN  ? "SET" : "MISSING",
    // Redis (Upstash)
    KV_REST_API_URL:    process.env.KV_REST_API_URL    ? "SET" : "MISSING",
    KV_REST_API_TOKEN:  process.env.KV_REST_API_TOKEN  ? "SET" : "MISSING",
  });
}

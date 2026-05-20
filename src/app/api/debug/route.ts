import { NextResponse } from "next/server";

// TEMPORARY — remove after debugging
export async function GET() {
  return NextResponse.json({
    SUPABASE_URL:  process.env.NEXT_PUBLIC_SUPABASE_URL  ? "SET" : "MISSING",
    SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    SERVICE_ROLE:  process.env.SUPABASE_SERVICE_ROLE_KEY  ? "SET" : "MISSING",
  });
}

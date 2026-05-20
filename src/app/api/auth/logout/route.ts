import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(): Promise<Response> {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}

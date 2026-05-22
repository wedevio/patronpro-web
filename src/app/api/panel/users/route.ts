import { NextResponse } from "next/server";
import { requirePpSession } from "@/lib/auth/require-session";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const auth = await requirePpSession();
  if (auth instanceof NextResponse) return auth;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: "Error fetching users" }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
  }));

  return NextResponse.json({ users });
}

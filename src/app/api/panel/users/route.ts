import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const ppToken = cookieStore.get("pp-session")?.value;
  if (!ppToken) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await verifyPpSession(ppToken);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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

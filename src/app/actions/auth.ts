"use server";

import { cookies } from "next/headers";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const COOKIE_NAME   = "pp-session";

type LoginResult = { error: string } | { success: true };

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Completá todos los campos." };

  try {
    // Call Supabase Auth REST directly — no @supabase/ssr
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return { error: "Credenciales incorrectas." };

    const data = await res.json() as { access_token: string; expires_in: number };
    const cookieStore = await cookies();

    // Set a simple signed session cookie
    cookieStore.set(COOKIE_NAME, data.access_token, {
      httpOnly: true,
      secure:   true,
      sameSite: "lax",
      path:     "/",
      maxAge:   data.expires_in ?? 3600,
    });

    return { success: true };
  } catch {
    return { error: "Error de conexión. Intentá de nuevo." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

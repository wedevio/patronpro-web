"use server";

import { cookies } from "next/headers";
import { SignJWT, decodeJwt } from "jose";

const COOKIE_NAME = "pp-session";

type LoginResult = { error: string } | { success: true };

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Completá todos los campos." };

  // Read env vars at runtime (not module-level) to avoid undefined on Vercel
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    console.error("[auth] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return { error: "Error de configuración del servidor." };
  }

  try {
    // Call Supabase Auth REST directly — no @supabase/ssr
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnon,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return { error: "Credenciales incorrectas." };

    const data = await res.json() as { access_token: string; expires_in: number };
    const cookieStore = await cookies();

    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (!nextAuthSecret) {
      console.error("[auth] Missing env var: NEXTAUTH_SECRET");
      return { error: "Error de configuración del servidor." };
    }

    // Decode Supabase JWT (no signature verification — we just need the payload claims)
    const decoded = decodeJwt(data.access_token);

    // Create our own JWT signed with NEXTAUTH_SECRET so proxy.ts can verify it
    const ppJwt = await new SignJWT({ email: decoded.email, sub: decoded.sub })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(nextAuthSecret));

    cookieStore.set(COOKIE_NAME, ppJwt, {
      httpOnly: true,
      secure:   true,
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (err) {
    console.error("[auth] loginAction fetch error:", err);
    return { error: "Error de conexión. Intentá de nuevo." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

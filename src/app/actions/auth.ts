"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const COOKIE_NAME = "pp-session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type LoginResult = { error: string } | { success: true };

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const username = readFormString(formData, "username") || readFormString(formData, "email");
  const password = readFormString(formData, "password");

  if (!username || !password) return { error: "Completá todos los campos." };

  const expectedUsername =
    process.env.PATRONPRO_PANEL_LOGIN_USERNAME ?? process.env.LAB_PANEL_EMAIL;
  const expectedPassword =
    process.env.PATRONPRO_PANEL_LOGIN_PASSWORD ?? process.env.LAB_PANEL_PASSWORD;
  const sessionSecret = process.env.SUPPORT_SESSION_SECRET;

  if (!expectedUsername || !expectedPassword || !sessionSecret) {
    console.error(
      "[auth] Missing env vars: SUPPORT_SESSION_SECRET plus PATRONPRO_PANEL_LOGIN_USERNAME/PASSWORD"
    );
    return { error: "Error de configuración del servidor." };
  }

  try {
    if (
      !constantTimeStringEqual(username, expectedUsername) ||
      !constantTimeStringEqual(password, expectedPassword)
    ) {
      return { error: "Credenciales incorrectas." };
    }

    const cookieStore = await cookies();
    const ppJwt = await new SignJWT({ email: expectedUsername, sub: expectedUsername, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(sessionSecret));

    cookieStore.set(COOKIE_NAME, ppJwt, {
      httpOnly: true,
      secure:   true,
      sameSite: "lax",
      path:     "/",
      maxAge:   COOKIE_MAX_AGE_SECONDS,
    });

    return { success: true };
  } catch (err) {
    console.error("[auth] loginAction error:", err);
    return { error: "Error de conexión. Intentá de nuevo." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function constantTimeStringEqual(value: string, expected: string) {
  const valueHash = createHash("sha256").update(value).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(valueHash, expectedHash);
}

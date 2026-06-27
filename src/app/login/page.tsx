"use client";

import { Suspense, useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { loginAction } from "@/app/actions/auth";

// ─── Inner form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(loginAction, null);
  const nextPath = safeNextPath(searchParams.get("next"));

  // Redirect client-side on success (avoids redirect() throw from Server Action)
  useEffect(() => {
    if (state && "success" in state) {
      router.push(nextPath);
    }
  }, [state, router, nextPath]);

  const error = state && "error" in state ? state.error : null;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Usuario
        </label>
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          className="w-full px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-lg outline-none
                     focus:border-[#1E2C46] focus:ring-2 focus:ring-[#1E2C46]/10 transition-all
                     bg-slate-50 placeholder:text-slate-300"
          placeholder="Usuario"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Contraseña
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-lg outline-none
                     focus:border-[#1E2C46] focus:ring-2 focus:ring-[#1E2C46]/10 transition-all
                     bg-slate-50 placeholder:text-slate-300"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-500 text-[13px] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg font-bold text-[14px] text-white transition-opacity disabled:opacity-60"
        style={{ background: "#F67D0A" }}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

function safeNextPath(value: string | null) {
  if (!value || value.startsWith("//")) return "/panel";
  if (value.startsWith("/panel") || value.startsWith("/collaborators")) return value;
  return "/panel";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#1E2C46" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Image
            src="/assets/PatronPro-white.png"
            width={180}
            height={46}
            alt="PatronPro"
            priority
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl px-8 py-10">
          <h1 className="text-[20px] font-bold text-[#1E2C46] mb-1">Panel de administración</h1>
          <p className="text-slate-400 text-[13px] mb-8">Ingresá con tus credenciales para continuar.</p>

          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

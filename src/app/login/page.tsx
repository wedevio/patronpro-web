"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { loginAction } from "@/app/actions/auth";

// ─── Inner form (useSearchParams requires Suspense) ───────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/panel";

  const [error, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {/* Pass next as hidden field so the Server Action can redirect correctly */}
      <input type="hidden" name="next" value={next} />

      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full px-3.5 py-2.5 text-[14px] border border-slate-200 rounded-lg outline-none
                     focus:border-[#1E2C46] focus:ring-2 focus:ring-[#1E2C46]/10 transition-all
                     bg-slate-50 placeholder:text-slate-300"
          placeholder="admin@patronpro.com"
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

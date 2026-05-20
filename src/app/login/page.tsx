"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// ─── Inner form (needs Suspense because of useSearchParams) ───────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/panel";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        setError(json.error ?? "Error al iniciar sesión");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-bold text-[14px] text-white transition-opacity disabled:opacity-60"
        style={{ background: "#F67D0A" }}
      >
        {loading ? "Ingresando…" : "Ingresar"}
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
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/assets/PatronPro-white.png"
            width={180}
            height={46}
            alt="PatronPro"
            priority
          />
        </div>

        {/* Card */}
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

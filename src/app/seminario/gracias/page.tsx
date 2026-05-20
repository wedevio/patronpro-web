import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¡Estás registrado! — Seminario PatronPro",
  description: "Gracias por registrarte en el seminario de PatronPro. Te enviaremos recordatorios por email y SMS.",
};

export default function SeminarioGraciasPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f3ec" }}>
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-5" style={{ backgroundColor: "#1E2C46" }}>
        <img
          src="/assets/PatronPro-white.png"
          alt="PatronPro"
          className="h-8"
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div
          className="w-full max-w-[560px] bg-white rounded-[28px] p-10 text-center flex flex-col items-center gap-6 border"
          style={{ boxShadow: "0 24px 80px rgba(20,35,58,0.12)", borderColor: "rgba(30,44,70,0.08)" }}
        >
          {/* Check icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[36px] font-black flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F67D0A, #FFAA38)", boxShadow: "0 12px 30px rgba(246,125,10,0.30)" }}
          >
            ✓
          </div>

          {/* Logo */}
          <img src="/assets/PatronPro-white.png" alt="PatronPro" className="h-7" />

          <div className="flex flex-col gap-3">
            <h1
              className="font-black leading-[1.05] tracking-[-0.03em]"
              style={{ fontSize: "clamp(26px,3.5vw,36px)", color: "#1E2C46" }}
            >
              ¡Estás registrado!
            </h1>
            <p className="leading-[1.65] text-[17px]" style={{ color: "#5f6f88" }}>
              Gracias por reservar tu plaza en el seminario de PatronPro.
            </p>
          </div>

          {/* Info cards */}
          <div className="w-full grid gap-3 mt-2">
            {[
              {
                icon: "📧",
                title: "Confirmación por email",
                body: "Te hemos enviado un email con todos los detalles del seminario.",
              },
              {
                icon: "📱",
                title: "Recordatorio por SMS",
                body: "Recibirás un SMS el día anterior y una hora antes del seminario para que no se te olvide.",
              },
              {
                icon: "📅",
                title: "Añade al calendario",
                body: "En el email de confirmación encontrarás el enlace para añadirlo a tu calendario.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 items-start text-left p-4 rounded-[16px] border"
                style={{ borderColor: "rgba(30,44,70,0.08)", background: "#fafafa" }}
              >
                <span className="text-[22px] flex-shrink-0 mt-[1px]">{item.icon}</span>
                <div>
                  <div className="font-bold text-[15px]" style={{ color: "#1E2C46" }}>{item.title}</div>
                  <div className="text-[13px] leading-[1.5] mt-0.5" style={{ color: "#5f6f88" }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-[16px] font-bold text-[15px] transition-all hover:-translate-y-0.5 w-full mt-2"
            style={{ background: "rgba(30,44,70,0.06)", color: "#1E2C46", border: "1px solid rgba(30,44,70,0.10)" }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-[13px]" style={{ color: "#9aabb8" }}>
        © {new Date().getFullYear()} PatronPro · Todos los derechos reservados
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Reserva tu Plaza — Seminario PatronPro",
  description: "Reserva tu plaza en el próximo seminario de PatronPro. Aprende a gestionar tu negocio de construcción con más orden y control.",
};

export default function SeminarioPage() {
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

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: copy */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-12">
            <span
              className="inline-flex items-center gap-[10px] px-[14px] py-[10px] rounded-full text-[13px] font-bold uppercase tracking-[0.02em] w-fit"
              style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46" }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#F67D0A]" />
              Próximo Seminario
            </span>
            <h1
              className="font-black leading-[1.05] tracking-[-0.035em]"
              style={{ fontSize: "clamp(28px,4vw,48px)", color: "#1E2C46" }}
            >
              Reserva tu Plaza en el Próximo Seminario
            </h1>
            <p className="leading-[1.65] text-[17px]" style={{ color: "#5f6f88" }}>
              Aprende cómo los mejores contratistas usan PatronPro para organizar clientes, cotizaciones, pagos y seguimiento en un solo sistema.
            </p>

            {/* Bullets */}
            <ul className="grid gap-3 mt-2">
              {[
                "Sistema centralizado para gestionar clientes y trabajos",
                "Cotizaciones, invoices y pagos online en un solo lugar",
                "Automatizaciones y follow-ups para no perder ningún lead",
                "Ideal para contratistas sin experiencia técnica",
              ].map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span
                    className="w-[22px] h-[22px] rounded-full text-white flex items-center justify-center flex-shrink-0 mt-[1px]"
                    style={{ background: "linear-gradient(135deg,#F67D0A,#FFAA38)" }}
                  >
                    <Check size={13} strokeWidth={3} color="white" />
                  </span>
                  <span className="text-[15px] leading-[1.6]" style={{ color: "#5f6f88" }}>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-[13px] mt-2" style={{ color: "#9aabb8" }}>
              Recibirás confirmación por email y SMS con todos los detalles.
            </p>
          </div>

          {/* Right: booking widget */}
          <div
            className="bg-white rounded-[24px] overflow-hidden border"
            style={{ boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
          >
            <iframe
              src="https://api.getpatronpro.com/widget/booking/mqNO536vCEWWPSYC5suA"
              style={{ width: "100%", border: "none", overflow: "hidden", minHeight: "700px" }}
              scrolling="no"
              id="mqNO536vCEWWPSYC5suA_1779299010068"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[13px]" style={{ color: "#9aabb8" }}>
        © {new Date().getFullYear()} PatronPro · Todos los derechos reservados
      </footer>

      <Script
        src="https://api.getpatronpro.com/js/form_embed.js"
        strategy="afterInteractive"
      />
    </div>
  );
}

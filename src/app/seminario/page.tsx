import type { Metadata } from "next";
import Script from "next/script";

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
          src="/assets/PatronPro.svg"
          alt="PatronPro"
          className="h-8"
        />
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-5 py-12 flex flex-col gap-8">
        {/* Headline */}
        <div className="text-center flex flex-col gap-3">
          <span
            className="inline-flex items-center gap-[10px] px-[14px] py-[10px] rounded-full text-[13px] font-bold uppercase tracking-[0.02em] w-fit mx-auto"
            style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46" }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#F67D0A]" />
            Próximo Seminario
          </span>
          <h1
            className="font-black leading-[1.05] tracking-[-0.035em]"
            style={{ fontSize: "clamp(28px,4vw,44px)", color: "#1E2C46" }}
          >
            Reserva tu Plaza en el Próximo Seminario
          </h1>
          <p className="leading-[1.65] max-w-[52ch] mx-auto text-[17px]" style={{ color: "#5f6f88" }}>
            Aprende cómo los mejores contratistas usan PatronPro para organizar clientes, cotizaciones, pagos y seguimiento en un solo sistema.
          </p>
        </div>

        {/* Booking widget */}
        <div
          className="bg-white rounded-[24px] overflow-hidden border"
          style={{ boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
        >
          <iframe
            src="https://api.getpatronpro.com/widget/booking/mqNO536vCEWWPSYC5suA"
            style={{ width: "100%", border: "none", overflow: "hidden", minHeight: "680px" }}
            scrolling="no"
            id="mqNO536vCEWWPSYC5suA_1779299010068"
          />
        </div>

        <p className="text-center text-[13px]" style={{ color: "#9aabb8" }}>
          Recibirás confirmación por email y SMS con todos los detalles.
        </p>
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

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteLayout";

export const metadata: Metadata = {
  title: "¡Setup en marcha! | PatronPro",
  description: "Tu Setup Fee ha sido recibido. Nos pondremos en contacto contigo para comenzar a montar tu plataforma.",
};

export default function ThankYouSetupPage() {
  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#f9fafb 0%,#fff8f0 100%)" }}>
        {/* Minimal header */}
        <header className="border-b" style={{ borderColor: "rgba(30,44,70,0.08)", background: "rgba(255,255,255,0.90)" }}>
          <div className="w-full max-w-[1180px] mx-auto px-5 min-h-[72px] flex items-center">
            <Link href="/">
              <Image src="/assets/PatronPro.svg" alt="PatronPro" width={150} height={36} priority />
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <div className="w-full max-w-[600px] text-center">

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ background: "rgba(246,125,10,0.12)" }}
            >
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <path d="M19 5v4M19 29v4M5 19H9M29 19h4M9.22 9.22l2.83 2.83M25.95 25.95l2.83 2.83M9.22 28.78l2.83-2.83M25.95 12.05l2.83-2.83" stroke="#F67D0A" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="19" cy="19" r="6" stroke="#F67D0A" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Heading */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide mb-5"
              style={{ background: "rgba(246,125,10,0.10)", color: "#F67D0A" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F67D0A]" />
              Setup en proceso
            </div>

            <h1
              className="text-[38px] sm:text-[46px] font-black leading-[1.1] tracking-[-0.03em] mb-4"
              style={{ color: "#1E2C46" }}
            >
              Tu plataforma empieza<br />a tomar forma.
            </h1>

            <p className="text-[18px] leading-[1.65] mb-10" style={{ color: "#5f6f88" }}>
              Hemos recibido tu pago. Nuestro equipo se pondrá en contacto contigo en las próximas horas para confirmar tus datos y arrancar la configuración de tu plataforma personalizada.
            </p>

            {/* What we'll set up */}
            <div
              className="rounded-[24px] p-8 text-left mb-8"
              style={{ background: "#fff", border: "2px solid rgba(30,44,70,0.08)", boxShadow: "0 16px 50px rgba(20,35,58,0.08)" }}
            >
              <h2 className="text-[16px] font-extrabold mb-5 uppercase tracking-[0.05em]" style={{ color: "#1E2C46" }}>
                Lo que montamos para ti
              </h2>

              <ul className="flex flex-col gap-4">
                {[
                  { icon: "🌐", title: "Dominio personalizado", desc: "Conectamos tu dominio para que todo luzca con tu marca desde el primer día." },
                  { icon: "📞", title: "Teléfono, llamadas y email", desc: "Número dedicado, bandeja de entrada unificada y todo listo para comunicarte con tus clientes." },
                  { icon: "🖥️", title: "Landings y calendarios", desc: "Páginas de captura y calendarios de reserva configurados y conectados a tu pipeline." },
                  { icon: "🚀", title: "Listo para operar", desc: "Cuando terminemos, solo tendrás que entrar y empezar a trabajar. Sin configuración técnica de tu parte." },
                ].map(({ icon, title, desc }) => (
                  <li key={title} className="flex gap-4">
                    <span className="text-[22px] flex-shrink-0 mt-[1px]">{icon}</span>
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: "#1E2C46" }}>{title}</p>
                      <p className="text-[14px] leading-[1.6] mt-0.5" style={{ color: "#5f6f88" }}>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account email note */}
            <div
              className="rounded-[18px] p-5 mb-8 flex gap-4 text-left"
              style={{ background: "rgba(246,125,10,0.06)", border: "1.5px solid rgba(246,125,10,0.20)" }}
            >
              <span className="text-[20px] flex-shrink-0">✉️</span>
              <p className="text-[14px] leading-[1.65]" style={{ color: "#3d4f68" }}>
                <strong>También recibirás un correo</strong> con el enlace para registrarte en la plataforma. Si no lo ves en tu bandeja de entrada, revisa la carpeta de <strong>Spam o Promociones</strong> — a veces aterriza ahí.
              </p>
            </div>

            {/* Support */}
            <p className="text-[14px] leading-[1.65]" style={{ color: "#8491a7" }}>
              ¿Tienes alguna pregunta antes de que te contactemos?{" "}
              <a
                href="mailto:info@getpatronpro.com"
                className="font-semibold underline transition-colors hover:text-[#F67D0A]"
                style={{ color: "#1E2C46" }}
              >
                info@getpatronpro.com
              </a>
              . Estamos aquí.
            </p>

          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

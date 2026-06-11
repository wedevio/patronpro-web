import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Download, Mail, Phone } from "lucide-react";
import { SiteFooter } from "@/components/SiteLayout";
import {
  ONBOARDING_CONTACT_EMAIL,
  ONBOARDING_CONTACT_PHONE,
  ONBOARDING_CONTACT_VCARD_PATH,
  PAID_ONBOARDING_STEPS,
} from "@/lib/onboarding/thank-you-content";

export const metadata: Metadata = {
  title: "Gracias por tu compra | PatronPro",
  description: "Sigue los 3 pasos de onboarding para completar tu formulario, reservar tu cita y preparar tu cuenta PatronPro.",
};

export default function ThankYouPage() {
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
          <div className="w-full max-w-[580px] text-center">

            {/* Check icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ background: "rgba(246,125,10,0.12)" }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M8 18.5L14.5 25.5L28 11" stroke="#F67D0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Heading */}
            <h1
              className="text-[38px] sm:text-[46px] font-black leading-[1.1] tracking-[-0.03em] mb-4"
              style={{ color: "#1E2C46" }}
            >
              ¡Pago recibido!
            </h1>

            <p className="text-[18px] leading-[1.65] mb-8" style={{ color: "#5f6f88" }}>
              Gracias por confiar en PatronPro. Sigue estos 3 pasos para completar tu onboarding y dejar lista la configuración inicial de tu cuenta.
            </p>

            {/* Card */}
            <div
              className="rounded-[24px] p-8 text-left mb-8"
              style={{ background: "#fff", border: "2px solid rgba(30,44,70,0.08)", boxShadow: "0 16px 50px rgba(20,35,58,0.08)" }}
            >
              <h2 className="text-[18px] font-extrabold mb-5" style={{ color: "#1E2C46" }}>
                ¿Qué pasa ahora?
              </h2>

              <ol className="flex flex-col gap-5">
                {PAID_ONBOARDING_STEPS.map(({ number, title, body }) => (
                  <li key={number} className="flex gap-4">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0 mt-[2px]"
                      style={{ background: "rgba(246,125,10,0.12)", color: "#F67D0A" }}
                    >
                      {number}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: "#1E2C46" }}>{title}</p>
                      <p className="text-[14px] leading-[1.6] mt-0.5" style={{ color: "#5f6f88" }}>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-[24px] p-6 sm:p-7 text-left mb-8"
              style={{ background: "#fff", border: "2px solid rgba(30,44,70,0.08)", boxShadow: "0 16px 50px rgba(20,35,58,0.08)" }}
            >
              <h2 className="text-[16px] font-extrabold mb-4" style={{ color: "#1E2C46" }}>
                Guarda nuestros datos de contacto
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 mb-5 text-[14px]" style={{ color: "#5f6f88" }}>
                <div>
                  <p className="font-semibold" style={{ color: "#1E2C46" }}>Teléfono</p>
                  <p>{ONBOARDING_CONTACT_PHONE}</p>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "#1E2C46" }}>Email</p>
                  <p>{ONBOARDING_CONTACT_EMAIL}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={`tel:${ONBOARDING_CONTACT_PHONE}`}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#1E2C46" }}
                >
                  <Phone size={16} />
                  Llamar o guardar número
                </a>
                <a
                  href={`mailto:${ONBOARDING_CONTACT_EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: "#d7dce5", color: "#1E2C46" }}
                >
                  <Mail size={16} />
                  Guardar email
                </a>
                <a
                  href={ONBOARDING_CONTACT_VCARD_PATH}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: "#d7dce5", color: "#1E2C46" }}
                >
                  <Download size={16} />
                  Descargar contacto
                </a>
              </div>
            </div>

            {/* Support note */}
            <p className="text-[14px] leading-[1.65]" style={{ color: "#8491a7" }}>
              ¿Necesitas ayuda antes de completar el formulario o reservar tu cita?{" "}
              <a
                href={`mailto:${ONBOARDING_CONTACT_EMAIL}`}
                className="font-semibold underline transition-colors hover:text-[#F67D0A]"
                style={{ color: "#1E2C46" }}
              >
                {ONBOARDING_CONTACT_EMAIL}
              </a>
              . Te responderemos lo antes posible.
            </p>

          </div>
        </main>

        <SiteFooter />
      </div>
      <Script
        id="affiliate-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function() {
  var t = document.createElement("script");
  t.type = "text/javascript", t.async = !0, t.src = 'https://api.getpatronpro.com/js/am.js', t.onload = t.onreadystatechange = function() {
    var t = this.readyState;
    if (!t || "complete" == t || "loaded" == t) try {
      affiliateManager.init('hHLZC7FaTtUINPf3cbHd', 'https://backend.leadconnectorhq.com', '.getpatronpro.com')
    } catch (t) {}
  };
  var e = document.getElementsByTagName("script")[0];
  e.parentNode.insertBefore(t, e)
})();`,
        }}
      />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteLayout";

export const metadata: Metadata = {
  title: "¡Bienvenido a PatronPro! | Confirma tu cuenta",
  description: "Tu suscripción está en proceso. Revisa tu correo para activar tu cuenta PatronPro.",
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
              Bienvenido a PatronPro. Estás a un paso de tener tu negocio de construcción centralizado y bajo control.
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
                {[
                  {
                    n: "1",
                    title: "Revisa tu bandeja de entrada",
                    body: "En los próximos minutos te llegará un correo con el enlace para crear tu cuenta y acceder a la plataforma.",
                  },
                  {
                    n: "2",
                    title: "¿No ves el correo? Revisa Spam",
                    body: "A veces los correos de activación aterrizan en la carpeta de Spam o Promociones. Márcalo como «No es spam» para no perder ninguna comunicación.",
                  },
                  {
                    n: "3",
                    title: "Empieza a construir tu negocio desde el primer día",
                    body: "Añade tus primeros clientes, manda cotizaciones, activa el seguimiento automático y deja que PatronPro trabaje por ti mientras tú te concentras en la obra.",
                  },
                ].map(({ n, title, body }) => (
                  <li key={n} className="flex gap-4">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0 mt-[2px]"
                      style={{ background: "rgba(246,125,10,0.12)", color: "#F67D0A" }}
                    >
                      {n}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: "#1E2C46" }}>{title}</p>
                      <p className="text-[14px] leading-[1.6] mt-0.5" style={{ color: "#5f6f88" }}>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Support note */}
            <p className="text-[14px] leading-[1.65]" style={{ color: "#8491a7" }}>
              ¿Algún problema con tu acceso o tu pago?{" "}
              <a
                href="mailto:info@getpatronpro.com"
                className="font-semibold underline transition-colors hover:text-[#F67D0A]"
                style={{ color: "#1E2C46" }}
              >
                info@getpatronpro.com
              </a>
              . Te respondemos en menos de 24 horas.
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

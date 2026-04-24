"use client";

import { useState } from "react";
import Image from "next/image";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import CheckoutModal from "@/components/CheckoutModal";

// ─── Eyebrow badge ───
function Eyebrow({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[10px] px-[14px] py-[10px] rounded-full text-[13px] font-bold uppercase tracking-[0.02em] w-fit ${
        dark ? "bg-white/10 text-white" : "bg-orange/10 text-navy"
      }`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-orange" />
      {children}
    </span>
  );
}

// ─── Bullet list ───
function BulletList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="list-none p-0 m-0 grid gap-3 mt-5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="w-2.5 h-2.5 rounded-full mt-[7px] flex-shrink-0 bg-gradient-to-b from-orange to-orange-2" />
          <span
            className="leading-[1.65] text-[16px]"
            style={{ color: dark ? "rgba(255,255,255,0.78)" : "#5f6f88" }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Price Feature list ───
function PriceFeatures({ items }: { items: string[] }) {
  return (
    <ul className="list-none p-0 m-0 grid gap-3 border-t border-navy/10 pt-6">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start text-[15px] font-medium text-[#24324a]">
          <span className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-orange to-orange-2 text-white text-[12px] font-black flex items-center justify-center flex-shrink-0 mt-[1px]">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Section heading helpers ───
const H2_SIZE = "clamp(26px,3vw,40px)";
const LEAD_SIZE = "clamp(17px,2vw,21px)";
// Shared h2 classes — no max-width by default, callers add their own if needed
const H2_BASE = "font-black leading-[1.02] tracking-[-0.035em]";

// ─── Screenshot tabs data ───
const TABS = [
  {
    id: "pipeline",
    label: "Pipeline de trabajos",
    title: "Visualiza en qué etapa está cada cliente o proyecto.",
    lead: "Desde nuevo lead hasta cotización, aprobación, trabajo en proceso, invoice y pago. Todo el proceso visible de un vistazo.",
    bullets: [
      "Ver trabajos abiertos y pendientes.",
      "Asignar responsables y crear tareas.",
      "Detectar oportunidades paradas antes de perderlas.",
    ],
    img: "/assets/Pipelines.png",
    alt: "Pipeline de trabajos en PatronPro",
  },
  {
    id: "conversations",
    label: "Conversaciones con clientes",
    title: "Todo el historial del cliente en un solo lugar.",
    lead: "Responde SMS y emails desde PatronPro, registra llamadas y notas. Todo el equipo ve lo mismo antes de contestar.",
    bullets: [
      "SMS y email centralizados.",
      "Registro de llamadas y notas internas.",
      "WhatsApp disponible como extra si lo necesitas.",
    ],
    img: "/assets/Conversations.png",
    alt: "Conversaciones con clientes en PatronPro",
  },
  {
    id: "invoices",
    label: "Cotizaciones, invoices y pagos",
    title: "Deja de manejar documentos importantes en formatos sueltos.",
    lead: "Crea cotizaciones profesionales, genera invoices, cobra online con link de pago y registra receipts. Todo conectado al mismo trabajo.",
    bullets: [
      "Cotizaciones y contratos profesionales.",
      "Invoices vinculados al cliente y al trabajo.",
      "Cobro online con Stripe integrado.",
    ],
    img: "/assets/Dashboard-invoices.png",
    alt: "Cotizaciones e invoices en PatronPro",
  },
];

// ─── FAQ item ───
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-[16px] overflow-hidden transition-all"
      style={{ borderColor: "rgba(30,44,70,0.10)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-[17px] cursor-pointer bg-white hover:bg-[#fafafa] transition-colors"
        style={{ color: "#1E2C46" }}
      >
        <span>{q}</span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[14px] font-black"
          style={{
            background: "#F67D0A",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-5 text-[16px] leading-[1.65]"
          style={{ color: "#5f6f88", borderTop: "1px solid rgba(30,44,70,0.06)" }}
        >
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  );
}

// ─── Contact Form ───
function ContactForm() {
  const [legalChecked, setLegalChecked] = useState(false);
  const [legalError, setLegalError] = useState(false);

  const inputCls = "min-h-[52px] rounded-[16px] border px-4 text-[16px] font-medium bg-white outline-none transition-colors w-full";
  const inputStyle = { borderColor: "rgba(30,44,70,0.10)", color: "#24324a" };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!legalChecked) { setLegalError(true); return; }
    setLegalError(false);
    // TODO: wire to backend
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[22px] p-8 grid gap-4 border"
      style={{ boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
    >
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <input required type="text" placeholder="Nombre *" className={inputCls} style={inputStyle} />
        <input required type="text" placeholder="Apellido *" className={inputCls} style={inputStyle} />
      </div>
      <input required type="email" placeholder="Email *" className={inputCls} style={inputStyle} />
      <input type="text" placeholder="Nombre de la empresa" className={inputCls} style={inputStyle} />
      <textarea
        required
        placeholder="Mensaje *"
        rows={5}
        className="rounded-[16px] border px-4 py-3 text-[16px] font-medium bg-white outline-none transition-colors w-full resize-none"
        style={inputStyle}
      />

      {/* Required legal checkbox */}
      <div className="flex items-start gap-3 pt-2">
        <input
          id="legal"
          type="checkbox"
          checked={legalChecked}
          onChange={(e) => { setLegalChecked(e.target.checked); if (e.target.checked) setLegalError(false); }}
          className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#F67D0A] cursor-pointer"
        />
        <label htmlFor="legal" className="text-[14px] leading-[1.55] cursor-pointer" style={{ color: "#3d4f68" }}>
          Acepto los{" "}
          <a href="/terms" className="font-semibold underline" style={{ color: "#F67D0A" }}>Términos</a>,{" "}
          la <a href="/privacy" className="font-semibold underline" style={{ color: "#F67D0A" }}>Política de Privacidad</a>{" "}
          y la <a href="/cookies" className="font-semibold underline" style={{ color: "#F67D0A" }}>Política de Cookies</a>{" "}
          de PatronPro.
        </label>
      </div>
      {legalError && (
        <p className="text-[13px] -mt-2" style={{ color: "#e03131" }}>
          Por favor, acepta los Términos, la Política de Privacidad y la Política de Cookies de PatronPro para continuar.
        </p>
      )}

      <button
        type="submit"
        className="min-h-[56px] rounded-[18px] font-bold text-[16px] text-white w-full transition-all hover:-translate-y-0.5"
        style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.28)" }}
      >
        Enviar mensaje
      </button>
    </form>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab]         = useState("pipeline");
  const [checkoutPlan, setCheckoutPlan]   = useState<"monthly" | "annual" | null>(null);
  const activePanel = TABS.find((t) => t.id === activeTab)!;

  return (
    <>
      <SiteHeader />
      <main id="top">
        {/* ═══════════ HERO ═══════════ */}
        {/* Change 1: 2-column grid (copy left, image right) + stats row below */}
        <section className="py-14 md:py-16">
          <div className="w-full max-w-[1180px] mx-auto px-5 flex flex-col gap-6">
            {/* Top row: copy LEFT, image RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-center">
              {/* Left: copy — no card, no border, no background */}
              <div className="flex flex-col gap-5">
                <Eyebrow>Sistema de gestión para contratistas</Eyebrow>
                <h1
                  className="font-black text-[#1E2C46] leading-[1.0] tracking-[-0.04em]"
                  style={{ fontSize: "clamp(32px,4.5vw,54px)" }}
                >
                  Todo tu negocio de construcción en un solo sistema.
                </h1>
                <p className="leading-[1.65] max-w-[52ch]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                  Organiza clientes, mensajes, cotizaciones, invoices, pagos, tareas y calendario desde una sola plataforma hecha para contratistas.
                </p>
                <div className="flex flex-wrap gap-[14px]">
                  <a
                    href="#precios"
                    className="inline-flex items-center justify-center min-h-[56px] px-7 rounded-[18px] font-bold text-[16px] text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.28)" }}
                  >
                    Crear cuenta
                  </a>
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center justify-center min-h-[56px] px-7 rounded-[18px] font-bold text-[16px] transition-all"
                    style={{ background: "rgba(30,44,70,0.06)", color: "#1E2C46", border: "1px solid rgba(30,44,70,0.10)" }}
                  >
                    Ver cómo funciona
                  </a>
                </div>
                <p className="text-[14px]" style={{ color: "#5f6f88" }}>
                  Sin contrato de permanencia. Cancela cuando quieras.
                </p>
              </div>

              {/* Right: image — aspect-[4/3], always visible */}
              <div className="relative rounded-[24px] overflow-hidden aspect-[4/3]">
                <Image
                  src="/assets/asset1.jpg"
                  alt="PatronPro"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Bottom row: 3 stat cards full width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { stat: "+ control", desc: "Sobre clientes, trabajos, pagos y próximos pasos." },
                { stat: "0 olvidos", desc: "Cada lead tiene seguimiento, responsable y siguiente acción." },
                { stat: "1 sistema", desc: "Para centralizar mensajes, cotizaciones, invoices, calendario y automatizaciones." },
              ].map((item) => (
                <div
                  key={item.stat}
                  className="p-5 rounded-[16px] bg-white border"
                  style={{ borderColor: "rgba(30,44,70,0.08)" }}
                >
                  <strong className="block text-[22px] leading-none mb-1 font-bold" style={{ color: "#1E2C46" }}>
                    {item.stat}
                  </strong>
                  <span className="text-[14px]" style={{ color: "#5f6f88" }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PROBLEMA ═══════════ */}
        <section id="problema" className="py-24">
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12">
              <Eyebrow>El problema</Eyebrow>
              {/* Change 2: removed max-w-[480px] — wider heading */}
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px" }}>
                Tu negocio no está desordenado porque falte trabajo.
              </h2>
              <p className="leading-[1.65] max-w-[72ch]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                Está desordenado porque todo está repartido. Un mensaje por aquí. Una llamada por allá. Una cotización en un Excel. Un invoice pendiente. Un cliente esperando respuesta. Un follow-up que nadie hizo. Y cuando eso pasa, se pierden trabajos, se retrasan pagos y el patrón acaba persiguiéndolo todo.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-[22px]">
              <div
                className="rounded-[22px] p-7 border"
                style={{ background: "#fff", boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
              >
                <h3 className="text-[22px] leading-[1.15] font-bold mb-3" style={{ color: "#1E2C46" }}>
                  Lo que suele pasar hoy
                </h3>
                <BulletList items={[
                  "Clientes escribiendo por SMS, email, llamadas o WhatsApp sin un historial claro.",
                  "Cotizaciones enviadas que nadie sigue después.",
                  "Invoices y pagos pendientes repartidos entre herramientas distintas.",
                  "Citas, tareas y próximos pasos dependiendo de la memoria de alguien.",
                  "Información del cliente perdida entre notas, hojas de cálculo y conversaciones sueltas.",
                  "Campañas, reviews y follow-ups que se hacen tarde o directamente no se hacen.",
                ]} />
              </div>
              <div
                className="rounded-[22px] p-7 border"
                style={{ background: "linear-gradient(180deg,#fff,#fcf5ea)", boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
              >
                <h3 className="text-[22px] leading-[1.15] font-bold mb-3" style={{ color: "#1E2C46" }}>
                  Lo que eso provoca
                </h3>
                <BulletList items={[
                  "Pierdes oportunidades por responder tarde.",
                  "Das una imagen menos profesional desde el primer contacto.",
                  "Tu equipo no siempre sabe qué toca hacer después.",
                  "El dueño acaba metido en todo porque el sistema no empuja solo.",
                  "Cuesta saber qué está pendiente, qué se cobró y qué cliente necesita atención.",
                ]} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ SOLUCIÓN ═══════════ */}
        <section id="solucion" className="py-24" style={{ background: "linear-gradient(180deg,#1E2C46 0%,#172337 100%)" }}>
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12">
              <Eyebrow dark>La solución</Eyebrow>
              {/* Change 2: max-w-[700px] so this fits in 2 lines */}
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "white", maxWidth: "700px" }}>
                Un sistema hecho para que el contratista tenga el control.
              </h2>
              <p className="leading-[1.65] max-w-[62ch]" style={{ fontSize: LEAD_SIZE, color: "rgba(255,255,255,0.80)" }}>
                PatronPro centraliza la parte más pesada del negocio: clientes, mensajes, cotizaciones, invoices, pagos, citas, tareas y automatizaciones. No necesitas más apps sueltas. Necesitas un sistema claro que trabaje contigo.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-[22px]">
              {[
                {
                  title: "Clientes y leads",
                  body: "Gestiona cada lead desde que entra hasta que se convierte en trabajo real. Guarda el historial, asigna responsables y define próximos pasos sin depender de la memoria de nadie.",
                },
                {
                  title: "Conversaciones centralizadas",
                  body: "SMS, email, llamadas y notas conectadas al cliente correcto. Todo el equipo puede ver qué se habló, qué falta y qué hay que hacer después. WhatsApp puede añadirse como extra si tu negocio lo necesita.",
                },
                {
                  title: "Cotizaciones, invoices y pagos",
                  body: "Crea cotizaciones, envíalas al cliente, genera invoices y permite pagos online con link. Todo conectado al mismo cliente y al mismo trabajo. Sin presupuestos perdidos. Sin invoices sueltos.",
                },
                {
                  title: "Automatizaciones y follow-ups",
                  body: "PatronPro puede enviar recordatorios, follow-ups, campañas de reactivación y solicitudes de review automáticamente. Empiezas con automatizaciones base y puedes crear las tuyas según cómo trabaje tu negocio.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-[22px] p-7 backdrop-blur-[8px]"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <h3 className="text-[22px] leading-[1.15] text-white font-bold mb-3">{card.title}</h3>
                  <p className="leading-[1.65] text-[16px]" style={{ color: "rgba(255,255,255,0.78)" }}>{card.body}</p>
                </div>
              ))}
            </div>


          </div>
        </section>

        {/* ═══════════ SCREENSHOTS / EL PRODUCTO ═══════════ */}
        <section id="producto" className="py-24" style={{ background: "#F7F3EC" }}>
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12">
              <Eyebrow>El producto</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px" }}>
                Todo lo que necesitas para operar mejor.
              </h2>
              <p className="leading-[1.65] max-w-[62ch]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                PatronPro está pensado para pequeños negocios de construcción que quieren trabajar con más orden sin convertirse en expertos en tecnología.
              </p>
            </div>

            <div className="flex gap-[10px] mb-8 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-5 py-[10px] rounded-full font-bold text-[14px] cursor-pointer border transition-all"
                  style={
                    activeTab === tab.id
                      ? { background: "#1E2C46", color: "white", borderColor: "#1E2C46" }
                      : { background: "white", color: "#5f6f88", borderColor: "rgba(30,44,70,0.12)" }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-[1fr_1.2fr] gap-9 items-center">
              <div className="grid gap-4 order-2 md:order-1">
                <h3 className="font-bold leading-[1.1] tracking-[-0.02em]" style={{ fontSize: "clamp(20px,2.5vw,28px)", color: "#1E2C46" }}>
                  {activePanel.title}
                </h3>
                <p className="leading-[1.65]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                  {activePanel.lead}
                </p>
                <BulletList items={activePanel.bullets} />
              </div>
              <div
                className="rounded-[28px] overflow-hidden order-1 md:order-2 border"
                style={{ boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
              >
                <Image
                  src={activePanel.img}
                  alt={activePanel.alt}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ BENEFICIOS ═══════════ */}
        <section id="beneficios" className="py-24">
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12">
              <Eyebrow>Lo que cambia</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px" }}>
                Menos caos. Más control. Más negocio bajo control.
              </h2>
              <p className="leading-[1.65] max-w-[62ch]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                El impacto real de trabajar con sistema frente a trabajar con memoria y buena voluntad.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
              {[
                { title: "Respondes más rápido", body: "Cuando todo entra en un solo sistema, puedes actuar antes. Y en construcción, muchas veces gana quien responde primero." },
                { title: "Haces mejor seguimiento", body: "Cotizaciones pendientes, clientes sin respuesta, trabajos parados y pagos pendientes dejan de depender de la memoria." },
                { title: "Te ves más profesional", body: "Responder bien, enviar documentos claros y cobrar con link transmite orden desde el primer contacto." },
                { title: "Cobras con menos fricción", body: "Cotización, invoice, receipt y pago online pueden vivir dentro del mismo flujo." },
                { title: "Tu equipo trabaja alineado", body: "Todos ven el mismo cliente, el mismo historial y el mismo próximo paso." },
                { title: "Puedes escalar sin romperte", body: "Un sistema que funciona con 2 personas puede crecer con 5, 10 o más sin convertir el negocio en una jungla." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-[22px] p-7 border"
                  style={{ boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
                >
                  <h3 className="text-[22px] leading-[1.15] font-bold mb-3" style={{ color: "#1E2C46" }}>
                    {card.title}
                  </h3>
                  <p className="leading-[1.65] text-[16px]" style={{ color: "#5f6f88" }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PARA QUIÉN ═══════════ */}
        <section className="py-[72px]">
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div
              className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 p-10 rounded-[28px] border"
              style={{ background: "linear-gradient(135deg,#fff 0%,#f7f1e7 100%)", boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
            >
              <div>
                <Eyebrow>Para quién es</Eyebrow>
                {/* Change 2: removed max-w-[480px] */}
                <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px", marginTop: "16px" }}>
                  Hecho para contratistas y pequeños negocios de construcción.
                </h2>
                <p className="leading-[1.65] max-w-[62ch] mt-[18px]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                  PatronPro está pensado para profesionales que ya saben hacer bien su trabajo, pero necesitan más orden para gestionar clientes, mensajes, cotizaciones, pagos y seguimiento.
                </p>
                <div className="flex flex-wrap gap-3 mt-[22px]">
                  {[
                    "Contratistas generales",
                    "Remodelación",
                    "Plomería",
                    "Electricidad",
                    "Roofing",
                    "Pintura",
                    "HVAC",
                    "Landscaping",
                    "Flooring",
                    "Pequeñas constructoras",
                  ].map((pill) => (
                    <span
                      key={pill}
                      className="px-4 py-[10px] rounded-full font-bold text-[14px] border"
                      style={{ background: "rgba(246,125,10,0.10)", color: "#1E2C46", borderColor: "rgba(246,125,10,0.18)" }}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[22px] p-7 border" style={{ borderColor: "rgba(30,44,70,0.08)" }}>
                <h3 className="text-[22px] leading-[1.15] font-bold mb-3" style={{ color: "#1E2C46" }}>
                  No necesitas ser técnico.
                </h3>
                <p className="leading-[1.65] text-[16px]" style={{ color: "#5f6f88" }}>
                  PatronPro está hecho para que puedas usarlo sin complicarte. Nosotros ponemos la estructura. Tú manejas tu negocio como el patrón que eres.
                </p>
                <BulletList items={[
                  "Lenguaje claro, experiencia simple.",
                  "Foco en lo importante: clientes, trabajos, pagos y seguimiento.",
                  "Sistema listo para arrancar desde el primer día.",
                ]} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CÓMO FUNCIONA ═══════════ */}
        {/* Change 3: horizontal 5-card grid */}
        <section id="como-funciona" className="py-24" style={{ background: "#F7F3EC" }}>
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12 text-center items-center justify-items-center">
              <Eyebrow>Cómo funciona</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px", textAlign: "center" }}>
                De solicitud a pago, todo conectado.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {
                  n: "01",
                  title: "Entra un lead",
                  body: "Puede llegar desde un formulario, llamada, SMS, email o campaña. PatronPro lo registra y lo conecta con el cliente correcto.",
                },
                {
                  n: "02",
                  title: "Se organiza el seguimiento",
                  body: "Asignas responsable, etapa, tarea, cita o próximo paso. El sistema te ayuda a que nada se quede olvidado.",
                },
                {
                  n: "03",
                  title: "Envías cotización",
                  body: "Creas una cotización profesional y la envías desde el mismo sistema. Todo queda asociado al cliente y al trabajo.",
                },
                {
                  n: "04",
                  title: "Cierras, facturas y cobras",
                  body: "Generas invoice, envías link de pago y registras el cobro. Menos vueltas. Más control.",
                },
                {
                  n: "05",
                  title: "Automatizas el después",
                  body: "Pide reviews, reactiva clientes antiguos y mantén el contacto sin hacerlo todo manualmente.",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="bg-white rounded-[16px] p-5 border"
                  style={{ borderColor: "rgba(30,44,70,0.08)", boxShadow: "0 4px 16px rgba(20,35,58,0.06)" }}
                >
                  <div className="text-[32px] font-black leading-none mb-2" style={{ color: "#F67D0A" }}>
                    {step.n}
                  </div>
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "#1E2C46" }}>{step.title}</h3>
                  <p className="text-[13px] leading-[1.5]" style={{ color: "#5f6f88" }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ POR QUÉ PATRONPRO ═══════════ */}
        <section className="py-24 bg-white">
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12">
              <Eyebrow>Por qué PatronPro</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px" }}>
                No es otro software más. Es tu sistema de trabajo.
              </h2>
              <p className="leading-[1.65] max-w-[62ch]" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                Muchas herramientas te dan funciones. PatronPro te da una estructura pensada para operar mejor desde el primer día.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
              {[
                { title: "Sistema listo para arrancar", body: "Empiezas con una base preparada para gestionar clientes, trabajos, cotizaciones, mensajes y follow-ups." },
                { title: "Plantillas y automatizaciones incluidas", body: "No partes de cero. Tienes campañas, recordatorios y flujos base que puedes adaptar a tu negocio." },
                { title: "Flexible según tu forma de trabajar", body: "Puedes ajustar pipelines, automatizaciones, formularios y procesos según cómo funcione tu empresa." },
                { title: "Pensado para contratistas", body: "Lenguaje claro, experiencia simple y foco en lo importante: clientes, trabajos, pagos y seguimiento." },
                { title: "Accesible, pero serio", body: "No necesitas pagar miles en consultores ni montar un sistema enorme. Necesitas una herramienta que funcione." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-[22px] p-7 border"
                  style={{ background: "#fff", boxShadow: "0 18px 60px rgba(20,35,58,0.10)", borderColor: "rgba(30,44,70,0.08)" }}
                >
                  <h3 className="text-[22px] leading-[1.15] font-bold mb-3" style={{ color: "#1E2C46" }}>
                    {card.title}
                  </h3>
                  <p className="leading-[1.65] text-[16px]" style={{ color: "#5f6f88" }}>{card.body}</p>
                </div>
              ))}
              {/* asset5 as a visual card */}
              <div className="relative rounded-[22px] overflow-hidden min-h-[200px]" style={{ border: "1px solid rgba(30,44,70,0.08)" }}>
                <Image src="/assets/asset5.png" fill className="object-cover" alt="PatronPro en acción" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CENTRALIZA ═══════════ */}
        {/* Change 4D: Asset3.png as background layer with opacity-10 */}
        <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg,#1E2C46 0%,#172337 100%)" }}>
          <Image
            src="/assets/asset2.png"
            alt=""
            fill
            className="object-cover opacity-10"
          />
          <div className="relative z-10 w-full max-w-[860px] mx-auto px-5 text-center">
            <div className="flex justify-center mb-6">
              <Eyebrow dark>Centraliza lo que hoy está repartido</Eyebrow>
            </div>
            <h2 className={`${H2_BASE} text-white mb-12`} style={{ fontSize: H2_SIZE }}>
              Todo lo importante, conectado.
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                "SMS", "Email", "Llamadas", "WhatsApp (extra)", "Formularios web",
                "Calendario", "Tareas", "Cotizaciones", "Invoices", "Pagos online",
                "Stripe", "Reviews", "Campañas automáticas", "Equipo", "Clientes", "Trabajos",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-5 py-3 rounded-full text-[15px] font-semibold border"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.90)", borderColor: "rgba(255,255,255,0.14)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PRECIOS ═══════════ */}
        <section id="precios" className="py-24" style={{ background: "#F7F3EC" }}>
          <div className="w-full max-w-[1180px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12 text-center items-center justify-items-center">
              <Eyebrow>Planes y precios</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px", textAlign: "center" }}>
                Simple, claro y sin letra pequeña.
              </h2>
              <p className="leading-[1.65] max-w-[62ch] text-center" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                Acceso completo al sistema desde el primer día. Sin límite de usuarios. Sin límite de contactos. Sin coste de implementación.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-[984px] mx-auto">
              {/* Mensual */}
              <div
                className="bg-white rounded-[28px] p-10 flex flex-col gap-6 relative transition-transform hover:-translate-y-1"
                style={{ border: "2px solid rgba(30,44,70,0.12)", boxShadow: "0 18px 60px rgba(20,35,58,0.10)" }}
              >
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: "#5f6f88" }}>
                    Suscripción mensual
                  </div>
                  <div className="flex items-end gap-[6px] leading-none mt-3">
                    <span className="text-[22px] font-extrabold mb-2" style={{ color: "#1E2C46" }}>$</span>
                    <span className="text-[72px] font-black tracking-[-0.04em]" style={{ color: "#1E2C46" }}>99</span>
                    <span className="text-[16px] font-semibold mb-[10px]" style={{ color: "#5f6f88" }}>/mes</span>
                  </div>
                  <p className="text-[15px] leading-[1.6] mt-3" style={{ color: "#5f6f88" }}>
                    Flexibilidad total para empezar sin compromiso. Cancela cuando quieras.
                  </p>
                </div>
                <PriceFeatures items={[
                  "Pipeline de ventas y trabajos",
                  "Gestión de leads y clientes",
                  "SMS y email centralizados",
                  "Cotizaciones e invoices",
                  "Pagos online con Stripe",
                  "Calendario y tareas",
                  "Automatizaciones base",
                  "App móvil",
                  "Usuarios ilimitados",
                  "Contactos ilimitados",
                  "Soporte incluido",
                ]} />
                <button
                  onClick={() => setCheckoutPlan("monthly")}
                  className="mt-auto flex items-center justify-center min-h-[58px] rounded-[18px] font-extrabold text-[16px] transition-all hover:-translate-y-0.5 cursor-pointer w-full"
                  style={{ background: "rgba(30,44,70,0.06)", color: "#1E2C46", border: "2px solid rgba(30,44,70,0.10)" }}
                >
                  Crear cuenta mensual
                </button>
              </div>

              {/* Anual */}
              <div
                className="rounded-[28px] p-10 flex flex-col gap-6 relative transition-transform hover:-translate-y-1"
                style={{ background: "linear-gradient(160deg,#fff 0%,#fff8f0 100%)", border: "2px solid #F67D0A", boxShadow: "0 18px 60px rgba(20,35,58,0.10)" }}
              >
                <div
                  className="absolute top-[-14px] left-1/2 -translate-x-1/2 px-5 py-[6px] rounded-full text-white text-[12px] font-extrabold whitespace-nowrap tracking-[0.04em]"
                  style={{ background: "linear-gradient(90deg,#F67D0A,#FFAA38)" }}
                >
                  ⭐ Más popular · Ahorra $189
                </div>
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: "#5f6f88" }}>
                    Suscripción anual
                  </div>
                  <div className="flex items-end gap-[6px] leading-none mt-3">
                    <span className="text-[22px] font-extrabold mb-2" style={{ color: "#1E2C46" }}>$</span>
                    <span className="text-[72px] font-black tracking-[-0.04em]" style={{ color: "#1E2C46" }}>999</span>
                    <span className="text-[16px] font-semibold mb-[10px]" style={{ color: "#5f6f88" }}>/año</span>
                  </div>
                  <div className="text-[14px] line-through -mt-2" style={{ color: "#5f6f88" }}>
                    Equivale a $83/mes · Sin descuento $1.188/año
                  </div>
                  <p className="text-[15px] leading-[1.6] mt-3" style={{ color: "#5f6f88" }}>
                    La opción más inteligente para negocios que quieren tomarse el sistema en serio.
                  </p>
                </div>
                <PriceFeatures items={[
                  "Todo lo del plan mensual",
                  "Ahorro de $189 frente al pago mensual",
                  "Prioridad en soporte",
                  "Acceso anticipado a nuevas funciones",
                  "Onboarding personalizado incluido",
                ]} />
                <button
                  onClick={() => setCheckoutPlan("annual")}
                  className="mt-auto flex items-center justify-center min-h-[58px] rounded-[18px] font-extrabold text-[16px] text-white transition-all hover:-translate-y-0.5 cursor-pointer w-full"
                  style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.32)" }}
                >
                  Crear cuenta anual — $999/año
                </button>
              </div>
            </div>

            <p className="text-center text-[13px] mt-6" style={{ color: "#5f6f88" }}>
              Las suscripciones se renuevan automáticamente hasta que las canceles. Pueden aplicarse cargos adicionales por uso de SMS, llamadas, números de teléfono, WhatsApp, email, funciones de IA, procesamiento de pagos y otros complementos. Puedes cancelar antes del siguiente ciclo de facturación.
            </p>
          </div>
        </section>

        {/* ═══════════ CTA FINAL ═══════════ */}
        <section className="py-24" style={{ background: "linear-gradient(180deg,#1E2C46 0%,#172337 100%)" }}>
          <div className="w-full max-w-[720px] mx-auto px-5 text-center">
            <div className="flex justify-center mb-6">
              <Eyebrow dark>El siguiente paso</Eyebrow>
            </div>
            <h2 className={`${H2_BASE} text-white max-w-[560px] mx-auto`} style={{ fontSize: H2_SIZE }}>
              El sistema que tu negocio de construcción necesitaba.
            </h2>
            <p className="leading-[1.65] mt-5 mx-auto" style={{ fontSize: LEAD_SIZE, color: "rgba(255,255,255,0.80)" }}>
              Deja de perseguir mensajes, cotizaciones, pagos y clientes en mil sitios distintos. PatronPro te ayuda a centralizar tu operación, automatizar el seguimiento y trabajar con más control desde el primer día.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-9">
              <a
                href="#precios"
                className="inline-flex items-center justify-center min-h-[62px] px-9 rounded-[18px] font-bold text-[17px] text-white transition-all hover:-translate-y-0.5"
                style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.28)" }}
              >
                Crear cuenta
              </a>
              {/* Change 6: "Ver planes" now white with navy text for contrast */}
              <a
                href="#precios"
                className="inline-flex items-center justify-center min-h-[62px] px-9 rounded-[18px] font-bold text-[17px] transition-all hover:-translate-y-0.5 hover:bg-white/90"
                style={{ background: "white", color: "#1E2C46" }}
              >
                Ver planes
              </a>
            </div>
            <p className="mt-5 text-[14px]" style={{ color: "rgba(255,255,255,0.50)" }}>
              Sin contrato de permanencia · Usuarios ilimitados · Contactos ilimitados · Soporte incluido
            </p>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        {/* Change 5: FAQ moved here — just before Contacto */}
        <section className="py-24 bg-white">
          <div className="w-full max-w-[720px] mx-auto px-5">
            <div className="grid gap-[18px] mb-12 text-center items-center justify-items-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "640px", textAlign: "center" }}>
                Preguntas frecuentes
              </h2>
            </div>
            <div className="grid gap-3">
              {[
                { q: "¿PatronPro es un CRM?", a: "Sí, pero no lo vendemos como un CRM complicado. PatronPro es un sistema para organizar clientes, trabajos, mensajes, cotizaciones, invoices, pagos, calendario y seguimiento en un solo lugar." },
                { q: "¿Necesito saber de tecnología?", a: "No. Está pensado para contratistas y pequeños negocios de construcción, no para equipos técnicos." },
                { q: "¿Puedo usarlo desde el móvil?", a: "Sí. Puedes gestionar clientes, mensajes, calendario, tareas y pagos desde la app móvil." },
                { q: "¿Incluye SMS y email?", a: "Sí. SMS y email forman parte de la base del sistema. El coste de uso de SMS puede cobrarse aparte según volumen." },
                { q: "¿Incluye WhatsApp?", a: "WhatsApp puede añadirse como extra si tu negocio lo necesita." },
                { q: "¿Puedo crear cotizaciones e invoices?", a: "Sí. Puedes crear cotizaciones, enviarlas, generar invoices, cobrar online y registrar receipts." },
                { q: "¿Se integra con Stripe?", a: "Sí. Puedes conectar tu cuenta de Stripe para aceptar pagos online." },
                { q: "¿Hay límite de usuarios o contactos?", a: "No. PatronPro incluye usuarios y contactos ilimitados." },
                { q: "¿Puedo automatizar follow-ups?", a: "Sí. Puedes usar automatizaciones base o crear tus propias campañas para seguimiento, reviews, reactivación de clientes y más." },
                { q: "¿Tengo que pagar setup fee?", a: "No. No hay coste de implementación inicial." },
                { q: "¿Puedo cancelar cuando quiera?", a: "Sí. En el plan mensual puedes cancelar cuando quieras. En el plan anual pagas el año completo por adelantado." },
                { q: "¿Cuál es la política de reembolsos?", a: "PatronPro ofrece un período de reembolso de 7 días desde la primera compra. Las renovaciones, cargos por uso y complementos no son reembolsables salvo que lo exija la ley aplicable." },
              ].map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CONTACTO ═══════════ */}
        <section id="contacto" className="py-24 bg-white">
          <div className="w-full max-w-[600px] mx-auto px-5">
            <div className="grid gap-[18px] mb-10 text-center items-center justify-items-center">
              <Eyebrow>Contacto</Eyebrow>
              <h2 className={H2_BASE} style={{ fontSize: H2_SIZE, color: "#1E2C46", maxWidth: "480px", textAlign: "center" }}>
                ¿Tienes dudas? Escríbenos.
              </h2>
              <p className="leading-[1.65] text-center" style={{ fontSize: LEAD_SIZE, color: "#5f6f88" }}>
                Cuéntanos tu caso y te respondemos en menos de 24h.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* ─── CHECKOUT MODAL ─── */}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </>
  );
}

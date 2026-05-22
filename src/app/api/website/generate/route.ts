import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `=================================================================
SYSTEM PROMPT — PATRONPRO LANDING GENERATOR
=================================================================

Eres un experto senior en diseño web, copywriting comercial y GoHighLevel. Generas landing pages completas en HTML/CSS/JS mínimo, listas para pegar en un bloque Custom HTML de GHL.

La página debe parecer diseñada a medida para cada negocio, no una plantilla genérica. Adapta layout, tono, colores, iconos, secciones y composición según sector, público, estilo y posicionamiento.

=================================================================
REGLAS GHL — OBLIGATORIAS
=================================================================

Los merge tags de GHL se procesan server-side. Úsalos directamente en HTML, nunca en JavaScript.

Custom values permitidos:

- {{custom_values.company_name}}
- {{custom_values.company_phone}}
- {{custom_values.company_address}}
- {{custom_values.automation_sender_email}}
- {{custom_values.hours_of_operation}}
- {{custom_values.dominio_web}}
- {{custom_values.logo}}
- {{custom_values.logo_cuadrado}}
- {{custom_values.landing_form}}

Logo horizontal:

<img src="{{custom_values.logo}}" alt="{{custom_values.company_name}}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;">{{custom_values.company_name}}</span>

Logo cuadrado:

<img src="{{custom_values.logo_cuadrado}}" alt="{{custom_values.company_name}}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;">{{custom_values.company_name}}</span>

Teléfono:

<a href="tel:{{custom_values.company_phone}}">{{custom_values.company_phone}}</a>

Email:

<a href="mailto:{{custom_values.automation_sender_email}}">{{custom_values.automation_sender_email}}</a>

El formulario debe aparecer una sola vez en contacto:

{{custom_values.landing_form}}

=================================================================
ICONOS E IMÁGENES
=================================================================

Puedes usar Lucide Icons:

<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

Icono:

<i data-lucide="shield-check" style="width:24px;height:24px;"></i>

Al final del body:

<script>
if (typeof lucide !== 'undefined') lucide.createIcons();
</script>

Elige iconos según sector. No repitas siempre los mismos.

Si el input incluye URLs de imágenes generadas con IA, úsalas:
- HERO_IMAGE_URL → hero section background
- ABOUT_IMAGE_URL → sección Nosotros
- CONTACT_IMAGE_URL → sección Contacto / CTA de urgencia

Para hero:

style="background-image:url('HERO_IMAGE_URL');background-size:cover;background-position:center;"

Siempre añade overlay oscuro semitransparente sobre imágenes de fondo.

Si no se proporcionan imágenes (o el valor es vacío), crea riqueza visual con CSS puro:
gradientes, texturas geométricas, shapes SVG inline, borders, patrones y cards. No uses imágenes externas no proporcionadas.

=================================================================
ESTRUCTURA OBLIGATORIA
=================================================================

Incluye siempre estas secciones en este orden, variando el layout interno:

1. Navbar fija: logo, links, CTA
2. Hero: headline, subtítulo, 2 CTAs, stats/trust, imagen o composición visual CSS
3. Banda de confianza: licencias, años, garantías, zona, respuesta rápida
4. Servicios: 6 servicios con iconos Lucide
5. Nosotros: historia, valores, horario y bloque visual
6. Proceso: 4 pasos claros
7. Testimonios: 3 tarjetas
8. CTA de urgencia: teléfono grande y acción clara
9. Contacto: datos + {{custom_values.landing_form}}
10. Footer: logo cuadrado, frase breve, /privacy-policy, /terms y contacto

=================================================================
DISEÑO Y VARIACIÓN
=================================================================

Mobile-first, responsive, rápido y limpio.

Usa Google Fonts:
- Inter para cuerpo
- Oswald, Bebas Neue, Archivo Black o Montserrat para titulares según estilo

Define variables CSS en :root:
--bg, --bg-soft, --surface, --primary, --primary-dark, --accent, --text, --muted, --border, --shadow

Usa la paleta del cliente como base, pero mejora contraste y armonía.

Cada landing debe variar. Elige internamente un patrón visual:
- split-screen
- full-background hero
- editorial premium
- contractor robusto
- local service directo
- emergency/phone-first
- minimal sofisticado
- diagonal/asimétrico

No uses siempre:
- mismo hero centrado
- mismos gradientes
- mismas cards
- mismos iconos
- mismos textos
- misma jerarquía

Incluye:
- hover effects
- botones con gradiente o interacción clara
- scroll fade-in con IntersectionObserver
- menú móvil
- smooth scroll
- buen espaciado
- jerarquía fuerte
- CTAs visibles en móvil

No uses:
- React, Bootstrap, Tailwind
- sliders o carousels
- JS para datos GHL
- imágenes externas no proporcionadas

=================================================================
COPYWRITING
=================================================================

Texto comercial, concreto y directo.

Evita frases genéricas como "somos tu mejor opción", "calidad y compromiso", "soluciones integrales".

Usa claims específicos:
- "Presupuestos claros antes de empezar."
- "Llegamos cuando dijimos que íbamos a llegar."
- "Trabajo limpio, directo y sin sorpresas."
- "Servicio local con respuesta rápida."

Adapta el tono según audiencia: familias, negocios, premium, emergencias o contractors.

Idioma: español neutro para público latino en EE.UU. salvo que se indique otro.

=================================================================
JAVASCRIPT PERMITIDO
=================================================================

Solo JS para: menú móvil, smooth scroll, IntersectionObserver, inicializar Lucide.
Nunca JS para: custom values, contenido dinámico, formularios.

=================================================================
OUTPUT
=================================================================

Devuelve únicamente el HTML completo. Sin explicaciones, sin markdown, sin backticks.
Empieza con <!DOCTYPE html> y termina con </html>.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebsiteGenerateParams {
  accountId: string;
  locationId: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  tagline: string;
  services: string[];
  primaryColor: string;
  secondaryColor: string;
  complementaryColor: string;
  domain: string;
  hoursOfOperation?: unknown;
  // Optional: pre-generated image URLs
  heroImageUrl?: string;
  aboutImageUrl?: string;
  contactImageUrl?: string;
}

// ─── User prompt ─────────────────────────────────────────────────────────────

function buildUserPrompt(p: WebsiteGenerateParams): string {
  const servicesList = p.services.join(", ");
  const hoursText = p.hoursOfOperation
    ? JSON.stringify(p.hoursOfOperation)
    : "Lunes a Viernes 8:00 AM - 5:00 PM";

  const imageBlock = (p.heroImageUrl || p.aboutImageUrl || p.contactImageUrl)
    ? `
IMÁGENES GENERADAS CON IA (úsalas como backgrounds con overlay oscuro):
- HERO_IMAGE_URL: ${p.heroImageUrl || ""}
- ABOUT_IMAGE_URL: ${p.aboutImageUrl || ""}
- CONTACT_IMAGE_URL: ${p.contactImageUrl || ""}
`
    : `
IMÁGENES: No se proporcionan imágenes. Crea composiciones visuales ricas usando solo CSS: gradientes, shapes geométricos, patrones y texturas. El resultado debe ser visualmente impactante sin depender de imágenes externas.
`;

  return `Genera una landing page completa para la siguiente empresa:

DATOS DE LA EMPRESA:
- Nombre: ${p.businessName}
- Dirección: ${p.address}, ${p.city}, ${p.state} ${p.zip}
- Tagline: ${p.tagline}
- Servicios principales: ${servicesList}
- Horarios: ${hoursText}
- Dominio: ${p.domain || "por definir"}

COLORES DE MARCA:
- PRIMARY_COLOR: ${p.primaryColor}
- SECONDARY_COLOR: ${p.secondaryColor}
- COMPLEMENTARY_COLOR: ${p.complementaryColor}
${imageBlock}
INSTRUCCIONES:
- Inventa 3 testimonios realistas y específicos del rubro
- El CTA principal debe ser llamar al teléfono {{custom_values.company_phone}}
- Incluye los servicios listados en la sección de servicios (expande a 6 si hay menos)
- Usa el tagline como referencia para crear el subtítulo del hero
- Usa iconos de Lucide apropiados para cada servicio y sección
- Adapta el tono y estilo visual según el sector y los colores de marca`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as WebsiteGenerateParams;
    const { accountId, businessName } = body;

    if (!accountId || !businessName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = getAdminClient();
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    // Mark as generating (preserve existing images)
    await db.from("account_websites").upsert(
      { account_id: accountId, status: "generating", html: null, error_message: null },
      { onConflict: "account_id" }
    );

    // ── Generate HTML ─────────────────────────────────────────────────────────
    const userPrompt = buildUserPrompt(body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000); // 90s

    let chatRes: Response;
    try {
      chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.4",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 16000,
          temperature: 0.7,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error("[website/generate] OpenAI error:", errText);
      await db.from("account_websites").upsert(
        { account_id: accountId, status: "error", error_message: `OpenAI error ${chatRes.status}: ${errText.slice(0, 200)}` },
        { onConflict: "account_id" }
      );
      return NextResponse.json({ error: "OpenAI generation failed" }, { status: 502 });
    }

    const chatJson = (await chatRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawHtml = chatJson.choices?.[0]?.message?.content ?? "";
    const html = rawHtml.replace(/^```html\s*/i, "").replace(/\s*```$/, "").trim();

    if (!html) {
      await db.from("account_websites").upsert(
        { account_id: accountId, status: "error", error_message: "El modelo no devolvió HTML" },
        { onConflict: "account_id" }
      );
      return NextResponse.json({ error: "Empty HTML response" }, { status: 502 });
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    await db.from("account_websites").upsert(
      {
        account_id:   accountId,
        status:       "ready",
        html,
        generated_at: new Date().toISOString(),
        error_message: null,
      },
      { onConflict: "account_id" }
    );

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[POST /api/website/generate]", err);
    return NextResponse.json(
      { error: isAbort ? "Tiempo agotado generando HTML. Intentá de nuevo." : "Error interno" },
      { status: 500 }
    );
  }
}

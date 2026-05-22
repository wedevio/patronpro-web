import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `=================================================================
SYSTEM PROMPT — PATRONPRO LANDING GENERATOR
=================================================================

Eres un experto en diseño web y copywriting para pequeñas empresas hispanas en EE.UU. Generas landing pages completas en HTML/CSS/JS mínimo, listas para pegar en un bloque Custom HTML de GHL.

Tu cliente típico: contratistas de construcción, plomeros, electricistas, pintores, techadores, HVAC, landscaping — negocios locales, hispanos, con clientes en zonas residenciales y comerciales de EE.UU. Personas trabajadoras que quieren una web que genere llamadas, no impresionar a startups de Silicon Valley.

La página debe verse como la de un negocio real y establecido. Seria, directa, que inspire confianza. No tech, no startup, no agencia digital.

=================================================================
LOGO — REGLA CRÍTICA
=================================================================

El logo del cliente va en el navbar y en el footer. NADA MÁS en cuanto a branding.
NO incluyas ningún otro logo, texto "PatronPro", watermark ni badge de ningún tipo.
El logo es SOLO el del cliente. No hay segunda marca en esta página.

Navbar — logo horizontal:
<img src="{{custom_values.logo}}" alt="{{custom_values.company_name}}" style="height:48px;width:auto;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;font-weight:700;font-size:1.1rem;">{{custom_values.company_name}}</span>

Footer — logo cuadrado (más pequeño):
<img src="{{custom_values.logo_cuadrado}}" alt="{{custom_values.company_name}}" style="height:40px;width:auto;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;font-weight:600;">{{custom_values.company_name}}</span>

=================================================================
REGLAS GHL — OBLIGATORIAS
=================================================================

Los merge tags de GHL se procesan server-side. Úsalos directamente en HTML, nunca en JavaScript.

Custom values disponibles:
- {{custom_values.company_name}}
- {{custom_values.company_phone}}
- {{custom_values.company_address}}
- {{custom_values.automation_sender_email}}
- {{custom_values.hours_of_operation}}
- {{custom_values.dominio_web}}
- {{custom_values.logo}}
- {{custom_values.logo_cuadrado}}
- {{custom_values.landing_form}}

Teléfono (siempre clickeable):
<a href="tel:{{custom_values.company_phone}}">{{custom_values.company_phone}}</a>

Email:
<a href="mailto:{{custom_values.automation_sender_email}}">{{custom_values.automation_sender_email}}</a>

Formulario — aparece UNA sola vez, en la sección de contacto:
{{custom_values.landing_form}}

=================================================================
COLORES — REGLA CRÍTICA
=================================================================

DEBES usar los colores exactos que te da el usuario (PRIMARY_COLOR, SECONDARY_COLOR, COMPLEMENTARY_COLOR).
Asígnalos así en :root:
  --primary:       PRIMARY_COLOR
  --primary-dark:  versión 15% más oscura de PRIMARY_COLOR (calcula con HSL)
  --accent:        SECONDARY_COLOR
  --complementary: COMPLEMENTARY_COLOR

Usa --primary para: navbar background, botones principales, headings importantes.
Usa --accent para: CTAs secundarios, highlights, íconos, hover states.
Usa --complementary para: acentos decorativos, badges, separadores.

Si los colores tienen bajo contraste con texto blanco, ajusta ligeramente para WCAG AA, pero mantén la identidad.
Si el usuario eligió "PatronPro elige colores", usa una paleta profesional para el sector (ej: navy + naranja para construcción).

=================================================================
ICONOS E IMÁGENES
=================================================================

Usa Lucide Icons — carga al inicio del body:
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

Icono inline:
<i data-lucide="hard-hat" style="width:24px;height:24px;"></i>

Al final del body, antes de </body>:
<script>if (typeof lucide !== 'undefined') lucide.createIcons();</script>

Elige iconos apropiados al sector. Para construcción: hard-hat, hammer, wrench, drill, home, building-2, shield-check, truck, etc.

IMÁGENES — siempre usa estos tres custom values como fuentes de imagen:
- Hero background:   {{custom_values.website_hero_image}}
- Sección Nosotros:  {{custom_values.website_about_image}}
- CTA de urgencia:   {{custom_values.website_contact_image}}

Hero con imagen y overlay:

<section style="background-image:url('{{custom_values.website_hero_image}}');background-size:cover;background-position:center;position:relative;">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
  <div style="position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:80px 24px;"><!-- contenido --></div>
</section>

El headline del hero NUNCA supera font-size:3.5rem en desktop. En móvil usa clamp o media query para reducirlo (máx 2.2rem en mobile). El subtítulo no supera 1.1rem. Todo el contenido del hero (textos, CTAs, stats) va dentro del div con max-width:1200px — el fondo de imagen/color puede ser full-width pero el texto NUNCA.

Si el custom value está vacío (imagen aún no generada), el overlay sobre fondo de color se ve igual de bien — no rompas el diseño por imágenes ausentes. Usa siempre el overlay y un color de fondo sólido como fallback:

background-color: var(--primary); /* fallback si la imagen no carga */

=================================================================
ESTRUCTURA OBLIGATORIA
=================================================================

Estas secciones en este orden — varía el layout interno, no la estructura:

1. NAVBAR fija: solo logo del cliente, links de navegación, botón "Llamar ahora"
2. HERO: headline directo y potente, subtítulo, 2 CTAs (llamar + cotizar), 3-4 stats de confianza, imagen o composición visual fuerte
3. BANDA DE CONFIANZA: licencias, años de experiencia, garantía, zona de servicio, tiempo de respuesta — en iconos horizontales
4. SERVICIOS: 6 servicios con íconos Lucide, descripción de 1 línea cada uno
5. NOSOTROS: historia breve del negocio, valores concretos, horarios de atención
6. PROCESO: 4 pasos simples (ej: Llamás → Presupuesto gratis → Aprobás → Trabajo listo)
7. TESTIMONIOS: 3 reseñas realistas con nombre, ciudad y estrellitas ★★★★★
8. CTA DE URGENCIA: fondo oscuro, teléfono grande y visible, llamado a la acción
9. CONTACTO: dirección, teléfono, email, horarios + formulario {{custom_values.landing_form}}
10. FOOTER: logo cuadrado del cliente, descripción breve, links /privacy-policy y /terms, teléfono

=================================================================
DISEÑO — ESTILO CONTRACTOR LOCAL
=================================================================

Mobile-first, responsive. Sin frameworks CSS externos (no Bootstrap, no Tailwind).

Google Fonts — elige según personalidad del negocio:
- Titulares: Oswald, Bebas Neue, Archivo Black, Montserrat, Anton
- Cuerpo: Inter, Open Sans, Lato

Variables CSS en :root (obligatorio):
--bg, --bg-soft, --surface, --primary, --primary-dark, --accent, --complementary, --text, --muted, --border, --shadow

ESTÉTICA: construcción seria, no tech-startup. Piensa en:
- Fuentes bold, impacto, peso visual
- Secciones con fondos alternados (claro/oscuro)
- Elementos angulares, no redondeados en exceso
- Cards con borde izquierdo de color (border-left: 4px solid var(--primary))
- Numbers/stats grandes y llamativos
- CTAs con padding generoso, texto en mayúsculas

Incluye obligatoriamente:
- Menú hamburguesa para móvil
- Smooth scroll
- Scroll fade-in con IntersectionObserver (class "fade-in" → opacity 0 → 1)
- Hover en botones y cards
- CTAs visibles y accesibles en móvil (mínimo 48px de alto)

NO uses:
- React, Vue, Bootstrap, Tailwind, jQuery
- Sliders o carousels
- JS para renderizar datos de GHL
- Imágenes externas que no se hayan proporcionado

=================================================================
COPYWRITING
=================================================================

Español neutro para público latino en EE.UU. — natural, directo, sin tecnicismos.

PROHIBIDO: "somos tu mejor opción", "calidad y compromiso", "soluciones integrales", "trabajamos con pasión".

USA claims concretos y verificables:
- "Más de X años sirviendo a la comunidad de [CIUDAD]"
- "Presupuesto gratis en 24 horas"
- "Llegamos a tiempo o te avisamos con anticipación"
- "Trabajo garantizado por escrito"
- "Sin sorpresas en el precio final"

Los testimonios deben sonar reales: nombre hispano + ciudad + detalle específico del trabajo (no "excelente servicio", sino "arreglaron mi techo en un día y quedó perfecto").

Adapta el hero headline al sector:
- Construcción: "Tu proyecto, construido para durar"
- Plomería: "Emergencias resueltas. El mismo día."
- Pintura: "Cada pared, un trabajo del que enorgullecerse"

=================================================================
JAVASCRIPT PERMITIDO
=================================================================

Solo para:
1. Menú móvil (toggle hamburguesa)
2. Smooth scroll a secciones
3. IntersectionObserver para fade-in
4. lucide.createIcons()

NUNCA JS para: leer custom values de GHL, formularios, ni contenido dinámico.

=================================================================
OUTPUT
=================================================================

Devuelve ÚNICAMENTE el HTML completo. Sin explicaciones, sin markdown, sin backticks.
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
}

// ─── User prompt ─────────────────────────────────────────────────────────────

function buildUserPrompt(p: WebsiteGenerateParams): string {
  const servicesList = p.services.join(", ");
  const hoursText = p.hoursOfOperation
    ? JSON.stringify(p.hoursOfOperation)
    : "Lunes a Viernes 8:00 AM - 5:00 PM";

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
    const timeout = setTimeout(() => controller.abort(), 270_000); // 270s (maxDuration is 300)

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

    // ── Trigger image generation (fire-and-forget) ────────────────────────────
    // Runs as an independent Vercel invocation with its own 300s timeout.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpatronpro.com";
    void fetch(`${appUrl}/api/website/generate-images`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId:    body.accountId,
        locationId:   body.locationId,
        businessName: body.businessName,
        services:     body.services,
        city:         body.city,
        state:        body.state,
        primaryColor: body.primaryColor,
      }),
    });

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

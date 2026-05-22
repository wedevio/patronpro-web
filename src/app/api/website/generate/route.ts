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

Si el input incluye imágenes generadas con IA, úsalas:
- HERO_IMAGE_URL → hero section background
- ABOUT_IMAGE_URL → sección Nosotros
- CONTACT_IMAGE_URL → sección Contacto / CTA de urgencia

Para hero:

style="background-image:url('HERO_IMAGE_URL');background-size:cover;background-position:center;"

Siempre añade overlay oscuro semitransparente sobre imágenes de fondo.

Si no hay imágenes, crea riqueza visual con CSS: gradientes, texturas, shapes, borders, patrones y cards. No uses stock externo.

=================================================================
ESTRUCTURA OBLIGATORIA
=================================================================

Incluye siempre estas secciones en este orden, variando el layout interno:

1. Navbar fija: logo, links, CTA
2. Hero: headline, subtítulo, 2 CTAs, stats/trust, imagen o composición visual
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
- React
- Bootstrap
- Tailwind
- sliders
- carousels
- JS para datos GHL
- imágenes externas no proporcionadas

=================================================================
COPYWRITING
=================================================================

Texto comercial, concreto y directo.

Evita frases genéricas:
- "somos tu mejor opción"
- "calidad y compromiso"
- "servicio excepcional"
- "soluciones integrales"
- "tu satisfacción es nuestra prioridad"

Usa claims específicos:
- "Presupuestos claros antes de empezar."
- "Llegamos cuando dijimos que íbamos a llegar."
- "Trabajo limpio, directo y sin sorpresas."
- "Servicio local con respuesta rápida."
- "Te explicamos el problema antes de cobrarte la solución."

Adapta el tono:
- Familias: confianza y tranquilidad
- Negocios: rapidez y mínima interrupción
- Premium: detalle y precisión
- Emergencias: velocidad y claridad
- Contractors: robustez y ejecución

Idioma:
- Usa el idioma indicado por el usuario.
- Si no se indica, usa español neutro para público latino en EE.UU.

=================================================================
JAVASCRIPT PERMITIDO
=================================================================

Solo JS para:
- menú móvil
- smooth scroll
- IntersectionObserver
- inicializar Lucide

Nunca JS para:
- insertar custom values
- generar contenido
- modificar datos de empresa
- cargar formularios

=================================================================
OUTPUT
=================================================================

Devuelve únicamente el HTML completo.

Sin explicaciones.
Sin markdown.
Sin triple backticks.

Empieza con:

<!DOCTYPE html>

Termina con:

</html>`;

// ─── Image prompt builders ─────────────────────────────────────────────────────

function buildHeroImagePrompt(p: ImagePromptParams): string {
  return `Create a realistic, high-end website hero image for a local ${p.sector} company serving ${p.serviceArea}.

Business positioning:
- Target audience: ${p.targetAudience}
- Main service focus: ${p.servicePriority}
- Supporting services: ${p.services}
- Visual style: ${p.visualStyle}
- Brand colors: ${p.brandColors}
- Price level: ${p.priceLevel}
- Desired feeling: ${p.positioning}

Scene:
Show a real-world ${p.sector} service environment related to ${p.servicePriority}, with professional workers, tools, vehicle, property or job site elements that make sense for the industry.

Composition:
Wide horizontal image, cinematic but natural, strong foreground subject, background depth, clean negative space on one side for landing page headline overlay.

Lighting:
Professional natural lighting, realistic shadows, polished but believable.

Mood:
Trustworthy, capable, local, modern, reliable.

Important:
No text, no fake logo, no watermark, no exaggerated AI style, no unsafe work, no distorted tools, no unrealistic hands, no clutter.

The image will be used as a dark-overlay hero background for a landing page.`;
}

function buildAboutImagePrompt(p: ImagePromptParams): string {
  return `Create a realistic website about-section image for a local ${p.sector} company in ${p.serviceArea}.

Show the owner, team, or skilled professional in a believable work context related to ${p.sector}. The image should communicate trust, experience, craftsmanship and local service.

Business personality:
- Tone: ${p.tone}
- Values: ${p.values}
- Target audience: ${p.targetAudience}
- Visual style: ${p.visualStyle}
- Brand colors: ${p.brandColors}

Composition:
Medium-wide horizontal image, professional but warm, natural pose, clean background, subtle brand-color accents if possible.

Avoid:
No fake text, no logo, no watermark, no generic handshake, no stock-photo office scene, no distorted tools or hands.

Use:
Realistic lighting, human trust, practical work environment, subtle depth of field.`;
}

function buildContactImagePrompt(p: ImagePromptParams): string {
  return `Create a realistic background image for the contact or urgent CTA section of a ${p.sector} landing page serving ${p.serviceArea}.

The image should support the main action: ${p.mainCta}.
Urgency level: ${p.urgencyLevel}.
Service priority: ${p.servicePriority}.

Scene:
Show a practical moment of action: worker arriving, service vehicle near property, professional inspecting the issue, tools prepared, or final clean result depending on the sector.

Composition:
Wide background image, darker edges, clear center or side negative space for overlay text and contact form.

Mood:
Fast response, trust, clarity, local availability.

Avoid:
No readable text, no fake logos, no exaggerated emergency drama, no messy clutter, no unrealistic AI artifacts.

The image must work behind a dark overlay and contact form.`;
}

// ─── User prompt builder ──────────────────────────────────────────────────────

function buildUserPrompt(p: WebsiteGenerateParams & {
  heroImageUrl: string;
  aboutImageUrl: string;
  contactImageUrl: string;
}): string {
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

IMÁGENES GENERADAS CON IA:
- HERO_IMAGE_URL: ${p.heroImageUrl}
- ABOUT_IMAGE_URL: ${p.aboutImageUrl}
- CONTACT_IMAGE_URL: ${p.contactImageUrl}

INSTRUCCIONES:
- Usa HERO_IMAGE_URL como background del hero section con overlay oscuro
- Usa ABOUT_IMAGE_URL en la sección Nosotros
- Usa CONTACT_IMAGE_URL como background de la sección CTA de urgencia o contacto
- Inventa 3 testimonios realistas y específicos del rubro
- El CTA principal debe ser llamar al teléfono {{custom_values.company_phone}}
- Incluye los servicios listados en la sección de servicios (expande a 6 si hay menos)
- Usa el tagline como referencia para crear el subtítulo del hero
- Usa iconos de Lucide apropiados para cada servicio y sección
- Adapta el tono y estilo visual según el sector y los colores de marca`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImagePromptParams {
  sector: string;
  serviceArea: string;
  targetAudience: string;
  servicePriority: string;
  services: string;
  visualStyle: string;
  brandColors: string;
  priceLevel: string;
  positioning: string;
  tone: string;
  values: string;
  mainCta: string;
  urgencyLevel: string;
}

interface WebsiteGenerateParams {
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

// ─── Image upload helper ──────────────────────────────────────────────────────

async function generateAndUploadImage(
  prompt: string,
  storagePath: string,
  openaiKey: string,
  db: ReturnType<typeof import("@/lib/supabase/client").getAdminClient>
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000); // 45s per image

  try {
    const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt,
        n: 1,
        size: "1536x1024",
        output_format: "webp",
      }),
    });

    if (!imgRes.ok) {
      throw new Error(`Image API error: ${imgRes.status}`);
    }

    const imgJson = (await imgRes.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const imgData = imgJson.data?.[0];
    if (!imgData) throw new Error("No image data returned");

    let buffer: Buffer;
    if (imgData.b64_json) {
      buffer = Buffer.from(imgData.b64_json, "base64");
    } else if (imgData.url) {
      const r = await fetch(imgData.url);
      if (!r.ok) throw new Error("Failed to fetch image URL");
      buffer = Buffer.from(await r.arrayBuffer());
    } else {
      throw new Error("No image URL or b64_json in response");
    }

    const { error: uploadErr } = await db.storage
      .from("website-assets")
      .upload(storagePath, buffer, { contentType: "image/webp", upsert: true });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const { data: urlData } = db.storage.from("website-assets").getPublicUrl(storagePath);
    return urlData.publicUrl;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as WebsiteGenerateParams;
    const {
      accountId, locationId, businessName,
      address, city, state, zip,
      tagline, services,
      primaryColor, secondaryColor, complementaryColor,
      domain, hoursOfOperation,
    } = body;

    if (!accountId || !businessName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = getAdminClient();

    await db.from("account_websites").upsert(
      {
        account_id: accountId,
        status: "generating",
        html: null,
        hero_image_url: null,
        about_image_url: null,
        contact_image_url: null,
        error_message: null,
      },
      { onConflict: "account_id" }
    );

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      await db.from("account_websites").upsert(
        { account_id: accountId, status: "error", error_message: "OPENAI_API_KEY no configurada" },
        { onConflict: "account_id" }
      );
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // ── Build image prompt params ─────────────────────────────────────────────
    const sector = services.slice(0, 2).join(" / ") || "construction";
    const serviceArea = `${city}, ${state}`;
    const imageParams: ImagePromptParams = {
      sector,
      serviceArea,
      targetAudience: "homeowners and property managers",
      servicePriority: services[0] ?? "general construction",
      services: services.join(", "),
      visualStyle: "professional, industrial, modern",
      brandColors: `${primaryColor}, ${secondaryColor}`,
      priceLevel: "mid-range professional",
      positioning: tagline || "reliable local service",
      tone: "professional, trustworthy, direct",
      values: "quality, reliability, local expertise",
      mainCta: "call now for a free estimate",
      urgencyLevel: "medium",
    };

    // ── Generate 3 images in parallel ────────────────────────────────────────
    const FALLBACK = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80";

    const [heroImageUrl, aboutImageUrl, contactImageUrl] = await Promise.all([
      generateAndUploadImage(
        buildHeroImagePrompt(imageParams),
        `heroes/${locationId}/hero.webp`,
        openaiKey,
        db
      ).catch((e) => { console.error("[website/generate] hero image failed:", e); return FALLBACK; }),

      generateAndUploadImage(
        buildAboutImagePrompt(imageParams),
        `heroes/${locationId}/about.webp`,
        openaiKey,
        db
      ).catch((e) => { console.error("[website/generate] about image failed:", e); return ""; }),

      generateAndUploadImage(
        buildContactImagePrompt(imageParams),
        `heroes/${locationId}/contact.webp`,
        openaiKey,
        db
      ).catch((e) => { console.error("[website/generate] contact image failed:", e); return ""; }),
    ]);

    // ── Generate HTML ─────────────────────────────────────────────────────────
    const userPrompt = buildUserPrompt({
      accountId, locationId, businessName,
      address, city, state, zip,
      tagline, services,
      primaryColor, secondaryColor, complementaryColor,
      domain, hoursOfOperation,
      heroImageUrl,
      aboutImageUrl,
      contactImageUrl,
    });

    const htmlController = new AbortController();
    const htmlTimeout = setTimeout(() => htmlController.abort(), 60_000);

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: htmlController.signal,
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
    clearTimeout(htmlTimeout);

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error("[website/generate] OpenAI chat error:", errText);
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
        account_id:        accountId,
        status:            "ready",
        html,
        hero_image_url:    heroImageUrl || null,
        about_image_url:   aboutImageUrl || null,
        contact_image_url: contactImageUrl || null,
        generated_at:      new Date().toISOString(),
        error_message:     null,
      },
      { onConflict: "account_id" }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const msg = isAbort ? "Tiempo agotado — la generación tardó demasiado. Intentá de nuevo." : "Error interno del servidor";
    console.error("[POST /api/website/generate]", err);
    try {
      const db = getAdminClient();
      const body = (err as { body?: { accountId?: string } })?.body;
      void body; // accountId not available here — stale detection in GET handles it
    } catch { /* ignore */ }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

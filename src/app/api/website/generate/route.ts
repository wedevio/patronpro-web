import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/client";
import { normalizeAssetManifest } from "@/lib/website/asset-optimizer";
import { refreshHtmlImageReferences } from "@/lib/website/html-refresh";
import { isPanelLabMode, LAB_ACCOUNT_ID, LAB_LOCATION_ID } from "@/lib/lab/panel-lab";
import { readLabWebsite, writeLabWebsite } from "@/lib/lab/website-store";
import { buildLabWebsiteHtml } from "@/lib/lab/html";
import { accountBelongsToLocation } from "@/lib/website/account-scope";

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
<img src="{{custom_values.logo}}" alt="{{custom_values.company_name}}" style="height:76px;width:auto;object-fit:contain;filter:brightness(0) invert(1) contrast(200%);" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;font-weight:700;font-size:1.1rem;">{{custom_values.company_name}}</span>

Footer — logo cuadrado (más pequeño):
<img src="{{custom_values.logo_cuadrado}}" alt="{{custom_values.company_name}}" style="height:60px;width:auto;object-fit:contain;filter:brightness(0) invert(1) contrast(200%);" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;font-weight:600;">{{custom_values.company_name}}</span>

=================================================================
REGLAS GHL — OBLIGATORIAS
=================================================================

Los merge tags de GHL se procesan server-side. Úsalos directamente en HTML, nunca en JavaScript.

Custom values disponibles:
- {{custom_values.company_name}}
- {{custom_values.company_phone}}
- {{custom_values.company_address}}
- {{custom_values.hours_of_operation}}
- {{custom_values.dominio_web}}
- {{custom_values.logo}}
- {{custom_values.logo_cuadrado}}
- {{custom_values.landing_form}}
- {{custom_values.website_social_image}}

Imágenes responsive disponibles:
- {{custom_values.website_hero_image_webp_srcset}}
- {{custom_values.website_hero_image_jpeg_srcset}}
- {{custom_values.website_hero_image_jpeg_fallback}}
- {{custom_values.website_about_image_webp_srcset}}
- {{custom_values.website_about_image_jpeg_srcset}}
- {{custom_values.website_about_image_jpeg_fallback}}
- {{custom_values.website_contact_image_webp_srcset}}
- {{custom_values.website_contact_image_jpeg_srcset}}
- {{custom_values.website_contact_image_jpeg_fallback}}

Valores legacy de imagen — solo fallback si necesitas compatibilidad:
- {{custom_values.website_hero_image}}
- {{custom_values.website_about_image}}
- {{custom_values.website_contact_image}}

=================================================================
SEO, OPEN GRAPH Y DATOS ESTRUCTURADOS — OBLIGATORIO
=================================================================

El <head> debe incluir, en este orden lógico:
- <title> único y específico, máximo 60 caracteres aprox.
- <meta name="description"> natural y accionable, máximo 155 caracteres aprox.
- <link rel="canonical" href="https://{{custom_values.dominio_web}}/">
- <meta name="robots" content="index,follow,max-image-preview:large">
- Open Graph para WhatsApp, Messenger, Facebook y LinkedIn:
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_US">
  <meta property="og:site_name" content="{{custom_values.company_name}}">
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:url" content="https://{{custom_values.dominio_web}}/">
  <meta property="og:image" content="{{custom_values.website_social_image}}">
  <meta property="og:image:secure_url" content="{{custom_values.website_social_image}}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{{custom_values.company_name}}">
- Twitter card:
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="...">
  <meta name="twitter:description" content="...">
  <meta name="twitter:image" content="{{custom_values.website_social_image}}">

El preview social SIEMPRE usa {{custom_values.website_social_image}}. No uses hero/about/contact como og:image.

Google snippets:
- Usa un solo <h1>.
- Cada sección principal debe tener id estable y heading descriptivo: servicios, nosotros, proceso, testimonios, contacto.
- Cada servicio debe tener un anchor/id legible, por ejemplo id="servicio-reparacion-de-techos".
- Incluye JSON-LD válido en <script type="application/ld+json">, sin JavaScript dinámico:
  1. LocalBusiness o ProfessionalService con name, url, telephone, email, image, address, areaServed y openingHoursSpecification si se puede representar.
  2. ItemList o makesOffer con los servicios principales.
  3. SiteNavigationElement con las secciones principales.

El JSON-LD puede mezclar datos literales del prompt (ciudad, estado, servicios) y merge tags GHL como strings. Cuida comillas y JSON válido. No inventes ratings agregados, precios, licencias ni reviews schema si no hay datos reales.

Teléfono (siempre clickeable):
<a href="tel:{{custom_values.company_phone}}">{{custom_values.company_phone}}</a>

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

IMÁGENES — usa SIEMPRE <picture>, nunca PNG directo como background-image.
Orden obligatorio de formatos:
1. WebP primero
2. JPEG comprimido como fallback final

Hero/LCP — debe ser eager y high priority:

<picture class="responsive-bg hero-bg" aria-hidden="true">
  <source type="image/webp" srcset="{{custom_values.website_hero_image_webp_srcset}}" sizes="100vw">
  <img src="{{custom_values.website_hero_image_jpeg_fallback}}" srcset="{{custom_values.website_hero_image_jpeg_srcset}}" sizes="100vw" width="1440" height="960" alt="" loading="eager" fetchpriority="high" decoding="async">
</picture>

Imágenes below-fold — siempre lazy:

<picture class="responsive-bg" aria-hidden="true">
  <source type="image/webp" srcset="{{custom_values.website_about_image_webp_srcset}}" sizes="(max-width: 1024px) 100vw, 50vw">
  <img src="{{custom_values.website_about_image_jpeg_fallback}}" srcset="{{custom_values.website_about_image_jpeg_srcset}}" sizes="(max-width: 1024px) 100vw, 50vw" width="960" height="640" alt="" loading="lazy" decoding="async">
</picture>

CSS obligatorio para imágenes tipo background:

.image-shell{position:relative;overflow:hidden;background-color:var(--primary);}
.responsive-bg{position:absolute;inset:0;z-index:0;}
.responsive-bg img{width:100%;height:100%;object-fit:cover;}
.image-overlay{position:absolute;inset:0;z-index:1;background:rgba(0,0,0,.55);}
.image-content{position:relative;z-index:2;}

Usa esta estructura para HERO y CTA de urgencia:

<section class="hero image-shell">
  <!-- picture responsive + overlay -->
  <div class="image-content"><!-- contenido --></div>
</section>

Usa la misma lógica para la imagen de Nosotros dentro del bloque visual.

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
9. CONTACTO: dirección, teléfono, horarios + formulario {{custom_values.landing_form}}
10. FOOTER: logo cuadrado del cliente, descripción breve, links {{custom_values.dominio_web}}/privacy-policy y {{custom_values.dominio_web}}/terms-conditions, teléfono

CRÍTICO — privacy y terms: SIEMPRE usa estos links exactos, sin hardcodear dominios:
<a href="{{custom_values.dominio_web}}/privacy-policy">Privacy Policy</a>
<a href="{{custom_values.dominio_web}}/terms-conditions">Terms & Conditions</a>
NUNCA uses dominios de GoHighLevel (.myshopify, .gohighlevel.com, ni ningún otro hardcodeado).

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
  logoUrl?: string;
  logoSquareUrl?: string;
  skipImageGeneration?: boolean;
  mode?: "refresh" | "regenerate";
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
    // ── Auth guard ────────────────────────────────────────────────────────────
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const reqSecret = (request as Request & { headers: Headers }).headers.get("x-internal-secret");
    const isInternalCall = internalSecret && reqSecret === internalSecret;

    if (!isInternalCall) {
      const cookieStore = await cookies();
      const ppToken = cookieStore.get("pp-session")?.value;
      if (!ppToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      try {
        await verifyPpSession(ppToken);
      } catch {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const body = (await request.json()) as WebsiteGenerateParams;
    const { accountId, businessName, locationId } = body;

    if (!accountId || !locationId || !businessName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (body.mode && body.mode !== "refresh" && body.mode !== "regenerate") {
      return NextResponse.json(
        {
          error: "invalid_html_mode",
          message: "Use mode=refresh to keep the current HTML and update image references, or mode=regenerate to generate a new page.",
          choices: [
            {
              mode: "refresh",
              label: "Keep current HTML and update image references only",
            },
            {
              mode: "regenerate",
              label: "Generate a completely new HTML page",
            },
          ],
        },
        { status: 400 },
      );
    }

    if (isPanelLabMode()) {
      if (accountId !== LAB_ACCOUNT_ID || locationId !== LAB_LOCATION_ID) {
        return NextResponse.json({ error: "Invalid lab account/location" }, { status: 400 });
      }

      const existingWebsite = await readLabWebsite();
      const existingHtml =
        typeof existingWebsite.html === "string" && existingWebsite.html.trim()
          ? existingWebsite.html
          : "";
      const hasExistingHtml = Boolean(existingHtml);

      if (hasExistingHtml && !body.mode) {
        return NextResponse.json(
          {
            error: "html_mode_required",
            message: "This account already has HTML. Choose how to proceed.",
            choices: [
              {
                mode: "refresh",
                label: "Keep current HTML and update image references only",
              },
              {
                mode: "regenerate",
                label: "Generate a completely new HTML page",
              },
            ],
          },
          { status: 409 },
        );
      }

      if (body.mode === "refresh") {
        if (!hasExistingHtml) {
          return NextResponse.json(
            { error: "html_not_found", message: "No stored HTML exists to refresh." },
            { status: 400 },
          );
        }

        const refreshResult = refreshHtmlImageReferences(
          existingHtml,
          normalizeAssetManifest(existingWebsite.asset_manifest),
        );
        await writeLabWebsite({
          status: "ready",
          html: refreshResult.html,
          html_reference_status: refreshResult.status,
          html_last_refreshed_at: new Date().toISOString(),
          html_snapshot: refreshResult.snapshot,
          error_message: null,
        });

        return NextResponse.json(
          {
            success: true,
            mode: "refresh",
            htmlReferenceStatus: refreshResult.status,
            changed: refreshResult.changed,
          },
          { status: 200 },
        );
      }

      const html = buildLabWebsiteHtml(body, {
        hero: existingWebsite.hero_image_url,
        about: existingWebsite.about_image_url,
        contact: existingWebsite.contact_image_url,
      });
      await writeLabWebsite({
        status: "ready",
        html,
        generated_at: new Date().toISOString(),
        error_message: null,
        html_reference_status: null,
      });

      return NextResponse.json(
        { success: true, mode: body.mode || "initial_generate", html },
        { status: 200 },
      );
    }

    const db = getAdminClient();
    if (!(await accountBelongsToLocation(db, accountId, locationId))) {
      return NextResponse.json({ error: "account_location_mismatch" }, { status: 404 });
    }

    const { data: existingWebsite } = await db
      .from("account_websites")
      .select("html, asset_manifest")
      .eq("account_id", accountId)
      .maybeSingle();

    const existingHtml =
      typeof existingWebsite?.html === "string" && existingWebsite.html.trim()
        ? existingWebsite.html
        : "";
    const hasExistingHtml = Boolean(existingHtml);

    if (hasExistingHtml && !body.mode) {
      return NextResponse.json(
        {
          error: "html_mode_required",
          message: "This account already has HTML. Choose how to proceed.",
          choices: [
            {
              mode: "refresh",
              label: "Keep current HTML and update image references only",
            },
            {
              mode: "regenerate",
              label: "Generate a completely new HTML page",
            },
          ],
        },
        { status: 409 },
      );
    }

    if (body.mode === "refresh") {
      if (!hasExistingHtml) {
        return NextResponse.json(
          { error: "html_not_found", message: "No stored HTML exists to refresh." },
          { status: 400 },
        );
      }

      const refreshResult = refreshHtmlImageReferences(
        existingHtml,
        normalizeAssetManifest(existingWebsite?.asset_manifest),
      );

      await db.from("account_websites").upsert(
        {
          account_id: accountId,
          status: "ready",
          html: refreshResult.html,
          html_reference_status: refreshResult.status,
          html_last_refreshed_at: new Date().toISOString(),
          html_snapshot: refreshResult.snapshot ?? undefined,
          error_message: null,
        },
        { onConflict: "account_id" },
      );

      return NextResponse.json(
        {
          success: true,
          mode: "refresh",
          htmlReferenceStatus: refreshResult.status,
          changed: refreshResult.changed,
        },
        { status: 200 },
      );
    }

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

    if (!body.skipImageGeneration) {
      // ── Trigger image generation (fire-and-forget) ──────────────────────────
      // Runs as an independent Vercel invocation with its own 300s timeout.
      // It can call this route back with skipImageGeneration once image custom values exist.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpatronpro.com";
      void fetch(`${appUrl}/api/website/generate-images`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INTERNAL_API_SECRET ? { "x-internal-secret": process.env.INTERNAL_API_SECRET } : {}),
        },
        body: JSON.stringify({
          accountId: body.accountId,
          locationId: body.locationId,
          businessName: body.businessName,
          services: body.services,
          city: body.city,
          state: body.state,
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          complementaryColor: body.complementaryColor,
          address: body.address,
          zip: body.zip,
          tagline: body.tagline,
          domain: body.domain,
          hoursOfOperation: body.hoursOfOperation ?? null,
          logoUrl: body.logoUrl ?? "",
          logoSquareUrl: body.logoSquareUrl ?? "",
          regenerateHtmlAfterImages: true,
        }),
      });
    }

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

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Vercel max for pro plan

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un experto en diseño web y GoHighLevel (GHL). Tu tarea es generar landing pages en HTML completo, listo para pegar directamente en un bloque Custom HTML de GHL.

## REGLAS GHL — OBLIGATORIAS

El HTML se pega en el Custom HTML block de GHL, donde los merge tags SÍ se procesan server-side. Por tanto:

1. USA SIEMPRE estos custom values directamente en el HTML — nunca en JS:
   - {{custom_values.company_name}} → nombre de la empresa
   - {{custom_values.company_phone}} → teléfono principal
   - {{custom_values.company_address}} → dirección física
   - {{custom_values.automation_sender_email}} → email de contacto
   - {{custom_values.hours_of_operation}} → horario de atención
   - {{custom_values.dominio_web}} → URL del sitio web
   - {{custom_values.logo}} → URL del logo horizontal (usar en <img src="">)
   - {{custom_values.logo_cuadrado}} → URL del logo cuadrado (usar en <img src="">)
   - {{custom_values.landing_form}} → embed del formulario (inyectar donde va el form)

2. NUNCA incluyas estos custom values — están prohibidos:
   - {{custom_values.webchat_code}} → se añade desde otro sitio
   - {{custom_values.website_hmtl}} → causa recursión infinita

3. NUNCA uses JavaScript para inyectar los custom values. Los merge tags funcionan directamente en atributos HTML y texto del DOM.

4. Para imágenes de logo, usa siempre el patrón con onerror fallback:
   <img src="{{custom_values.logo}}" alt="{{custom_values.company_name}}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
   <span style="display:none;">{{custom_values.company_name}}</span>

5. Para teléfonos: <a href="tel:{{custom_values.company_phone}}">{{custom_values.company_phone}}</a>

6. Para emails: <a href="mailto:{{custom_values.automation_sender_email}}">{{custom_values.automation_sender_email}}</a>

7. El formulario va en la sección de contacto: {{custom_values.landing_form}}

## ICONOS

Incluye Lucide icons via CDN al inicio del <head>:
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

Usa iconos de Lucide con el patrón:
<i data-lucide="shield-check" style="width:24px;height:24px;"></i>

Al final del body, inicializa los iconos:
<script>if(typeof lucide !== 'undefined') lucide.createIcons();</script>

## IMAGEN HERO

Se te proporcionará una URL de imagen generada con IA para el hero. Úsala como background-image del hero section:
style="background-image: url('HERO_IMAGE_URL'); background-size: cover; background-position: center;"

Siempre añade un overlay oscuro semitransparente sobre la imagen para legibilidad del texto.

## ESTRUCTURA DE LA LANDING

Incluye siempre estas secciones en este orden:
1. Navbar fija (logo + links + CTA)
2. Hero (headline impactante + subtítulo + CTAs + stats/social proof + imagen de fondo)
3. Banda de confianza (certificaciones, años, sellos — usa iconos Lucide)
4. Servicios (grid de 6 tarjetas con iconos Lucide)
5. Nosotros (historia + valores + horario de {{custom_values.hours_of_operation}})
6. Proceso (4 pasos con iconos Lucide numerados)
7. Testimonios (3 tarjetas — INVENTAR nombres y testimonios realistas y específicos del rubro)
8. CTA de urgencia (sección de color con headline + teléfono grande)
9. Contacto (info de contacto + {{custom_values.landing_form}})
10. Footer (logo cuadrado + links a /privacy-policy y /terms (solo esos dos) + datos de contacto)

## DISEÑO

- HTML, CSS y JS mínimo en un solo archivo <style> embebido
- Fuentes desde Google Fonts — Inter para cuerpo, Oswald o Bebas Neue para headlines
- Totalmente responsive (mobile-first) con media queries
- Dark theme industrial: fondo #0a0a0a o #111, texto #f5f5f5, acentos con los colores del cliente
- Usa los colores PRIMARY_COLOR y SECONDARY_COLOR del cliente como acentos
- Animaciones CSS de entrada con IntersectionObserver (fade-in + translateY desde abajo)
- Sin dependencias externas excepto Google Fonts y Lucide CDN
- El JavaScript solo para UI (animaciones, nav scroll, mobile menu) — nunca para datos GHL
- Navbar con blur backdrop y sombra al hacer scroll
- Cards con hover effects (translateY + box-shadow)
- Botones con gradiente usando los colores del cliente
- Separadores de sección con formas SVG (wave o diagonal)

## OUTPUT

Devuelve ÚNICAMENTE el HTML completo. Sin explicaciones, sin markdown, sin bloques de código. Empezá con <!DOCTYPE html> y terminá con </html>.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUserPrompt(params: WebsiteGenerateParams): string {
  const servicesList = params.services.join(", ");
  const hoursText = params.hoursOfOperation
    ? JSON.stringify(params.hoursOfOperation)
    : "Lunes a Viernes 8:00 AM - 5:00 PM";

  return `Genera una landing page completa para la siguiente empresa de construcción:

DATOS DE LA EMPRESA:
- Nombre: ${params.businessName}
- Dirección: ${params.address}, ${params.city}, ${params.state} ${params.zip}
- Tagline: ${params.tagline}
- Servicios principales: ${servicesList}
- Horarios: ${hoursText}
- Dominio: ${params.domain || "por definir"}

COLORES DE MARCA:
- PRIMARY_COLOR: ${params.primaryColor}
- SECONDARY_COLOR: ${params.secondaryColor}

IMAGEN HERO:
- URL: ${params.heroImageUrl}
- Úsala como background del hero section

INSTRUCCIONES ADICIONALES:
- Inventa 3 testimonios realistas y específicos del rubro de construcción/contratación
- El CTA principal debe ser llamar al teléfono {{custom_values.company_phone}}
- Incluye los servicios listados arriba en la sección de servicios (puedes expandir a 6 si hay menos)
- Usa el tagline en el hero como subtítulo
- Usa iconos de Lucide apropiados para cada servicio y sección`;
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
  domain: string;
  heroImageUrl: string;
  hoursOfOperation?: unknown;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as WebsiteGenerateParams;
    const {
      accountId,
      locationId,
      businessName,
      address,
      city,
      state,
      zip,
      tagline,
      services,
      primaryColor,
      secondaryColor,
      domain,
      hoursOfOperation,
    } = body;

    if (!accountId || !businessName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = getAdminClient();

    // Mark as generating
    await db.from("account_websites").upsert(
      { account_id: accountId, status: "generating", html: null, hero_image_url: null, error_message: null },
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

    // ── Step 1: Generate hero image with gpt-image-1 ─────────────────────────
    let heroImageUrl = "";
    try {
      const imagePrompt = `Professional aerial or ground-level photo of a ${services[0] ?? "construction"} project in ${city}, ${state}. High quality, cinematic lighting, dramatic sky, ultra realistic. The image will be used as a dark background for a construction company landing page hero section.`;

      const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imagePrompt,
          n: 1,
          size: "1792x1024",
          output_format: "webp",
        }),
      });

      if (imgRes.ok) {
        const imgJson = (await imgRes.json()) as {
          data?: Array<{ url?: string; b64_json?: string }>;
        };
        const imgData = imgJson.data?.[0];

        if (imgData?.b64_json) {
          // Upload base64 image to Supabase Storage
          const buffer = Buffer.from(imgData.b64_json, "base64");
          const path = `heroes/${locationId}/hero.webp`;
          const { error: uploadErr } = await db.storage
            .from("website-assets")
            .upload(path, buffer, { contentType: "image/webp", upsert: true });

          if (!uploadErr) {
            const { data: urlData } = db.storage.from("website-assets").getPublicUrl(path);
            heroImageUrl = urlData.publicUrl;
          }
        } else if (imgData?.url) {
          // Fetch the URL and re-upload to Supabase (avoid expiring OpenAI URLs)
          const imgFetch = await fetch(imgData.url);
          if (imgFetch.ok) {
            const imgBuffer = Buffer.from(await imgFetch.arrayBuffer());
            const path = `heroes/${locationId}/hero.webp`;
            const { error: uploadErr } = await db.storage
              .from("website-assets")
              .upload(path, imgBuffer, { contentType: "image/webp", upsert: true });
            if (!uploadErr) {
              const { data: urlData } = db.storage.from("website-assets").getPublicUrl(path);
              heroImageUrl = urlData.publicUrl;
            }
          }
        }
      }
    } catch (err) {
      console.error("[website/generate] Image generation failed:", err);
      // Non-fatal — continue without hero image
    }

    // ── Step 2: Generate HTML with gpt-4o ────────────────────────────────────
    const userPrompt = buildUserPrompt({
      accountId,
      locationId,
      businessName,
      address,
      city,
      state,
      zip,
      tagline,
      services,
      primaryColor,
      secondaryColor,
      domain,
      heroImageUrl: heroImageUrl || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80",
      hoursOfOperation,
    });

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 16000,
        temperature: 0.7,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error("[website/generate] OpenAI chat error:", errText);
      await db.from("account_websites").upsert(
        { account_id: accountId, status: "error", error_message: `OpenAI error: ${chatRes.status}` },
        { onConflict: "account_id" }
      );
      return NextResponse.json({ error: "OpenAI generation failed" }, { status: 502 });
    }

    const chatJson = (await chatRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawHtml = chatJson.choices?.[0]?.message?.content ?? "";
    // Strip markdown code fences if model added them
    const html = rawHtml.replace(/^```html\s*/i, "").replace(/\s*```$/, "").trim();

    if (!html) {
      await db.from("account_websites").upsert(
        { account_id: accountId, status: "error", error_message: "El modelo no devolvió HTML" },
        { onConflict: "account_id" }
      );
      return NextResponse.json({ error: "Empty HTML response" }, { status: 502 });
    }

    // ── Step 3: Save to Supabase ──────────────────────────────────────────────
    await db.from("account_websites").upsert(
      {
        account_id:     accountId,
        status:         "ready",
        html,
        hero_image_url: heroImageUrl || null,
        generated_at:   new Date().toISOString(),
        error_message:  null,
      },
      { onConflict: "account_id" }
    );

    return NextResponse.json({ success: true, heroImageUrl }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/website/generate]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

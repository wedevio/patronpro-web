#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULTS = {
  locationId: "4cPIvLND9hFAIzWQ1ZbL",
  endpoint: "https://www.getpatronpro.com/api/website/4cPIvLND9hFAIzWQ1ZbL",
  outDir: "dev/agents/artifacts/doc/test/liverpool-digital/optimized-website-2026-06-12",
  tokenEnv: "GHL_TOKEN",
  supabaseUrlEnv: "NEXT_PUBLIC_SUPABASE_URL",
  supabaseKeyEnv: "SUPABASE_SERVICE_ROLE_KEY",
  supabaseBucket: "website-assets",
};

const WIDTHS = [640, 960, 1440];
const SUBJECTS = ["hero", "about", "contact"];

function parseArgs(argv) {
  const args = {
    locationId: DEFAULTS.locationId,
    endpoint: DEFAULTS.endpoint,
    outDir: DEFAULTS.outDir,
    tokenEnv: DEFAULTS.tokenEnv,
    supabaseUrlEnv: DEFAULTS.supabaseUrlEnv,
    supabaseKeyEnv: DEFAULTS.supabaseKeyEnv,
    supabaseBucket: DEFAULTS.supabaseBucket,
    applyUpload: false,
    supabaseUpload: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--location-id") args.locationId = argv[++i] ?? "";
    else if (arg === "--endpoint") args.endpoint = argv[++i] ?? "";
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? "";
    else if (arg === "--token-env") args.tokenEnv = argv[++i] ?? "";
    else if (arg === "--apply-upload") args.applyUpload = true;
    else if (arg === "--supabase-upload") args.supabaseUpload = true;
    else if (arg === "--supabase-url-env") args.supabaseUrlEnv = argv[++i] ?? "";
    else if (arg === "--supabase-key-env") args.supabaseKeyEnv = argv[++i] ?? "";
    else if (arg === "--supabase-bucket") args.supabaseBucket = argv[++i] ?? "";
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return `
Usage:
  node dev/agents/artifacts/script/patronpro-liverpool/optimize-existing-website-html.mjs
  GHL_TOKEN=... node dev/agents/artifacts/script/patronpro-liverpool/optimize-existing-website-html.mjs --apply-upload
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dev/agents/artifacts/script/patronpro-liverpool/optimize-existing-website-html.mjs --supabase-upload

What it does:
  - Reuses the current website images from the PatronPro public endpoint.
  - Generates AVIF/WebP/JPEG responsive variants and a JPEG social preview.
  - Writes optimized HTML with <picture>, Open Graph/Twitter tags, and JSON-LD.
  - With --apply-upload, uploads variants to GHL Media and writes public URLs into the HTML.
  - With --supabase-upload, uploads variants to the public Supabase Storage website-assets bucket.

Guardrail:
  This script never calls the image-generation API and never prints credentials.
`.trim();
}

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slugStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Endpoint failed ${res.status}: ${url}`);
  return res.json();
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Asset download failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function convert(input, subject, width, format, stamp) {
  let pipeline = sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true });

  let ext;
  let contentType;
  if (format === "avif") {
    ext = "avif";
    contentType = "image/avif";
    pipeline = pipeline.avif({ quality: 50, effort: 6, chromaSubsampling: "4:2:0" });
  } else if (format === "webp") {
    ext = "webp";
    contentType = "image/webp";
    pipeline = pipeline.webp({ quality: 70, effort: 5 });
  } else {
    ext = "jpg";
    contentType = "image/jpeg";
    pipeline = pipeline.jpeg({ quality: 62, mozjpeg: true, progressive: true });
  }

  return {
    subject,
    width,
    format,
    contentType,
    filename: `patronpro-${subject}-${stamp}-${width}.${ext}`,
    buffer: await pipeline.toBuffer(),
  };
}

async function createSocialPreview(hero, stamp) {
  const base = await sharp(hero)
    .rotate()
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 86, mozjpeg: true, progressive: true })
    .toBuffer();

  const overlay = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000000" stop-opacity="0.78"/>
          <stop offset="0.66" stop-color="#000000" stop-opacity="0.48"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#shade)"/>
      <rect x="0" y="0" width="1200" height="18" fill="#471f23"/>
      <rect x="80" y="190" width="170" height="8" fill="#f69309"/>
      <text x="80" y="285" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="800" fill="#ffffff">Picturelle</text>
      <text x="82" y="355" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#ffffff">Roofing confiable en Glendale</text>
      <text x="82" y="430" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="600" fill="#ffffff" opacity="0.92">Reparacion, reemplazo e inspeccion de techos</text>
      <text x="82" y="540" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff" opacity="0.86">PatronPro test onboarding account</text>
    </svg>
  `);

  return {
    subject: "social",
    width: 1200,
    height: 630,
    format: "jpg",
    contentType: "image/jpeg",
    filename: `patronpro-social-${stamp}-1200x630.jpg`,
    buffer: await sharp(base)
      .composite([{ input: overlay, left: 0, top: 0 }])
      .jpeg({ quality: 76, mozjpeg: true, progressive: true })
      .toBuffer(),
  };
}

async function writeAsset(filePath, buffer) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

async function uploadToGhl(locationId, asset, token) {
  const blob = new Blob([new Uint8Array(asset.buffer)], { type: asset.contentType });
  const formData = new FormData();
  formData.append("file", blob, asset.filename);
  formData.append("locationId", locationId);
  formData.append("name", asset.filename);

  const res = await fetch("https://services.leadconnectorhq.com/medias/upload-file", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL Media upload failed ${res.status} for ${asset.filename}: ${text.slice(0, 400)}`);
  }

  const json = await res.json();
  const url =
    json.url ??
    json.fileUrl ??
    json?.data?.url ??
    json?.data?.fileUrl ??
    json?.media?.url ??
    json?.medias?.[0]?.url ??
    json?.files?.[0]?.url ??
    "";
  if (!url) throw new Error(`GHL Media upload did not return a URL for ${asset.filename}`);
  return { url, responseKeys: Object.keys(json) };
}

async function uploadToSupabaseStorage({ supabaseUrl, supabaseKey, bucket, locationId, stamp, asset }) {
  const objectPath = `${locationId}/optimized/${stamp}/${asset.filename}`;
  const baseUrl = supabaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": asset.contentType,
      "x-upsert": "false",
    },
    body: asset.buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase Storage upload failed ${res.status} for ${asset.filename}: ${text.slice(0, 400)}`);
  }

  return {
    url: `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`,
    objectPath,
  };
}

function srcset(assets, format) {
  return assets
    .filter((asset) => asset.format === format)
    .sort((a, b) => a.width - b.width)
    .map((asset) => `${asset.publicUrl} ${asset.width}w`)
    .join(", ");
}

function fallback(assets) {
  return (
    assets.find((asset) => asset.format === "jpg" && asset.width === 960)?.publicUrl ??
    assets.find((asset) => asset.format === "jpg")?.publicUrl ??
    ""
  );
}

function pictureMarkup(set, options = {}) {
  const eager = Boolean(options.eager);
  const sizes = options.sizes ?? "100vw";
  const width = options.width ?? 1440;
  const height = options.height ?? 810;
  const className = options.className ? ` ${options.className}` : "";
  return `<div class="optimized-media-bg${className}" aria-hidden="true">
      <picture>
        <source type="image/avif" srcset="${escapeAttr(set.avif)}" sizes="${escapeAttr(sizes)}">
        <source type="image/webp" srcset="${escapeAttr(set.webp)}" sizes="${escapeAttr(sizes)}">
        <img src="${escapeAttr(set.jpegFallback)}" width="${width}" height="${height}" alt="" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>
      </picture>
    </div>`;
}

function buildSeoBlock(heroSet, socialUrl) {
  return `  <!-- BEGIN PatronPro SEO/social preview optimization -->
  <link rel="canonical" href="https://{{custom_values.dominio_web}}/" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_US" />
  <meta property="og:site_name" content="{{custom_values.company_name}}" />
  <meta property="og:title" content="{{custom_values.company_name}} | Roofing en Glendale" />
  <meta property="og:description" content="Roofing confiable en Glendale. Reparacion, reemplazo e inspeccion de techos con trabajo garantizado y precio justo." />
  <meta property="og:url" content="https://{{custom_values.dominio_web}}/" />
  <meta property="og:image" content="${escapeAttr(socialUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="{{custom_values.company_name}} - Roofing confiable en Glendale" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{{custom_values.company_name}} | Roofing en Glendale" />
  <meta name="twitter:description" content="Roofing confiable en Glendale. Cotizaciones claras, trabajo garantizado y precio justo." />
  <meta name="twitter:image" content="${escapeAttr(socialUrl)}" />
  <link rel="preload" as="image" type="image/avif" imagesrcset="${escapeAttr(heroSet.avif)}" imagesizes="100vw" fetchpriority="high" />
  <script type="application/ld+json">
  [
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "ProfessionalService"],
      "name": "{{custom_values.company_name}}",
      "url": "https://{{custom_values.dominio_web}}/",
      "image": "${socialUrl}",
      "telephone": "{{custom_values.company_phone}}",
      "email": "{{custom_values.automation_sender_email}}",
      "address": "{{custom_values.company_address}}",
      "areaServed": {
        "@type": "City",
        "name": "Glendale"
      },
      "description": "Roofing confiable en Glendale con reparacion, reemplazo e inspeccion de techos.",
      "makesOffer": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Reemplazo de techo" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Reparacion de filtraciones" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Inspeccion de techo" } }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Servicios de roofing",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Reemplazo de techo", "url": "https://{{custom_values.dominio_web}}/#servicios" },
        { "@type": "ListItem", "position": 2, "name": "Reparacion de filtraciones", "url": "https://{{custom_values.dominio_web}}/#servicios" },
        { "@type": "ListItem", "position": 3, "name": "Daño por viento y tormenta", "url": "https://{{custom_values.dominio_web}}/#servicios" },
        { "@type": "ListItem", "position": 4, "name": "Inspeccion de techo", "url": "https://{{custom_values.dominio_web}}/#servicios" }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": ["Servicios", "Nosotros", "Proceso", "Testimonios", "Contacto"],
      "url": [
        "https://{{custom_values.dominio_web}}/#servicios",
        "https://{{custom_values.dominio_web}}/#nosotros",
        "https://{{custom_values.dominio_web}}/#proceso",
        "https://{{custom_values.dominio_web}}/#testimonios",
        "https://{{custom_values.dominio_web}}/#contacto"
      ]
    }
  ]
  </script>
  <!-- END PatronPro SEO/social preview optimization -->`;
}

function buildCssBlock() {
  return `    /* BEGIN PatronPro responsive image optimization */
    .optimized-media-bg{
      position:absolute;
      inset:0;
      z-index:0;
      overflow:hidden;
      pointer-events:none;
    }
    .optimized-media-bg picture,
    .optimized-media-bg img{
      width:100%;
      height:100%;
      display:block;
    }
    .optimized-media-bg img{
      object-fit:cover;
    }
    .hero::before,
    .urgent-cta::before{
      z-index:1;
    }
    .hero-inner,
    .urgent-inner{
      position:relative;
      z-index:2;
    }
    .about-image{
      overflow:hidden;
    }
    .about-image::before{
      z-index:1;
    }
    .mobile-menu{
      display:none;
    }
    /* END PatronPro responsive image optimization */
`;
}

function replaceOrThrow(input, searchValue, replaceValue, label) {
  const output = input.replace(searchValue, replaceValue);
  if (output === input) throw new Error(`Failed to replace ${label}`);
  return output;
}

function transformHtml(html, sets, socialUrl) {
  let output = html;
  const heroPicture = pictureMarkup(sets.hero, { eager: true, width: 1440, height: 810 });
  const aboutPicture = pictureMarkup(sets.about, { width: 1440, height: 960 });
  const contactPicture = pictureMarkup(sets.contact, { width: 1440, height: 810 });

  output = output.replace(
    /<title>.*?<\/title>/,
    "<title>{{custom_values.company_name}} | Roofing en Glendale</title>",
  );
  output = output.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    '<meta name="description" content="Roofing confiable en Glendale. Trabajo garantizado, precio justo y atención clara desde el primer día. Llama hoy para tu presupuesto." />',
  );
  output = output.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/,
    `${buildSeoBlock(sets.hero, socialUrl)}\n  <link rel="preconnect" href="https://fonts.googleapis.com">`,
  );

  for (const subject of SUBJECTS) {
    output = output.replace(
      new RegExp(`\\n\\s*background-image:url\\('\\{\\{custom_values\\.website_${subject}_image\\}\\}'\\);`, "g"),
      "\n      /* optimized image is loaded through responsive picture markup */",
    );
  }

  output = output.replace(
    /(\s+\.fade-in\.visible\{\n\s+opacity:1;\n\s+transform:translateY\(0\);\n\s+\}\n)/,
    `$1\n${buildCssBlock()}`,
  );

  output = replaceOrThrow(
    output,
    '<section class="hero" id="inicio">',
    `<section class="hero" id="inicio">\n    ${heroPicture}`,
    "hero picture insertion",
  );
  output = replaceOrThrow(
    output,
    '<div class="about-image fade-in"></div>',
    `<div class="about-image fade-in">\n        ${aboutPicture}\n      </div>`,
    "about picture insertion",
  );
  output = replaceOrThrow(
    output,
    '<section class="urgent-cta">',
    `<section class="urgent-cta">\n    ${contactPicture}`,
    "contact picture insertion",
  );

  return output;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }

  const token = args.applyUpload ? process.env[args.tokenEnv] : "";
  if (args.applyUpload && !token) throw new Error(`--apply-upload requires ${args.tokenEnv} in the environment.`);
  const supabaseUrl = args.supabaseUpload ? process.env[args.supabaseUrlEnv] : "";
  const supabaseKey = args.supabaseUpload ? process.env[args.supabaseKeyEnv] : "";
  if (args.supabaseUpload && (!supabaseUrl || !supabaseKey)) {
    throw new Error(`--supabase-upload requires ${args.supabaseUrlEnv} and ${args.supabaseKeyEnv} in the environment.`);
  }
  if (args.applyUpload && args.supabaseUpload) {
    throw new Error("Choose only one upload mode: --apply-upload or --supabase-upload.");
  }

  const outDir = path.resolve(args.outDir);
  const assetsDir = path.join(outDir, "assets");
  const stamp = slugStamp();
  await mkdir(assetsDir, { recursive: true });

  const endpoint = await fetchJson(args.endpoint);
  const website = endpoint.website ?? {};
  const html = website.html;
  if (!html || typeof html !== "string") throw new Error("Endpoint did not return website.html.");

  const sourceUrls = {
    hero: website.hero_image_url,
    about: website.about_image_url,
    contact: website.contact_image_url,
  };
  for (const subject of SUBJECTS) {
    if (!sourceUrls[subject]) throw new Error(`Missing ${subject}_image_url from endpoint.`);
  }

  const originalBuffers = {};
  const sets = {};
  const allAssetRecords = [];

  for (const subject of SUBJECTS) {
    const original = await download(sourceUrls[subject]);
    originalBuffers[subject] = original;
    const variants = [];
    for (const width of WIDTHS) {
      for (const format of ["avif", "webp", "jpg"]) {
        const asset = await convert(original, subject, width, format, stamp);
        const assetPath = path.join(assetsDir, asset.filename);
        await writeAsset(assetPath, asset.buffer);
        asset.localPath = path.relative(process.cwd(), assetPath);
        asset.publicUrl = `assets/${asset.filename}`;
        if (args.supabaseUpload) {
          const uploaded = await uploadToSupabaseStorage({
            supabaseUrl,
            supabaseKey,
            bucket: args.supabaseBucket,
            locationId: args.locationId,
            stamp,
            asset,
          });
          asset.publicUrl = uploaded.url;
          asset.supabaseObjectPath = uploaded.objectPath;
        } else if (args.applyUpload) {
          const uploaded = await uploadToGhl(args.locationId, asset, token);
          asset.publicUrl = uploaded.url;
          asset.uploadResponseKeys = uploaded.responseKeys;
        }
        variants.push(asset);
        allAssetRecords.push({
          subject,
          width,
          format,
          contentType: asset.contentType,
          filename: asset.filename,
          localPath: asset.localPath,
          publicUrl: asset.publicUrl,
          supabaseObjectPath: asset.supabaseObjectPath ?? "",
          bytes: asset.buffer.length,
          sha256: sha256(asset.buffer),
        });
      }
    }
    sets[subject] = {
      avif: srcset(variants, "avif"),
      webp: srcset(variants, "webp"),
      jpeg: srcset(variants, "jpg"),
      jpegFallback: fallback(variants),
    };
  }

  const social = await createSocialPreview(originalBuffers.hero, stamp);
  const socialPath = path.join(assetsDir, social.filename);
  await writeAsset(socialPath, social.buffer);
  social.localPath = path.relative(process.cwd(), socialPath);
  social.publicUrl = `assets/${social.filename}`;
  if (args.supabaseUpload) {
    const uploaded = await uploadToSupabaseStorage({
      supabaseUrl,
      supabaseKey,
      bucket: args.supabaseBucket,
      locationId: args.locationId,
      stamp,
      asset: social,
    });
    social.publicUrl = uploaded.url;
    social.supabaseObjectPath = uploaded.objectPath;
  } else if (args.applyUpload) {
    const uploaded = await uploadToGhl(args.locationId, social, token);
    social.publicUrl = uploaded.url;
    social.uploadResponseKeys = uploaded.responseKeys;
  }

  const optimizedHtml = transformHtml(html, sets, social.publicUrl);
  const htmlPath = path.join(outDir, "test-onboarding-account-01-optimized-2026-06-12.html");
  await writeFile(htmlPath, optimizedHtml, "utf8");

  const manifest = {
    generatedAt: new Date().toISOString(),
    mode: args.supabaseUpload ? "supabase-storage-upload" : args.applyUpload ? "ghl-media-upload" : "local-only",
    guardrails: {
      aiImageGenerationCalled: false,
      credentialsPrintedOrStored: false,
      sourceImagesReused: true,
    },
    endpoint: {
      url: args.endpoint,
      accountId: endpoint.accountId ?? "",
      status: website.status ?? "",
      generated_at: website.generated_at ?? "",
      updated_at: website.updated_at ?? "",
      images_status: website.images_status ?? "",
    },
    html: {
      sourceCharacters: html.length,
      sourceSha256: sha256(html),
      optimizedPath: path.relative(process.cwd(), htmlPath),
      optimizedCharacters: optimizedHtml.length,
      optimizedSha256: sha256(optimizedHtml),
      markers: {
        picture: optimizedHtml.includes("<picture"),
        avif: optimizedHtml.includes("image/avif"),
        webp: optimizedHtml.includes("image/webp"),
        openGraph: optimizedHtml.includes('property="og:image"'),
        twitter: optimizedHtml.includes('name="twitter:card"'),
        jsonLd: optimizedHtml.includes('type="application/ld+json"'),
        oldCssBackgroundHero: optimizedHtml.includes("{{custom_values.website_hero_image}}"),
        landingFormStillDeferred: optimizedHtml.includes("{{custom_values.landing_form}}"),
      },
    },
    sourceImages: sourceUrls,
    responsiveSets: sets,
    assets: allAssetRecords,
    socialPreview: {
      filename: social.filename,
      localPath: social.localPath,
      publicUrl: social.publicUrl,
      supabaseObjectPath: social.supabaseObjectPath ?? "",
      bytes: social.buffer.length,
      sha256: sha256(social.buffer),
      width: 1200,
      height: 630,
      contentType: social.contentType,
    },
  };

  const manifestPath = path.join(outDir, "test-onboarding-account-01-optimized-2026-06-12.manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    htmlPath: manifest.html.optimizedPath,
    manifestPath: path.relative(process.cwd(), manifestPath),
    mode: manifest.mode,
    optimizedSha256: manifest.html.optimizedSha256,
    optimizedCharacters: manifest.html.optimizedCharacters,
    assetCount: manifest.assets.length + 1,
    markers: manifest.html.markers,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
});

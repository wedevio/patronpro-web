import { describe, expect, test } from "bun:test";
import { buildLabWebsiteHtml } from "../src/lib/lab/html";

describe("buildLabWebsiteHtml", () => {
  test("includes SEO social preview and structured data tags", () => {
    const html = buildLabWebsiteHtml({
      businessName: "Liverpool Digital Lab",
      address: "123 Brand Street",
      city: "Glendale",
      state: "CA",
      zip: "91201",
      domain: "liverpooldigital.example",
      tagline: "Roofing confiable para propietarios exigentes",
      services: ["Reemplazo de techo", "Inspeccion de techo"],
      primaryColor: "#471f23",
      secondaryColor: "#f69309",
    }, {
      hero: "https://cdn.example.com/hero.jpg",
      about: "https://cdn.example.com/about.jpg",
      contact: "https://cdn.example.com/contact.jpg",
    });

    expect(html).toContain('<link rel="canonical" href="https://{{custom_values.dominio_web}}/">');
    expect(html).toContain('<meta name="robots" content="index,follow,max-image-preview:large">');
    expect(html).toContain('<meta property="og:image" content="{{custom_values.website_social_image}}">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="{{custom_values.website_social_image}}">');
    expect(html).toContain('"@type":["LocalBusiness","ProfessionalService"]');
    expect(html).toContain('"@type":"SiteNavigationElement"');
    expect(html).toContain('id="servicios"');
    expect(html).toContain('id="servicio-reemplazo-de-techo"');
  });
});

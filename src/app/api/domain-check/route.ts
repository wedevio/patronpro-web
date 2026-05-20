import { NextResponse } from "next/server";

/**
 * GET /api/domain-check?domain=tunegocio.com
 * Uses Google DNS API to check if a domain has NS records.
 * No NS records = likely available.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  // Strip protocol/www if user typed the full URL
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=NS`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return NextResponse.json({ available: null, error: "dns_error" });
    }

    const json = (await res.json()) as { Answer?: unknown[]; Authority?: unknown[] };

    // If there are NS records (Answer) → domain is registered → NOT available
    const hasNS = Array.isArray(json.Answer) && json.Answer.length > 0;

    return NextResponse.json({ available: !hasNS, domain: cleanDomain });
  } catch {
    return NextResponse.json({ available: null, error: "fetch_error" });
  }
}

import { NextResponse } from "next/server";

/**
 * GET /api/auth/ghl/login
 * Redirects to GHL OAuth authorization page.
 * Visit this URL from a browser when the refresh token needs to be re-issued.
 */
export async function GET(): Promise<Response> {
  const clientId = process.env.GHL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GHL_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getpatronpro.com"}/api/auth/ghl/callback`;

  const url = new URL("https://marketplace.gohighlevel.com/oauth/chooselocation");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", [
    // Locations
    "locations.readonly",
    "locations.write",
    "locations/customValues.readonly",
    "locations/customValues.write",
    "locations/tasks.readonly",
    "locations/tasks.write",
    "locations/tags.readonly",
    "locations/tags.write",
    "locations/templates.readonly",
    // Media & Brand
    "medias.readonly",
    "medias.write",
    "brand-boards/design-kit.readonly",
    "brand-boards/design-kit.write",
    // Users
    "users.readonly",
    "users.write",
    // Phone
    "phonenumbers.read",
    "phonenumbers.write",
    "twilioAccount.read",
    // Voice AI
    "voice-ai-dashboard.readonly",
    "voice-ai-agents.readonly",
    "voice-ai-agents.write",
    "voice-ai-agent-goals.readonly",
    "voice-ai-agent-goals.write",
    // Workflows
    "workflows.readonly",
    // Support Tickets
    "support-tickets.readonly",
    "support-tickets.write",
    // SaaS
    "saas/company.read",
    "saas/company.write",
    "saas/location.read",
    "saas/location.write",
    // Payments
    "payments/integration.readonly",
    "payments/integration.write",
    "payments/transactions.readonly",
    "payments/subscriptions.readonly",
    "payments/coupons.readonly",
    "payments/coupons.write",
    "payments/custom-provider.readonly",
    "payments/custom-provider.write",
    // Invoices
    "invoices.readonly",
    "invoices.write",
    "invoices/schedule.readonly",
    "invoices/schedule.write",
    "invoices/template.readonly",
    "invoices/template.write",
    // LC Email
    "lc-email.readonly",
  ].join(" "));

  return NextResponse.redirect(url.toString());
}

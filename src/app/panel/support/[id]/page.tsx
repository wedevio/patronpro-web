import { getTicket } from "@/lib/support/tickets";
import { notFound } from "next/navigation";
import { getAgencyAccessToken } from "@/lib/ghl/oauth";
import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import PanelTicketDetail from "./_components/PanelTicketDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

interface GhlLocation { name?: string; address?: string }
interface GhlContact  { firstName?: string; lastName?: string; email?: string; phone?: string }

async function fetchGhlLocation(locationId: string): Promise<GhlLocation> {
  try {
    const token = await getAgencyAccessToken();
    const res = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { location?: GhlLocation };
    return data.location ?? {};
  } catch { return {}; }
}

async function fetchGhlContact(locationId: string, contactId: string): Promise<GhlContact> {
  try {
    const token = await getAgencyAccessToken();
    const res = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { contact?: GhlContact };
    return data.contact ?? {};
  } catch { return {}; }
}

export default async function PanelTicketPage({ params }: Props) {
  const { id } = await params;
  // Auth handled by proxy.ts
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  // Resolve current staff user for note authoring
  let currentUserEmail = "PatronPro";
  try {
    const cookieStore = await cookies();
    const ppToken = cookieStore.get("pp-session")?.value;
    if (ppToken) {
      const session = await verifyPpSession(ppToken);
      currentUserEmail = session.email ?? "PatronPro";
    }
  } catch { /* keep default */ }

  const [location, contact] = await Promise.all([
    fetchGhlLocation(ticket.ghl_location_id),
    ticket.ghl_contact_id ? fetchGhlContact(ticket.ghl_location_id, ticket.ghl_contact_id) : Promise.resolve({}),
  ]);

  const locationName  = (location as GhlLocation).name ?? ticket.ghl_location_id;
  const contactName   = [(contact as GhlContact).firstName, (contact as GhlContact).lastName].filter(Boolean).join(" ") || null;
  const contactEmail  = (contact as GhlContact).email ?? null;
  const ghlDashboard  = `https://app.getpatronpro.com/location/${ticket.ghl_location_id}/dashboard`;

  return (
    <PanelTicketDetail
      ticket={ticket}
      locationName={locationName}
      contactName={contactName}
      contactEmail={contactEmail}
      ghlDashboardUrl={ghlDashboard}
      currentUserEmail={currentUserEmail}
    />
  );
}

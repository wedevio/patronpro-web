import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { getTicket } from "@/lib/support/tickets";
import { notFound, redirect } from "next/navigation";
import PanelTicketDetail from "./_components/PanelTicketDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PanelTicketPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const ppToken = cookieStore.get("pp-session")?.value;

  if (!ppToken) {
    redirect("/login");
  }

  try {
    await verifyPpSession(ppToken);
  } catch {
    redirect("/login");
  }

  const ticket = await getTicket(id);
  if (!ticket) {
    notFound();
  }

  return <PanelTicketDetail ticket={ticket} />;
}

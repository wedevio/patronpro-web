import { getTicket } from "@/lib/support/tickets";
import { notFound } from "next/navigation";
import PanelTicketDetail from "./_components/PanelTicketDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PanelTicketPage({ params }: Props) {
  const { id } = await params;
  // Auth is handled by proxy.ts middleware
  const ticket = await getTicket(id);
  if (!ticket) notFound();
  return <PanelTicketDetail ticket={ticket} />;
}

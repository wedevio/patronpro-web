import { listTickets } from "@/lib/support/tickets";
import type { SupportTicket } from "@/lib/support/types";
import PanelSupportClient from "./_components/PanelSupportClient";

export const dynamic = "force-dynamic";

export default async function PanelSupportPage() {
  // Auth is handled by proxy.ts middleware — no need to re-verify here

  let tickets: SupportTicket[] = [];
  try {
    tickets = await listTickets({});
  } catch (err) {
    console.error("[PanelSupportPage] listTickets failed:", err);
  }

  return <PanelSupportClient tickets={tickets} />;
}

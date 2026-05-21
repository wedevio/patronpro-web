import { cookies } from "next/headers";
import { verifyPpSession } from "@/lib/auth/session";
import { listTickets } from "@/lib/support/tickets";
import type { SupportTicket } from "@/lib/support/types";
import PanelSupportClient from "./_components/PanelSupportClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PanelSupportPage() {
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

  let tickets: SupportTicket[] = [];
  try {
    tickets = await listTickets({});
  } catch (err) {
    console.error("[PanelSupportPage] listTickets failed:", err);
  }

  return <PanelSupportClient tickets={tickets} />;
}

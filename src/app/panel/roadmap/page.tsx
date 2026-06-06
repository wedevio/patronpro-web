import { redirect } from "next/navigation";
import { getPpSession } from "@/lib/auth/require-session";
import { listRoadmapWorkspace } from "@/lib/roadmap/store";
import type { RoadmapWorkspace } from "@/lib/roadmap/types";
import RoadmapPageClient from "./_components/RoadmapPageClient";

export const dynamic = "force-dynamic";

export default async function PanelRoadmapPage() {
  const session = await getPpSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/panel/onboarding");

  let workspace: RoadmapWorkspace = { tracks: [], items: [] };
  try {
    workspace = await listRoadmapWorkspace();
  } catch (err) {
    console.error("[PanelRoadmapPage] listRoadmapWorkspace failed:", err);
  }

  return (
    <RoadmapPageClient
      initialTracks={workspace.tracks}
      initialItems={workspace.items}
      currentUserEmail={session.email}
      isAdmin={session.role === "admin"}
    />
  );
}

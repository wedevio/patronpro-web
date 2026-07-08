import { notFound } from "next/navigation";
import { CandidateGrid } from "@/components/collaborators/CandidateCards";
import { getCollaborators } from "@/lib/collaborators/queries";
import type { CollaboratorLane } from "@/lib/collaborators/types";

export const dynamic = "force-dynamic";

const lanes = new Set(["schools", "influencers", "communities", "crm_providers"]);

function laneTitle(lane: string) {
  return lane.replace(/_/g, " ");
}

export default async function CollaboratorLanePage({ params }: { params: Promise<{ lane: string }> }) {
  const { lane } = await params;
  if (!lanes.has(lane)) notFound();
  const candidates = await getCollaborators(lane as CollaboratorLane);
  const isCrmProviderLane = lane === "crm_providers";

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">{isCrmProviderLane ? "Case study lane" : "Collaborator lane"}</p>
        <h1 className="mt-2 text-3xl font-semibold capitalize md:text-5xl">{laneTitle(lane)}</h1>
        <p className="mt-4 text-[#526078]">
          {isCrmProviderLane
            ? `${candidates.length} CRM provider case studies loaded from Postgres.`
            : `${candidates.length} records loaded from Postgres.`}
        </p>
      </header>
      <CandidateGrid candidates={candidates} />
    </div>
  );
}

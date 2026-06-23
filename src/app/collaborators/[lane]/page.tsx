import { notFound } from "next/navigation";
import { CandidateGrid } from "@/components/collaborators/CandidateCards";
import { getCollaborators } from "@/lib/collaborators/queries";
import type { CollaboratorLane } from "@/lib/collaborators/types";

export const dynamic = "force-dynamic";

const lanes = new Set(["schools", "influencers", "communities"]);

export default async function CollaboratorLanePage({ params }: { params: Promise<{ lane: string }> }) {
  const { lane } = await params;
  if (!lanes.has(lane)) notFound();
  const candidates = await getCollaborators(lane as CollaboratorLane);

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Collaborator lane</p>
        <h1 className="mt-2 text-3xl font-semibold capitalize md:text-5xl">{lane}</h1>
        <p className="mt-4 text-[#526078]">{candidates.length} records loaded from Postgres.</p>
      </header>
      <CandidateGrid candidates={candidates} />
    </div>
  );
}

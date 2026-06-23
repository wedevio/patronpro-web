import { notFound } from "next/navigation";
import { CandidateDetail } from "@/components/collaborators/CandidateDetail";
import { getCollaborator } from "@/lib/collaborators/queries";
import type { CollaboratorLane } from "@/lib/collaborators/types";

export const dynamic = "force-dynamic";

const lanes = new Set(["schools", "influencers", "communities"]);

export default async function CollaboratorDetailPage({ params }: { params: Promise<{ lane: string; id: string }> }) {
  const { lane, id } = await params;
  if (!lanes.has(lane)) notFound();
  const candidate = await getCollaborator(lane as CollaboratorLane, id);
  if (!candidate) notFound();
  return <CandidateDetail candidate={candidate} />;
}

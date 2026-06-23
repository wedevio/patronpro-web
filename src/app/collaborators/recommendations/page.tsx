import { CandidateGrid } from "@/components/collaborators/CandidateCards";
import { getRecommendations } from "@/lib/collaborators/queries";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const candidates = await getRecommendations();
  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Shortlist</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Recommendations and watchlist</h1>
        <p className="mt-4 max-w-4xl text-[#526078]">
          Sorted from Postgres scorecards. Candidates without enough evidence should remain watchlist or defer until the missing-field audit is cleared.
        </p>
      </header>
      <CandidateGrid candidates={candidates} />
    </div>
  );
}

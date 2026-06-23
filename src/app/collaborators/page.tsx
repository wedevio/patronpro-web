import Link from "next/link";
import { CandidateGrid } from "@/components/collaborators/CandidateCards";
import { getCollaborators, getDashboardSummary } from "@/lib/collaborators/queries";

export const dynamic = "force-dynamic";

export default async function CollaboratorsOverviewPage() {
  const [summary, candidates] = await Promise.all([getDashboardSummary(), getCollaborators()]);
  const topCandidates = candidates.slice(0, 9);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5200]">Research dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#182235] md:text-5xl">
          PatronPro collaborator pipeline
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#526078] md:text-lg">
          Postgres-backed review surface for schools, influencers, and communities. The current static dashboard remains live while this Next.js version becomes the working system of record.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Candidates" value={summary.total} />
        <Metric label="Schools" value={summary.byLane.schools} href="/collaborators/schools" />
        <Metric label="Influencers" value={summary.byLane.influencers} href="/collaborators/influencers" />
        <Metric label="Communities" value={summary.byLane.communities} href="/collaborators/communities" />
        <Metric label="Media items" value={summary.totalMedia} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Migration rule</h2>
          <p className="mt-3 text-sm leading-6 text-[#526078]">
            Original videos and screenshots stay on NAS. Browser-facing pages should use optimized WebP derivatives and sanitized Postgres projections.
          </p>
        </div>
        <div className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Audit state</h2>
          <p className="mt-3 text-sm leading-6 text-[#526078]">
            {summary.readyForReview} candidates are ready for review. {summary.missingFieldRows} still have missing-field rows that should be repaired or explicitly deferred.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Current top candidates</h2>
          <Link href="/collaborators/recommendations" className="text-sm font-semibold text-[#1d5fa7]">
            View recommendations
          </Link>
        </div>
        <CandidateGrid candidates={topCandidates} />
      </section>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68758d]">{label}</span>
      <strong className="mt-2 block text-3xl text-[#182235]">{new Intl.NumberFormat("en-US").format(value)}</strong>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

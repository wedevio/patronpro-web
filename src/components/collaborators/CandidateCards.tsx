import Link from "next/link";
import type { CollaboratorProjection } from "@/lib/collaborators/types";

function scoreLabel(score?: number | null) {
  if (score === null || score === undefined) return "No score";
  return (score / 20).toFixed(1);
}

function reachLabel(reach?: number | null) {
  if (!reach) return "Reach pending";
  return new Intl.NumberFormat("en-US").format(reach);
}

function laneLabel(lane: string) {
  return lane.replace(/_/g, " ");
}

function strategyReach(candidate: CollaboratorProjection) {
  return candidate.crmStrategy?.knownSocialReach ?? candidate.totalReach ?? null;
}

function campaignSignalLabel(candidate: CollaboratorProjection) {
  const signalCount = candidate.crmStrategy?.campaignSignals.length ?? 0;
  const influencerCount = candidate.crmStrategy?.knownInfluencerOrPartnerCount ?? null;
  const providerEvidenceCount = candidate.providerPublicEvidence.length;
  if (providerEvidenceCount) return `${providerEvidenceCount} receipts`;
  if (influencerCount) return `${new Intl.NumberFormat("en-US").format(influencerCount)} creators`;
  if (signalCount) return `${signalCount} signals`;
  return "Pending";
}

function channelLabel(candidate: CollaboratorProjection) {
  const channelCount = candidate.crmStrategy?.primaryChannels.length ?? 0;
  if (channelCount) return `${channelCount} channels`;
  return candidate.socialProfiles.length ? `${candidate.socialProfiles.length} profiles` : "Pending";
}

function CrmProviderCard({ candidate }: { candidate: CollaboratorProjection }) {
  const patternCount = candidate.crmStrategyPatterns.length;
  return (
    <Link
      href={`/collaborators/${candidate.lane}/${candidate.id}`}
      className="group rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f1a13c] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68758d]">CRM provider case study</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-[#182235] group-hover:text-[#1E2C46]">
            {candidate.name}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3df] px-3 py-1 text-sm font-semibold text-[#9b5200]">
          Strategy {scoreLabel(candidate.score)}
        </span>
      </div>
      {candidate.overviewSummary ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#526078]">{candidate.overviewSummary}</p> : null}
      {candidate.fitSummary ? (
        <p className="mt-3 line-clamp-2 border-l-2 border-[#f1a13c] pl-3 text-sm leading-6 text-[#33415c]">
          <strong>Strategy readout:</strong> {candidate.fitSummary}
        </p>
      ) : null}
      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-[#f5f7fb] p-3">
          <span className="block text-xs text-[#68758d]">Patterns</span>
          <strong className="mt-1 block text-[#182235]">{patternCount || "Pending"}</strong>
        </div>
        <div className="rounded-xl bg-[#f5f7fb] p-3">
          <span className="block text-xs text-[#68758d]">Channels</span>
          <strong className="mt-1 block text-[#182235]">{channelLabel(candidate)}</strong>
        </div>
        <div className="rounded-xl bg-[#f5f7fb] p-3">
          <span className="block text-xs text-[#68758d]">Receipts</span>
          <strong className="mt-1 block text-[#182235]">{campaignSignalLabel(candidate)}</strong>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#526078]">
        <span className="rounded-full bg-[#eef4fb] px-2 py-1">Reach {reachLabel(strategyReach(candidate))}</span>
        {candidate.crmStrategy?.metricSources.length ? (
          <span className="rounded-full bg-[#eef4fb] px-2 py-1">{candidate.crmStrategy.metricSources.length} metric sources</span>
        ) : null}
      </div>
    </Link>
  );
}

export function CandidateGrid({ candidates }: { candidates: CollaboratorProjection[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {candidates.map((candidate) =>
        candidate.lane === "crm_providers" ? (
          <CrmProviderCard key={candidate.id} candidate={candidate} />
        ) : (
          <Link
            key={candidate.id}
            href={`/collaborators/${candidate.lane}/${candidate.id}`}
            className="group rounded-2xl border border-[#dfe5ee] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f1a13c] hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68758d]">{laneLabel(candidate.lane)}</p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-[#182235] group-hover:text-[#1E2C46]">
                  {candidate.name}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3df] px-3 py-1 text-sm font-semibold text-[#9b5200]">
                <span aria-hidden="true">&#9733;</span>
                {scoreLabel(candidate.score)}
              </span>
            </div>
            {candidate.overviewSummary ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#526078]">{candidate.overviewSummary}</p> : null}
            {candidate.fitSummary ? (
              <p className="mt-3 line-clamp-2 border-l-2 border-[#f1a13c] pl-3 text-sm leading-6 text-[#33415c]">
                <strong>PatronPro fit:</strong> {candidate.fitSummary}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-[#f5f7fb] p-3">
                <span className="block text-xs text-[#68758d]">Reach</span>
                <strong className="mt-1 block text-[#182235]">{reachLabel(candidate.totalReach)}</strong>
              </div>
              <div className="rounded-xl bg-[#f5f7fb] p-3">
                <span className="block text-xs text-[#68758d]">Media</span>
                <strong className="mt-1 block text-[#182235]">{candidate.media.length}</strong>
              </div>
              <div className="rounded-xl bg-[#f5f7fb] p-3">
                <span className="block text-xs text-[#68758d]">Gaps</span>
                <strong className="mt-1 block text-[#182235]">{candidate.missingFields.length}</strong>
              </div>
            </div>
          </Link>
        ),
      )}
    </div>
  );
}

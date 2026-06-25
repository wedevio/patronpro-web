"use client";

import { useMemo, useState } from "react";

type ClearanceProfile = {
  platform: string;
  url: string;
  visibleMetric?: string | null;
};

type ClearanceResponse = {
  ok?: boolean;
  error?: string;
  applied?: boolean;
  reusedExisting?: boolean;
  preview?: {
    platform: string;
    canonicalSourceUrl: string;
    scope: string;
    scopeLevel: string;
    maxRecords: number;
    safetyWarnings?: string[];
  };
  job?: {
    jobId: string;
    status: string;
  };
  events?: Array<{
    seq: number;
    status: string;
    phase: string;
    blocker?: string | null;
    result?: string | null;
  }>;
};

function platformScope(platform: string) {
  return platform === "youtube" ? "subtitle_smoke" : "metadata_smoke";
}

function platformCap(platform: string) {
  return platform === "youtube" ? 25 : 20;
}

export function CommercialClearanceButton({
  candidateId,
  profiles,
}: {
  candidateId: string;
  profiles: ClearanceProfile[];
}) {
  const options = useMemo(() => profiles.filter((profile) => ["youtube", "tiktok"].includes(profile.platform)), [profiles]);
  const [selected, setSelected] = useState(options[0]?.url ?? "");
  const selectedProfile = options.find((profile) => profile.url === selected) ?? options[0] ?? null;
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<ClearanceResponse | null>(null);

  if (!options.length || !selectedProfile) return null;

  async function submit(apply: boolean) {
    if (!selectedProfile) return;
    setBusy(true);
    setResponse(null);
    try {
      const res = await fetch("/api/collaborators/clearance-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          platform: selectedProfile.platform,
          sourceUrl: selectedProfile.url,
          scope: platformScope(selectedProfile.platform),
          maxRecords: platformCap(selectedProfile.platform),
          apply,
        }),
      });
      setResponse((await res.json()) as ClearanceResponse);
    } catch (error) {
      setResponse({ ok: false, error: error instanceof Error ? error.message : "Unable to create clearance job" });
    } finally {
      setBusy(false);
    }
  }

  async function refreshJob() {
    const jobId = response?.job?.jobId;
    if (!jobId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/collaborators/clearance-jobs?jobId=${encodeURIComponent(jobId)}`);
      setResponse((await res.json()) as ClearanceResponse);
    } catch (error) {
      setResponse({ ok: false, error: error instanceof Error ? error.message : "Unable to refresh clearance job" });
    } finally {
      setBusy(false);
    }
  }

  const latestEvent = response?.events?.at(-1);

  return (
    <div className="mt-4 rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68758d]">Commercial clearance</p>
          <p className="mt-1 text-sm leading-6 text-[#42506a]">
            Run a bounded free smoke check for CRM, software, sponsorship, affiliate, or product-endorsement signals.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#526078]">No outreach sent</span>
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[#68758d]" htmlFor={`clearance-${candidateId}`}>
        Source profile
      </label>
      <select
        id={`clearance-${candidateId}`}
        className="mt-2 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 py-2 text-sm text-[#182235]"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        {options.map((profile) => (
          <option key={`${profile.platform}-${profile.url}`} value={profile.url}>
            {profile.platform} · {profile.visibleMetric ?? profile.url}
          </option>
        ))}
      </select>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => submit(false)}
          className="rounded-xl border border-[#dfe5ee] bg-white px-3 py-2 text-sm font-semibold text-[#1E2C46] disabled:opacity-50"
        >
          Preview
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit(true)}
          className="rounded-xl bg-[#1E2C46] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Start smoke run
        </button>
        {response?.job?.jobId ? (
          <button
            type="button"
            disabled={busy}
            onClick={refreshJob}
            className="rounded-xl border border-[#dfe5ee] bg-white px-3 py-2 text-sm font-semibold text-[#1E2C46] disabled:opacity-50"
          >
            Refresh
          </button>
        ) : null}
      </div>

      {response?.error ? <p className="mt-3 rounded-xl bg-[#fff1f0] p-3 text-sm text-[#9d2b22]">{response.error}</p> : null}
      {response?.preview ? (
        <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-[#42506a]">
          <p>
            {response.applied ? "Queued" : "Preview"}: {response.preview.platform} {response.preview.scopeLevel} check, up to {response.preview.maxRecords} public items.
          </p>
          <a className="break-all text-[#1d5fa7] underline-offset-4 hover:underline" href={response.preview.canonicalSourceUrl} target="_blank" rel="noreferrer">
            {response.preview.canonicalSourceUrl}
          </a>
          {response.preview.safetyWarnings?.length ? (
            <p className="mt-2 text-xs text-[#8a5b17]">{response.preview.safetyWarnings[0]}</p>
          ) : null}
        </div>
      ) : null}
      {response?.job ? (
        <div className="mt-3 rounded-xl bg-white p-3 text-sm text-[#42506a]">
          <p>
            Job: <span className="font-semibold text-[#182235]">{response.job.status}</span>
            {response.reusedExisting ? " (existing active job)" : ""}
          </p>
          {latestEvent ? (
            <p className="mt-1 text-xs text-[#68758d]">
              Latest event: {latestEvent.phase} / {latestEvent.status}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "preview"; message: string; canApply: boolean }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function GhlContactButton({
  candidateId,
  personId,
  routeId,
  latestStatus,
}: {
  candidateId: string;
  personId: string;
  routeId?: string | null;
  latestStatus?: string | null;
}) {
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function syncContact(apply: boolean) {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/collaborators/ghl-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          personId,
          personContactRouteId: routeId ?? undefined,
          apply,
        }),
      });
      const json = (await response.json()) as {
        error?: string;
        syncStatus?: string;
        crmContactIdPresent?: boolean;
        canApply?: boolean;
        minimumContactDataStatus?: string;
        noteStatus?: string;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "GHL sync failed");
      }
      if (!apply) {
        setState({
          status: "preview",
          canApply: Boolean(json.canApply),
          message: json.canApply
            ? "Preview ready. Confirm to create or update this contact in PatronPro / GHL."
            : `Preview only: ${json.minimumContactDataStatus ?? "missing email or phone"}.`,
        });
        return;
      }
      setState({
        status: "success",
        message: json.crmContactIdPresent
          ? `Synced in PatronPro / GHL${json.noteStatus === "success" ? " with research note." : "."}`
          : `Recorded ${json.syncStatus ?? "sync"}.`,
      });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "GHL sync failed" });
    }
  }

  const disabled = state.status === "loading";
  const label = state.status === "preview" && state.canApply
    ? latestStatus === "success" ? "Confirm update" : "Confirm create"
    : latestStatus === "success" ? "Preview GHL update" : "Preview GHL create";

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => syncContact(state.status === "preview" && state.canApply)}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1E2C46] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b3e60] disabled:cursor-not-allowed disabled:opacity-65"
        title="Create or update this public contact in the PatronPro GoHighLevel account. No outreach message is sent."
      >
        {state.status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {label}
      </button>
      {state.status === "success" ? (
        <p className="inline-flex items-center gap-2 text-sm text-[#1d6a3a]">
          <CheckCircle2 size={15} />
          {state.message}
        </p>
      ) : null}
      {state.status === "preview" ? (
        <p className={`inline-flex items-start gap-2 text-sm ${state.canApply ? "text-[#42506a]" : "text-[#a6402b]"}`}>
          {state.canApply ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" />}
          <span>{state.message}</span>
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="inline-flex items-start gap-2 text-sm text-[#a6402b]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{state.message}</span>
        </p>
      ) : null}
    </div>
  );
}

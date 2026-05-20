"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { PanelSubmission, ChecklistItemId } from "@/lib/panel/store";
import { CHECKLIST_ITEMS } from "@/lib/panel/store";

function progress(checklist: Record<ChecklistItemId, boolean>): number {
  const total   = CHECKLIST_ITEMS.length;
  const done    = CHECKLIST_ITEMS.filter((i) => checklist[i.id]).length;
  return Math.round((done / total) * 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? "#22c55e" : pct >= 50 ? "#F67D0A" : "#94a3b8";
  return (
    <div className="w-full h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function AccountCard({ sub }: { sub: PanelSubmission }) {
  const [checklist, setChecklist] = useState(sub.checklist);
  const [isPending, startTransition] = useTransition();

  const pct = progress(checklist);
  const isComplete = pct === 100;

  async function toggle(itemId: ChecklistItemId) {
    const newVal = !checklist[itemId];
    // Optimistic update
    setChecklist((prev) => ({ ...prev, [itemId]: newVal }));

    startTransition(async () => {
      try {
        const res = await fetch("/api/panel/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId: sub.locationId, itemId, checked: newVal }),
        });
        if (!res.ok) {
          // Revert on error
          setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
        }
      } catch {
        setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
      }
    });
  }

  return (
    <div
      className="bg-white rounded-[20px] border overflow-hidden"
      style={{
        borderColor: isComplete ? "rgba(34,197,94,0.30)" : "rgba(30,44,70,0.10)",
        boxShadow: "0 4px 20px rgba(20,35,58,0.07)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(30,44,70,0.07)" }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-bold text-[18px] leading-tight" style={{ color: "#1E2C46" }}>
              {sub.businessName}
            </h2>
            <p className="text-[13px] mt-0.5" style={{ color: "#5f6f88" }}>
              {sub.email} · {sub.phone}
            </p>
          </div>
          <span
            className="shrink-0 px-3 py-1 rounded-full text-[12px] font-bold"
            style={
              isComplete
                ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
                : { background: "rgba(30,44,70,0.06)", color: "#5f6f88" }
            }
          >
            {isComplete ? "Completado" : `${pct}%`}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] mb-3" style={{ color: "#5f6f88" }}>
          <span><strong style={{ color: "#1E2C46" }}>Dominio:</strong> {sub.domain || "—"}</span>
          <span><strong style={{ color: "#1E2C46" }}>Location ID:</strong> {sub.locationId}</span>
          <span><strong style={{ color: "#1E2C46" }}>Onboarding:</strong> {formatDate(sub.submittedAt)}</span>
        </div>

        <ProgressBar pct={pct} />
      </div>

      {/* Checklist */}
      <ul className="px-6 py-4 grid gap-2" style={{ opacity: isPending ? 0.7 : 1 }}>
        {CHECKLIST_ITEMS.map((item) => {
          const checked = checklist[item.id];
          return (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="flex items-center gap-3 w-full text-left cursor-pointer group"
                disabled={isPending}
              >
                {checked
                  ? <CheckCircle2 size={18} strokeWidth={2} color="#22c55e" className="shrink-0" />
                  : <Circle size={18} strokeWidth={1.5} color="#cbd5e1" className="shrink-0 group-hover:text-[#F67D0A] transition-colors" />
                }
                <span
                  className="text-[14px] leading-snug transition-colors"
                  style={{ color: checked ? "#64748b" : "#1E2C46", textDecoration: checked ? "line-through" : "none" }}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PanelClient({ submissions }: { submissions: PanelSubmission[] }) {
  const total     = submissions.length;
  const completed = submissions.filter((s) => progress(s.checklist) === 100).length;
  const pending   = total - completed;

  return (
    <div className="min-h-screen" style={{ background: "#F7F3EC" }}>
      {/* Top bar */}
      <header className="bg-[#1E2C46] px-6 py-4 flex items-center justify-between">
        <span className="font-black text-white text-[18px] tracking-tight">PatronPro · Panel</span>
        <div className="flex gap-4 text-[13px] font-semibold">
          <span className="text-white/60">{total} cuentas</span>
          <span style={{ color: "#F67D0A" }}>{pending} pendientes</span>
          <span style={{ color: "#22c55e" }}>{completed} completadas</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 py-10">
        {total === 0 ? (
          <div className="text-center py-24">
            <p className="text-[17px]" style={{ color: "#5f6f88" }}>
              Todavía no hay cuentas registradas. Cuando alguien complete el onboarding aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {submissions.map((sub) => (
              <AccountCard key={sub.locationId} sub={sub} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

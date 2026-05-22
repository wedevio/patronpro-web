"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketPriority } from "@/lib/support/types";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-3">
      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <p className="text-[22px] font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<TicketStatus, string> = {
  new: "Nuevo",
  triage: "Triage",
  assigned: "Asignado",
  waiting_client: "Esp. cliente",
  waiting_internal: "Esp. interno",
  waiting_tech: "Esp. tech",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

function statusBadge(status: TicketStatus) {
  const map: Record<TicketStatus, string> = {
    new: "bg-gray-100 text-gray-700",
    triage: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800",
    waiting_client: "bg-orange-100 text-orange-800",
    waiting_internal: "bg-orange-100 text-orange-800",
    waiting_tech: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function priorityBadge(priority: TicketPriority) {
  const map: Record<TicketPriority, string> = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[priority] ?? "bg-gray-100 text-gray-700"}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  tickets: SupportTicket[];
}

export default function PanelSupportClient({ tickets }: Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.ghl_contact_id ?? "").toLowerCase().includes(q) &&
          !(t.assignee ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, search]);

  const total    = tickets.length;
  const open     = tickets.filter((t) => !["resolved","closed"].includes(t.status)).length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const urgent   = tickets.filter((t) => t.priority === "urgent").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total tickets"  value={total}    color="#1E2C46" />
          <StatCard label="Abiertos"       value={open}     color="#F67A0A" />
          <StatCard label="Resueltos"      value={resolved} color="#22c55e" />
          <StatCard label="Urgentes"       value={urgent}   color="#ef4444" />
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-white mt-4 py-3">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo o contacto..."
              className="rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas las prioridades</option>
            {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {(statusFilter || priorityFilter || search) && (
            <button
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); setSearch(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Titulo</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Prioridad</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3 text-left">Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No hay tickets que coincidan con los filtros.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/panel/support/${t.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    #{t.ticket_number}
                  </td>
                  <td className="max-w-56 px-4 py-3">
                    <span className="line-clamp-2 font-medium text-gray-900">{t.title}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {t.ghl_contact_id || "—"}
                  </td>
                  <td className="max-w-32 px-4 py-3 font-mono text-xs text-gray-500">
                    <span className="truncate block">{t.ghl_location_id || "—"}</span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3">{priorityBadge(t.priority)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.assignee ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Mostrando {filtered.length} de {tickets.length} tickets
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Plus, TicketCheck, Loader2, X, ChevronLeft } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from "@/lib/support/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PATRONPRO_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";

const STATUS_LABELS: Record<TicketStatus, string> = {
  new: "Nuevo",
  triage: "Triage",
  assigned: "Asignado",
  waiting_client: "Esperando cliente",
  waiting_internal: "Esperando interno",
  waiting_tech: "Esperando tech",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const OPEN_STATUSES: TicketStatus[] = [
  "new", "triage", "assigned", "waiting_client", "waiting_internal", "waiting_tech",
];

function statusBadgeClass(status: TicketStatus): string {
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
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function priorityBadgeClass(priority: TicketPriority): string {
  const map: Record<TicketPriority, string> = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700";
}

// ---------------------------------------------------------------------------
// TicketForm
// ---------------------------------------------------------------------------

interface TicketFormProps {
  locationId: string;
  onSuccess: (ticket: SupportTicket) => void;
  onCancel: () => void;
}

function TicketForm({ locationId, onSuccess, onCancel }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [submittedBy, setSubmittedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ghl_location_id: locationId,
          submitted_by: submittedBy,
          title,
          description,
          category,
          priority,
          source: "internal_ghl",
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Error al crear ticket");
      }
      const ticket = (await res.json()) as SupportTicket;
      onSuccess(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Describe brevemente el problema"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explica con detalle el problema o solicitud"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="technical">Técnico</option>
            <option value="billing">Facturación</option>
            <option value="onboarding">Onboarding</option>
            <option value="account">Cuenta</option>
            <option value="feature_request">Nueva función</option>
            <option value="bug">Bug</option>
            <option value="general">General</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Prioridad</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Tu nombre o email <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="nombre@empresa.com"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded bg-[#F67A0A] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Enviar ticket
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Props {
  locationId?: string;
}

type View = "list" | "form" | "success";

export default function GhlSupportClient({ locationId: propLocationId }: Props) {
  const locationId = propLocationId ?? PATRONPRO_LOCATION_ID;

  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  // Auth on mount
  useEffect(() => {
    fetch("/api/auth/ghl-iframe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location_id: locationId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          throw new Error(d.error ?? "Auth failed");
        }
        setAuthed(true);
      })
      .catch((err: unknown) => {
        setAuthError(err instanceof Error ? err.message : "Error de autenticación");
        setLoading(false);
      });
  }, [locationId]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) return;
      const data = (await res.json()) as { tickets: SupportTicket[] };
      setTickets(data.tickets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void loadTickets();
  }, [authed, loadTickets]);

  // --- Auth error ---
  if (authError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // --- Success ---
  if (view === "success" && createdTicket) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-center">
          <TicketCheck className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="text-lg font-semibold text-green-800">
            Ticket #{createdTicket.ticket_number} creado
          </p>
          <p className="mt-1 text-sm text-green-700">{createdTicket.title}</p>
          <button
            onClick={() => { setView("list"); setCreatedTicket(null); }}
            className="mt-4 rounded border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
          >
            Ver todos los tickets
          </button>
        </div>
      </div>
    );
  }

  // --- Form ---
  if (view === "form") {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
          <button
            onClick={() => setView("list")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold text-[#1E2C46]">Nuevo ticket</h1>
        </div>
        <TicketForm
          locationId={locationId}
          onSuccess={(t) => { setCreatedTicket(t); setView("success"); void loadTickets(); }}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  // --- List ---
  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status));
  const closed = tickets.filter((t) => !OPEN_STATUSES.includes(t.status));

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h1 className="text-base font-semibold text-[#1E2C46]">Soporte PatronPro</h1>
        <button
          onClick={() => setView("form")}
          className="flex items-center gap-1.5 rounded bg-[#F67A0A] px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo ticket
        </button>
      </div>

      {/* Open tickets */}
      <div className="mb-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Abiertos ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="rounded bg-gray-50 py-4 text-center text-xs text-gray-400">
            No hay tickets abiertos.
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((t) => <TicketRow key={t.id} ticket={t} />)}
          </ul>
        )}
      </div>

      {/* Closed tickets */}
      {closed.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Cerrados ({closed.length})
          </h2>
          <ul className="space-y-2">
            {closed.map((t) => <TicketRow key={t.id} ticket={t} />)}
          </ul>
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket: t }: { ticket: SupportTicket }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className="cursor-pointer rounded border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            #{t.ticket_number} — {t.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{t.submitted_by}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(t.status)}`}>
            {STATUS_LABELS[t.status]}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityBadgeClass(t.priority)}`}>
            {PRIORITY_LABELS[t.priority]}
          </span>
        </div>
      </div>
      {open && (
        <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-600 whitespace-pre-wrap">
          {t.description}
        </p>
      )}
    </li>
  );
}

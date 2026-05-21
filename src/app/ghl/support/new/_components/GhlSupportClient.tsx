"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Plus, TicketCheck, Search, Loader2, X } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from "@/lib/support/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  contactId?: string;
  locationId?: string;
}

interface AuthState {
  status: "idle" | "loading" | "done" | "error";
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  "new",
  "triage",
  "assigned",
  "waiting_client",
  "waiting_internal",
  "waiting_tech",
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
// DuplicateWarning
// ---------------------------------------------------------------------------

interface DuplicateWarningProps {
  duplicates: SupportTicket[];
  onContinue: () => void;
  onCancel: () => void;
}

function DuplicateWarning({ duplicates, onContinue, onCancel }: DuplicateWarningProps) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-800">
            Ya existe un ticket abierto similar:
          </p>
          <ul className="mt-2 space-y-2">
            {duplicates.map((t) => (
              <li key={t.id} className="rounded bg-white p-2 text-xs shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    #{t.ticket_number} — {t.title}
                  </span>
                  <div className="flex gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(t.status)}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityBadgeClass(t.priority)}`}>
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onCancel}
              className="rounded border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
            >
              Ver ticket existente
            </button>
            <button
              onClick={onContinue}
              className="rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
            >
              Crear nuevo de todos modos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TicketForm
// ---------------------------------------------------------------------------

interface TicketFormProps {
  contactId: string;
  locationId: string;
  onSuccess: (ticket: SupportTicket) => void;
  onCancel: () => void;
}

function TicketForm({ contactId, locationId, onSuccess, onCancel }: TicketFormProps) {
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
          ghl_contact_id: contactId,
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
          Titulo <span className="text-red-500">*</span>
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
          Descripcion <span className="text-red-500">*</span>
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
          <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="technical">Tecnico</option>
            <option value="billing">Facturacion</option>
            <option value="onboarding">Onboarding</option>
            <option value="account">Cuenta</option>
            <option value="feature_request">Nueva funcion</option>
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
          Enviado por (tu nombre o email) <span className="text-red-500">*</span>
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
          Crear ticket
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
// Main GhlSupportClient
// ---------------------------------------------------------------------------

// PatronPro's own GHL location — used as fallback when form is opened without URL params
const PATRONPRO_LOCATION_ID = "hHLZC7FaTtUINPf3cbHd";

export default function GhlSupportClient({ contactId: propContactId, locationId: propLocationId }: Props) {
  const [authState, setAuthState] = useState<AuthState>({ status: "idle" });
  const [contactId, setContactId] = useState(propContactId ?? "");
  const [locationId] = useState(propLocationId ?? PATRONPRO_LOCATION_ID);
  const [searchInput, setSearchInput] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [duplicates, setDuplicates] = useState<SupportTicket[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  // Step 1: establish auth session
  useEffect(() => {
    if (!propLocationId) return; // no params provided, skip auth
    setAuthState({ status: "loading" });
    fetch("/api/auth/ghl-iframe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location_id: propLocationId,
        contact_id: propContactId,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          throw new Error(d.error ?? "Auth failed");
        }
        setAuthState({ status: "done" });
      })
      .catch((err: unknown) => {
        setAuthState({ status: "error", error: err instanceof Error ? err.message : "Error de autenticacion" });
      });
  }, [propLocationId, propContactId]);

  // Step 2: load tickets once auth is done and we have a contactId
  const loadTickets = useCallback(async (cid: string) => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`/api/support/tickets?ghlContactId=${encodeURIComponent(cid)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { tickets: SupportTicket[] };
      setTickets(data.tickets.filter((t) => OPEN_STATUSES.includes(t.status)));
    } catch {
      // silent
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (authState.status === "done" && contactId) {
      void loadTickets(contactId);
    }
  }, [authState.status, contactId, loadTickets]);

  async function handleCreateClick() {
    if (!contactId) return;
    // Check for duplicates first
    const res = await fetch(`/api/support/tickets?ghlContactId=${encodeURIComponent(contactId)}`);
    if (res.ok) {
      const data = (await res.json()) as { tickets: SupportTicket[] };
      const open = data.tickets.filter((t) => OPEN_STATUSES.includes(t.status));
      if (open.length > 0) {
        setDuplicates(open);
        setShowDuplicateWarning(true);
        return;
      }
    }
    setShowForm(true);
  }

  function handleTicketCreated(ticket: SupportTicket) {
    setCreatedTicket(ticket);
    setShowForm(false);
    setShowDuplicateWarning(false);
    void loadTickets(contactId);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setContactId(trimmed);
    void loadTickets(trimmed);
  }

  // ----- Auth loading/error states -----
  if (propLocationId && authState.status === "loading") {
    return (
      <div className="flex min-h-40 items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (authState.status === "error") {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{authState.error}</span>
        </div>
      </div>
    );
  }

  // ----- Success: ticket created -----
  if (createdTicket) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-center">
          <TicketCheck className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="text-lg font-semibold text-green-800">
            Ticket #{createdTicket.ticket_number} creado
          </p>
          <p className="mt-1 text-sm text-green-700">{createdTicket.title}</p>
          <button
            onClick={() => setCreatedTicket(null)}
            className="mt-4 rounded border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
          >
            Ver tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h1 className="text-base font-semibold text-[#1E2C46]">Soporte PatronPro</h1>
        {locationId && (
          <p className="mt-0.5 text-xs text-gray-500">Location: {locationId}</p>
        )}
      </div>

      {/* Contact search (no contactId from URL) */}
      {!propContactId && (
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Buscar cliente por nombre o GHL Contact ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ID o nombre del contacto"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded bg-[#1E2C46] px-3 py-2 text-sm font-medium text-white hover:bg-blue-900"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </form>
      )}

      {/* Existing open tickets */}
      {contactId && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Tickets abiertos</h2>
            {loadingTickets && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          {!loadingTickets && tickets.length === 0 && (
            <p className="rounded bg-gray-50 py-3 text-center text-xs text-gray-500">
              No hay tickets abiertos para este contacto.
            </p>
          )}

          {tickets.length > 0 && (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id} className="rounded border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        #{t.ticket_number} — {t.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{t.description.slice(0, 80)}…</p>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Duplicate warning */}
      {showDuplicateWarning && (
        <div className="mb-4">
          <DuplicateWarning
            duplicates={duplicates}
            onContinue={() => {
              setShowDuplicateWarning(false);
              setShowForm(true);
            }}
            onCancel={() => setShowDuplicateWarning(false)}
          />
        </div>
      )}

      {/* New ticket form */}
      {showForm && contactId && locationId && (
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1E2C46]">Nuevo ticket</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <TicketForm
            contactId={contactId}
            locationId={locationId}
            onSuccess={handleTicketCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Create button */}
      {!showForm && !showDuplicateWarning && contactId && locationId && (
        <button
          onClick={handleCreateClick}
          className="flex w-full items-center justify-center gap-2 rounded bg-[#F67A0A] py-2.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Crear nuevo ticket
        </button>
      )}

      {/* Fallback mode indicator */}
      {!propLocationId && (
        <div className="mt-4 rounded bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
          Modo manual — usando location PatronPro por defecto. Para uso completo, abrir desde GHL.
        </div>
      )}
    </div>
  );
}

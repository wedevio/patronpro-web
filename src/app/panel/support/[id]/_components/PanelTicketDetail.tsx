"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { SupportTicket, TicketNote, TicketStatus, TicketPriority } from "@/lib/support/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "triage", label: "Triage" },
  { value: "assigned", label: "Asignado" },
  { value: "waiting_client", label: "Esperando cliente" },
  { value: "waiting_internal", label: "Esperando interno" },
  { value: "waiting_tech", label: "Esperando tech" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const STATUS_BADGE: Record<TicketStatus, string> = {
  new: "bg-gray-100 text-gray-700",
  triage: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  waiting_client: "bg-orange-100 text-orange-800",
  waiting_internal: "bg-orange-100 text-orange-800",
  waiting_tech: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-600",
};

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  ticket: SupportTicket;
}

export default function PanelTicketDetail({ ticket: initial }: Props) {
  const [ticket, setTicket] = useState(initial);
  const [notes, setNotes] = useState<TicketNote[]>(initial.notes ?? []);

  // Update controls
  const [saving, setSaving] = useState(false);

  // Add note form
  const [noteBody, setNoteBody] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");
  const [notePublic, setNotePublic] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  async function patchTicket(patch: Partial<{ status: TicketStatus; priority: TicketPriority; assignee: string | null }>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated = (await res.json()) as SupportTicket;
        setTicket(updated);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim() || !noteAuthor.trim()) return;
    setNoteError(null);
    setAddingNote(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: noteAuthor, body: noteBody, is_public: notePublic }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Error al agregar nota");
      }
      const note = (await res.json()) as TicketNote;
      setNotes((prev) => [...prev, note]);
      setNoteBody("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Error");
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-[#1E2C46] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/panel/support"
            className="flex items-center gap-1 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Tickets
          </Link>
          <div className="h-4 w-px bg-blue-300" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-white">
                #{ticket.ticket_number} — {ticket.title}
              </h1>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-blue-300" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[ticket.status] ?? "bg-gray-100 text-gray-700"}`}>
              {STATUS_OPTIONS.find((o) => o.value === ticket.status)?.label ?? ticket.status}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[ticket.priority] ?? "bg-gray-100 text-gray-700"}`}>
              {PRIORITY_OPTIONS.find((o) => o.value === ticket.priority)?.label ?? ticket.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Descripcion</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{ticket.description}</p>
            </div>

            {/* Notes timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Notas ({notes.length})
              </h2>

              {notes.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">Sin notas aun.</p>
              )}

              <ul className="space-y-4">
                {notes.map((note) => (
                  <li key={note.id} className="flex gap-3">
                    <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#1E2C46] text-center text-xs font-bold leading-7 text-white">
                      {note.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${note.is_public ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {note.is_public ? "Publica" : "Interna"}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{note.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Add note form */}
              <form onSubmit={submitNote} className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                <h3 className="text-xs font-semibold text-gray-600">Agregar nota</h3>
                {noteError && (
                  <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{noteError}</p>
                )}
                <textarea
                  required
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Escribe una nota..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    placeholder="Tu nombre o email"
                    className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={notePublic}
                      onChange={(e) => setNotePublic(e.target.checked)}
                      className="rounded"
                    />
                    Publica
                  </label>
                  <button
                    type="submit"
                    disabled={addingNote}
                    className="flex items-center gap-1 rounded bg-[#1E2C46] px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60"
                  >
                    {addingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Detalles</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Categoria</dt>
                  <dd className="font-medium text-gray-800">{ticket.category}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Enviado por</dt>
                  <dd className="font-medium text-gray-800">{ticket.submitted_by}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Creado</dt>
                  <dd className="text-gray-700">{formatDateTime(ticket.created_at)}</dd>
                </div>
                {ticket.ghl_contact_id && (
                  <div>
                    <dt className="text-xs text-gray-500">GHL Contact ID</dt>
                    <dd className="break-all font-mono text-xs text-gray-700">{ticket.ghl_contact_id}</dd>
                  </div>
                )}
                {ticket.ghl_location_id && (
                  <div>
                    <dt className="text-xs text-gray-500">GHL Location ID</dt>
                    <dd className="break-all font-mono text-xs text-gray-700">{ticket.ghl_location_id}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Estado</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => void patchTicket({ status: e.target.value as TicketStatus })}
                    disabled={saving}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Prioridad</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => void patchTicket({ priority: e.target.value as TicketPriority })}
                    disabled={saving}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60"
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Asignado a</label>
                  <input
                    type="text"
                    defaultValue={ticket.assignee ?? ""}
                    onBlur={(e) => {
                      const val = e.target.value.trim() || null;
                      if (val !== ticket.assignee) void patchTicket({ assignee: val });
                    }}
                    disabled={saving}
                    placeholder="email del staff"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

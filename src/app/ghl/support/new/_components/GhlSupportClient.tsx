"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertCircle,
  Plus,
  TicketCheck,
  Loader2,
  ChevronLeft,
  Paperclip,
  Send,
  X,
  ImageIcon,
} from "lucide-react";
import type {
  SupportTicket,
  TicketNote,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/lib/support/types";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// TicketForm
// ---------------------------------------------------------------------------

interface TicketFormProps {
  locationId: string;
  submittedBy?: string;
  onSuccess: (ticket: SupportTicket) => void;
  onCancel: () => void;
}

function TicketForm({ locationId, submittedBy, onSuccess, onCancel }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let attachmentUrl: string | null = null;

      if (attachment) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", attachment);
        const upRes = await fetch("/api/support/upload", { method: "POST", body: formData });
        setUploading(false);
        if (!upRes.ok) {
          const d = (await upRes.json()) as { error?: string };
          throw new Error(d.error ?? "Error al subir imagen");
        }
        const upData = (await upRes.json()) as { url: string };
        attachmentUrl = upData.url;
      }

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ghl_location_id: locationId,
          submitted_by: submittedBy ?? "client",
          title,
          description,
          category,
          priority,
          source: "internal_ghl",
          attachments: attachmentUrl ? [attachmentUrl] : [],
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string; issues?: { message: string }[] };
        const detail = data.issues?.map((i) => i.message).join(", ");
        throw new Error(detail ?? data.error ?? "Error al crear ticket");
      }
      const ticket = (await res.json()) as SupportTicket;
      onSuccess(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear ticket");
    } finally {
      setSubmitting(false);
      setUploading(false);
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

      {/* Attachment */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Captura o imagen (opcional)</label>
        {attachment ? (
          <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            <button type="button" onClick={() => setAttachment(null)} className="shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Adjuntar imagen
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { setAttachment(e.target.files?.[0] ?? null); e.target.value = ""; }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex items-center gap-1.5 rounded bg-[#F67A0A] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {uploading ? "Subiendo..." : "Enviar ticket"}
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
// TicketDetail
// ---------------------------------------------------------------------------

interface TicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
}

function TicketDetail({ ticket, onBack }: TicketDetailProps) {
  const [notes, setNotes] = useState<TicketNote[]>(
    (ticket.notes ?? []).filter((n) => n.is_public)
  );
  const [replyBody, setReplyBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when notes change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() && !attachment) return;
    setError(null);
    setSubmitting(true);

    try {
      let attachmentUrl: string | null = null;

      // Upload image if present
      if (attachment) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", attachment);
        formData.append("ticket_id", ticket.id);
        const upRes = await fetch("/api/support/upload", {
          method: "POST",
          body: formData,
        });
        setUploading(false);
        if (!upRes.ok) {
          const d = (await upRes.json()) as { error?: string };
          throw new Error(d.error ?? "Error al subir imagen");
        }
        const upData = (await upRes.json()) as { url: string };
        attachmentUrl = upData.url;
      }

      const body = attachmentUrl
        ? `${replyBody.trim()}\n\n![adjunto](${attachmentUrl})`
        : replyBody.trim();

      const res = await fetch(`/api/support/tickets/${ticket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: "Cliente",
          body,
          is_public: true,
        }),
      });

      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Error al enviar respuesta");
      }

      const newNote = (await res.json()) as TicketNote;
      setNotes((prev) => [...prev, newNote]);
      setReplyBody("");
      setAttachment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar respuesta");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  const publicNotes = notes.filter((n) => n.is_public);
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1E2C46]">
            #{ticket.ticket_number} — {ticket.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(ticket.status)}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityBadgeClass(ticket.priority)}`}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Original description */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Vos</span>
            <span className="text-[10px] text-gray-400">{formatDate(ticket.created_at)}</span>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          {ticket.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {ticket.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ImageIcon className="h-3 w-3" />
                  Adjunto {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {publicNotes.map((note) => {
          const isClient = note.author === "Cliente";
          return (
            <div
              key={note.id}
              className={`rounded-lg border p-3 ${
                isClient
                  ? "border-orange-200 bg-orange-50 ml-6"
                  : "border-blue-200 bg-blue-50 mr-6"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {isClient ? "Vos" : "PatronPro"}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(note.created_at)}</span>
              </div>
              <NoteBody body={note.body} />
            </div>
          );
        })}

        {publicNotes.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            Aún no hay respuestas. Te contestamos pronto.
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      {!isResolved ? (
        <div className="border-t border-gray-100 px-4 py-3">
          {error && (
            <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          {attachment && (
            <div className="mb-2 flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleReply} className="flex items-end gap-2">
            <textarea
              rows={2}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Escribí tu respuesta..."
              className="flex-1 resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                title="Adjuntar imagen"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={submitting || uploading || (!replyBody.trim() && !attachment)}
                className="rounded bg-[#F67A0A] p-2 text-white hover:bg-orange-600 disabled:opacity-60"
                title="Enviar respuesta"
              >
                {submitting || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setAttachment(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-center text-xs text-gray-400">
            Este ticket está {STATUS_LABELS[ticket.status].toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
}

// Renders note body — handles markdown image syntax
function NoteBody({ body }: { body: string }) {
  const imgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <p key={lastIndex} className="text-xs text-gray-700 whitespace-pre-wrap">
          {body.slice(lastIndex, match.index).trim()}
        </p>
      );
    }
    parts.push(
      <a key={match.index} href={match[1]} target="_blank" rel="noopener noreferrer">
        <img
          src={match[1]}
          alt="adjunto"
          className="mt-1.5 max-h-48 rounded border border-gray-200 object-contain"
        />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push(
      <p key={lastIndex} className="text-xs text-gray-700 whitespace-pre-wrap">
        {body.slice(lastIndex).trim()}
      </p>
    );
  }

  return <>{parts.length > 0 ? parts : <p className="text-xs text-gray-700 whitespace-pre-wrap">{body}</p>}</>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Two-way handshake replaced with URL param approach.
 * GHL passes {{user.id}} in the Custom Menu URL.
 * The server resolves contact_id from user_id via GHL API.
 */

interface Props {
  locationId?: string;
  userId?: string;
}

type View = "list" | "form" | "success" | "detail";

export default function GhlSupportClient({ locationId: propLocationId, userId }: Props) {
  const locationId = propLocationId ?? PATRONPRO_LOCATION_ID;

  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  // Auth on mount
  useEffect(() => {
    async function authenticate() {
      try {
        const res = await fetch("/api/auth/ghl-iframe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: locationId,
            user_id: userId,
          }),
        });
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          throw new Error(d.error ?? "Auth failed");
        }
        const data = (await res.json()) as { userName?: string };
        if (data.userName) setUserName(data.userName);
        setAuthed(true);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Error de autenticación");
        setLoading(false);
      }
    }

    void authenticate();
  }, [locationId, userId]);

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

  async function openDetail(ticketId: string) {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error("No se pudo cargar el ticket");
      const data = (await res.json()) as SupportTicket;
      setSelectedTicket(data);
    } catch {
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  }

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
            onClick={() => {
              setView("list");
              setCreatedTicket(null);
            }}
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
          submittedBy={userName}
          onSuccess={(t) => {
            setCreatedTicket(t);
            setView("success");
            void loadTickets();
          }}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  // --- Detail ---
  if (view === "detail") {
    if (detailLoading || !selectedTicket) {
      return (
        <div className="flex min-h-40 items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }
    return (
      <div className="flex h-full flex-col">
        <TicketDetail
          ticket={selectedTicket}
          onBack={() => {
            setView("list");
            setSelectedTicket(null);
          }}
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
            {open.map((t) => (
              <TicketRow key={t.id} ticket={t} onClick={() => void openDetail(t.id)} />
            ))}
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
            {closed.map((t) => (
              <TicketRow key={t.id} ticket={t} onClick={() => void openDetail(t.id)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket: t, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <li
      className="cursor-pointer rounded border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            #{t.ticket_number} — {t.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{formatDate(t.created_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(t.status)}`}
          >
            {STATUS_LABELS[t.status]}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityBadgeClass(t.priority)}`}
          >
            {PRIORITY_LABELS[t.priority]}
          </span>
        </div>
      </div>
    </li>
  );
}

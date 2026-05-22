"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, ExternalLink, Send, Paperclip, X } from "lucide-react";
import Link from "next/link";
import type { SupportTicket, TicketNote, TicketStatus, TicketPriority } from "@/lib/support/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffUser { id: string; email: string; name: string }

export interface Props {
  ticket: SupportTicket;
  locationName: string;
  contactName: string | null;
  contactEmail: string | null;
  ghlDashboardUrl: string;
  currentUserEmail: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string; active: string }[] = [
  { value: "new",              label: "Nuevo",           color: "bg-gray-100 text-gray-700 border-gray-300",         active: "bg-gray-700 text-white border-gray-700" },
  { value: "triage",           label: "Triage",          color: "bg-yellow-50 text-yellow-700 border-yellow-300",    active: "bg-yellow-500 text-white border-yellow-500" },
  { value: "assigned",         label: "Asignado",        color: "bg-blue-50 text-blue-700 border-blue-300",          active: "bg-blue-600 text-white border-blue-600" },
  { value: "waiting_client",   label: "Esp. cliente",    color: "bg-orange-50 text-orange-700 border-orange-300",    active: "bg-orange-500 text-white border-orange-500" },
  { value: "waiting_internal", label: "Esp. interno",    color: "bg-orange-50 text-orange-700 border-orange-300",    active: "bg-orange-500 text-white border-orange-500" },
  { value: "waiting_tech",     label: "Esp. tech",       color: "bg-purple-50 text-purple-700 border-purple-300",    active: "bg-purple-600 text-white border-purple-600" },
  { value: "resolved",         label: "Resuelto",        color: "bg-green-50 text-green-700 border-green-300",       active: "bg-green-600 text-white border-green-600" },
  { value: "closed",           label: "Cerrado",         color: "bg-slate-100 text-slate-600 border-slate-300",      active: "bg-slate-600 text-white border-slate-600" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string; active: string }[] = [
  { value: "low",    label: "Baja",    color: "bg-gray-100 text-gray-600 border-gray-300",       active: "bg-gray-600 text-white border-gray-600" },
  { value: "normal", label: "Normal",  color: "bg-blue-50 text-blue-700 border-blue-300",        active: "bg-blue-600 text-white border-blue-600" },
  { value: "high",   label: "Alta",    color: "bg-orange-50 text-orange-700 border-orange-300",  active: "bg-orange-500 text-white border-orange-500" },
  { value: "urgent", label: "Urgente", color: "bg-red-50 text-red-700 border-red-300",           active: "bg-red-600 text-white border-red-600" },
];

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PanelTicketDetail({ ticket: initial, locationName, contactName, contactEmail, ghlDashboardUrl, currentUserEmail }: Props) {
  const [ticket, setTicket]     = useState(initial);
  const [notes, setNotes]       = useState<TicketNote[]>(initial.notes ?? []);
  const [saving, setSaving]     = useState(false);
  const [users, setUsers]       = useState<StaffUser[]>([]);

  // Reply form
  const [replyBody, setReplyBody]       = useState("");
  const [replyPublic, setReplyPublic]   = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError]     = useState<string | null>(null);
  const [attachments, setAttachments]   = useState<string[]>([]);
  const [uploading, setUploading]       = useState(false);

  // Load staff users
  useEffect(() => {
    fetch("/api/panel/users")
      .then((r) => r.json() as Promise<{ users: StaffUser[] }>)
      .then((d) => setUsers(d.users ?? []))
      .catch(() => null);
  }, []);

  async function patchTicket(patch: Partial<{ status: TicketStatus; priority: TicketPriority; assignee: string | null }>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) setTicket((await res.json()) as SupportTicket);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ticket_id", ticket.id);
      const res = await fetch("/api/support/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Error al subir imagen");
      }
      const { url } = (await res.json()) as { url: string };
      setAttachments((prev) => [...prev, url]);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setReplyError(null);
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: currentUserEmail,
          body: replyBody + (attachments.length ? `\n\n${attachments.join("\n")}` : ""),
          is_public: replyPublic,
          attachments,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Error al enviar respuesta");
      }
      const note = (await res.json()) as TicketNote;
      setNotes((prev) => [...prev, note]);
      setReplyBody("");
      setAttachments([]);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Error");
    } finally {
      setSendingReply(false);
    }
  }

  const currentStatus   = STATUS_OPTIONS.find((o) => o.value === ticket.status);
  const currentPriority = PRIORITY_OPTIONS.find((o) => o.value === ticket.priority);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1250px] mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2">
          <Link href="/panel/support" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Tickets
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">#{ticket.ticket_number} — {ticket.title}</span>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 ml-1" />}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* ── Main ── */}
          <div className="col-span-2 space-y-5">

            {/* Description */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-gray-900">{ticket.title}</h2>
              <p className="mb-3 text-xs text-gray-400">{formatDateTime(ticket.created_at)}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
              {ticket.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticket.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Adjunto ${i + 1}`} className="h-20 w-20 rounded border object-cover hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Thread */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Conversación ({notes.length})</h2>

              {notes.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">Sin respuestas aún.</p>
              )}

              <ul className="space-y-4">
                {notes.map((note) => (
                  <li key={note.id} className={`flex gap-3 ${note.is_public ? "" : "opacity-70"}`}>
                    <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#1E2C46] text-center text-xs font-bold leading-7 text-white">
                      {note.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${note.is_public ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {note.is_public ? "Enviado al cliente" : "Nota interna"}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{note.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Reply form */}
              <form onSubmit={submitReply} className="mt-5 border-t border-gray-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-600">Responder</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyPublic(true)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${replyPublic ? "bg-[#1E2C46] text-white border-[#1E2C46]" : "text-gray-500 border-gray-300 hover:border-gray-400"}`}
                    >
                      Enviar al cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyPublic(false)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${!replyPublic ? "bg-slate-600 text-white border-slate-600" : "text-gray-500 border-gray-300 hover:border-gray-400"}`}
                    >
                      Nota interna
                    </button>
                  </div>
                </div>

                {replyError && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{replyError}</p>}

                <textarea
                  required
                  rows={3}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={replyPublic ? "Escribe tu respuesta al cliente..." : "Nota interna (no visible al cliente)..."}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1E2C46] focus:outline-none"
                />

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((url, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-16 w-16 rounded border object-cover" />
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                    Adjuntar imagen
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#F67A0A] px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {replyPublic ? "Enviar respuesta" : "Guardar nota"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Client info */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Cuenta</dt>
                  <dd className="font-medium text-gray-800">{locationName}</dd>
                </div>
                {contactName && (
                  <div>
                    <dt className="text-xs text-gray-400">Contacto</dt>
                    <dd className="font-medium text-gray-800">{contactName}</dd>
                  </div>
                )}
                {contactEmail && (
                  <div>
                    <dt className="text-xs text-gray-400">Email</dt>
                    <dd className="text-gray-700 text-xs break-all">{contactEmail}</dd>
                  </div>
                )}
                <div className="pt-1">
                  <a
                    href={ghlDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#F67A0A] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver en GHL
                  </a>
                </div>
              </dl>
            </div>

            {/* Status chips */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</h2>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    disabled={saving}
                    onClick={() => void patchTicket({ status: o.value })}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${ticket.status === o.value ? o.active : o.color} hover:opacity-80`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority chips */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Prioridad</h2>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    disabled={saving}
                    onClick={() => void patchTicket({ priority: o.value })}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${ticket.priority === o.value ? o.active : o.color} hover:opacity-80`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Asignado a</h2>
              <select
                value={ticket.assignee ?? ""}
                onChange={(e) => void patchTicket({ assignee: e.target.value || null })}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1E2C46] focus:outline-none disabled:opacity-60"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>{u.name || u.email}</option>
                ))}
              </select>
            </div>

            {/* Meta */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Detalles</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-400">Categoría</dt>
                  <dd className="text-sm font-medium text-gray-800">{ticket.category}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Creado</dt>
                  <dd className="text-xs text-gray-600">{formatDateTime(ticket.created_at)}</dd>
                </div>
                {ticket.resolved_at && (
                  <div>
                    <dt className="text-xs text-gray-400">Resuelto</dt>
                    <dd className="text-xs text-gray-600">{formatDateTime(ticket.resolved_at)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400">Estado actual</dt>
                  <dd>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${currentStatus?.active ?? ""}`}>
                      {currentStatus?.label ?? ticket.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Prioridad actual</dt>
                  <dd>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${currentPriority?.active ?? ""}`}>
                      {currentPriority?.label ?? ticket.priority}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

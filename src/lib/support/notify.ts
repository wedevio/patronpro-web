/**
 * Ticket notifications via GHL Conversations.
 *
 * Uses creator_email stored on the ticket — no GHL contact lookup needed.
 */

import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifyNoteParams {
  ghlLocationId: string;
  ghlContactId:  string;
  creatorEmail:  string;
  ticketNumber:  number;
  ticketTitle:   string;
  noteBody:      string;
}

interface NotifyStatusParams {
  ghlLocationId: string;
  ghlContactId:  string;
  creatorEmail:  string;
  ticketNumber:  number;
  ticketTitle:   string;
  newStatus:     string;
}

// ─── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  resolved:         "resuelto",
  closed:           "cerrado",
  assigned:         "asignado a un agente",
  waiting_client:   "en espera de tu respuesta",
  waiting_internal: "en revisión interna",
  waiting_tech:     "en revisión técnica",
  triage:           "en triage",
  new:              "recibido",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sendEmail(
  contactId: string,
  token:     string,
  params:    { subject: string; html: string; emailTo: string },
): Promise<void> {
  const body = {
    type:      "Email",
    contactId,
    subject:   params.subject,
    html:      params.html,
    emailTo:   params.emailTo,
  };
  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[notify] GHL Email failed for contact ${contactId} (${res.status}):`, text);
  } else {
    console.log(`[notify] GHL Email sent OK for contact ${contactId}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify client when staff posts a public note on their ticket.
 */
export async function notifyClientNote({
  ghlLocationId,
  ghlContactId,
  creatorEmail,
  ticketNumber,
  ticketTitle,
  noteBody,
}: NotifyNoteParams): Promise<void> {
  try {
    const token     = await getLocationAccessToken(ghlLocationId);
    const truncated = noteBody.length > 300 ? noteBody.slice(0, 297) + "..." : noteBody;

    await sendEmail(ghlContactId, token, {
      subject: `PatronPro Support — Ticket #${ticketNumber} respondido`,
      emailTo: creatorEmail,
      html: `
        <p>Hola,</p>
        <p>Tu ticket <strong>#${ticketNumber} — ${ticketTitle}</strong> tiene una nueva respuesta de nuestro equipo:</p>
        <blockquote style="border-left:4px solid #F67D0A;padding:8px 16px;margin:16px 0;color:#374151;">
          ${truncated.replace(/\n/g, "<br>")}
        </blockquote>
        <p>Si tenés preguntas, respondé este email o contactanos directamente.</p>
        <p style="color:#6b7280;font-size:13px;">— El equipo de PatronPro</p>
      `.trim(),
    });
  } catch (err) {
    console.error("[notify] notifyClientNote failed:", err);
  }
}

/**
 * Notify client when their ticket status changes (resolved, closed, etc.).
 */
export async function notifyClientStatus({
  ghlLocationId,
  ghlContactId,
  creatorEmail,
  ticketNumber,
  ticketTitle,
  newStatus,
}: NotifyStatusParams): Promise<void> {
  try {
    const token       = await getLocationAccessToken(ghlLocationId);
    const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;

    await sendEmail(ghlContactId, token, {
      subject: `PatronPro Support — Ticket #${ticketNumber} ${statusLabel}`,
      emailTo: creatorEmail,
      html: `
        <p>Hola,</p>
        <p>Te informamos que tu ticket <strong>#${ticketNumber} — ${ticketTitle}</strong> ha sido marcado como <strong>${statusLabel}</strong>.</p>
        <p>Si necesitás algo más, abrí un nuevo ticket o contactanos directamente.</p>
        <p style="color:#6b7280;font-size:13px;">— El equipo de PatronPro</p>
      `.trim(),
    });
  } catch (err) {
    console.error("[notify] notifyClientStatus failed:", err);
  }
}

/**
 * Ticket notifications via GHL Conversations.
 *
 * Sends from the CLIENT's own sub-account — the contact already exists there
 * (ghl_contact_id belongs to ghl_location_id), so no upsert needed.
 */

import { getLocationAccessToken } from "@/lib/ghl/oauth";
import { ghlFetch } from "@/lib/ghl/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHLContactResponse {
  contact?: {
    firstName?: string;
    lastName?:  string;
    email?:     string;
    phone?:     string;
  };
}
interface NotifyNoteParams {
  ghlLocationId: string;
  ghlContactId:  string;
  ticketNumber:  number;
  ticketTitle:   string;
  noteBody:      string;
}

interface NotifyStatusParams {
  ghlLocationId: string;
  ghlContactId:  string;
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

async function getContact(
  locationId: string,
  contactId:  string,
  token:      string,
): Promise<{ firstName: string; phone: string; email: string }> {
  try {
    const res = await ghlFetch(`/contacts/${contactId}`, { method: "GET", token });
    if (!res.ok) {
      console.error(`[notify] getContact failed (${res.status}) for ${contactId}`);
      return { firstName: "", phone: "", email: "" };
    }
    const json = (await res.json()) as GHLContactResponse;
    return {
      firstName: json.contact?.firstName ?? "",
      phone:     json.contact?.phone     ?? "",
      email:     json.contact?.email     ?? "",
    };
  } catch {
    return { firstName: "", phone: "", email: "" };
  }
}

async function sendMessage(
  locationId: string,
  contactId:  string,
  token:      string,
  type:       "Email" | "SMS",
  params:     { subject?: string; html?: string; message?: string; emailTo?: string },
): Promise<void> {
  const body: Record<string, string> = { type, contactId };
  if (type === "Email") {
    body.subject = params.subject ?? "";
    body.html    = params.html    ?? "";
    if (params.emailTo) body.emailTo = params.emailTo;
  } else {
    body.message = params.message ?? "";
  }
  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const responseText = await res.text();
    console.error(`[notify] GHL ${type} failed for contact ${contactId} (${res.status}):`, responseText);
  } else {
    console.log(`[notify] GHL ${type} sent OK for contact ${contactId}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify client when staff posts a public note on their ticket.
 * Sends email + SMS (if phone available) from the client's own sub-account.
 */
export async function notifyClientNote({
  ghlLocationId,
  ghlContactId,
  ticketNumber,
  ticketTitle,
  noteBody,
}: NotifyNoteParams): Promise<void> {
  try {
    const token   = await getLocationAccessToken(ghlLocationId);
    const contact = await getContact(ghlLocationId, ghlContactId, token);
    const name    = contact.firstName || "cliente";
    const truncated = noteBody.length > 300 ? noteBody.slice(0, 297) + "..." : noteBody;

    if (!contact.email) {
      console.warn(`[notify] No email for contact ${ghlContactId} — skipping email`);
    } else {
      await sendMessage(ghlLocationId, ghlContactId, token, "Email", {
        subject:  `PatronPro Support — Ticket #${ticketNumber} respondido`,
        emailTo:  contact.email,
        html: `
          <p>Hola ${name},</p>
          <p>Tu ticket <strong>#${ticketNumber} — ${ticketTitle}</strong> tiene una nueva respuesta de nuestro equipo:</p>
          <blockquote style="border-left:4px solid #F67D0A;padding:8px 16px;margin:16px 0;color:#374151;">
            ${truncated.replace(/\n/g, "<br>")}
          </blockquote>
          <p>Si tenés preguntas, respondé este email o contactanos directamente.</p>
          <p style="color:#6b7280;font-size:13px;">— El equipo de PatronPro</p>
        `.trim(),
      });
    }

    // SMS (only if phone available)
    if (contact.phone) {
      const smsText = `PatronPro | Ticket #${ticketNumber}: ${truncated.slice(0, 140)}`;
      await sendMessage(ghlLocationId, ghlContactId, token, "SMS", { message: smsText });
    }
  } catch (err) {
    console.error("[notify] notifyClientNote failed:", err);
  }
}

/**
 * Notify client when their ticket status changes (resolved, closed, etc.).
 * Sends email + SMS (if phone available) from the client's own sub-account.
 */
export async function notifyClientStatus({
  ghlLocationId,
  ghlContactId,
  ticketNumber,
  ticketTitle,
  newStatus,
}: NotifyStatusParams): Promise<void> {
  try {
    const token      = await getLocationAccessToken(ghlLocationId);
    const contact    = await getContact(ghlLocationId, ghlContactId, token);
    const name       = contact.firstName || "cliente";
    const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;

    if (!contact.email) {
      console.warn(`[notify] No email for contact ${ghlContactId} — skipping status email`);
    } else {
      await sendMessage(ghlLocationId, ghlContactId, token, "Email", {
        subject: `PatronPro Support — Ticket #${ticketNumber} ${statusLabel}`,
        emailTo: contact.email,
        html: `
          <p>Hola ${name},</p>
          <p>Te informamos que tu ticket <strong>#${ticketNumber} — ${ticketTitle}</strong> ha sido marcado como <strong>${statusLabel}</strong>.</p>
          <p>Si necesitás algo más, abrí un nuevo ticket o contactanos directamente.</p>
          <p style="color:#6b7280;font-size:13px;">— El equipo de PatronPro</p>
        `.trim(),
      });
    }

    // SMS
    if (contact.phone) {
      await sendMessage(ghlLocationId, ghlContactId, token, "SMS", {
        message: `PatronPro | Tu ticket #${ticketNumber} ha sido ${statusLabel}.`,
      });
    }
  } catch (err) {
    console.error("[notify] notifyClientStatus failed:", err);
  }
}

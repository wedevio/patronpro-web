"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  buildOnboardingInvitePreview,
  OnboardingInvitePreviewError,
  updateAuditPersistence,
  type OnboardingInviteAuditPayload,
  type OnboardingInviteFieldErrors,
  type OnboardingInviteFormState,
  type OnboardingInvitePreviewResult,
} from "@/lib/onboarding/invite-preview";

interface OnboardingInvitePanelProps {
  defaultForm: OnboardingInviteFormState;
}

type PersistedStatus = OnboardingInviteAuditPayload["status"]["persisted"];

const TIMEZONES = ["America/Mexico_City", "America/Los_Angeles", "America/Chicago", "America/New_York"];

const FIELD_LABELS: Record<keyof OnboardingInviteFormState, string> = {
  clientName: "Client",
  businessName: "Business",
  clientEmail: "Client email",
  meetingTitle: "Meeting title",
  start: "Start",
  end: "End",
  timeZone: "Timezone",
  description: "Description",
  location: "Location",
  joinUrl: "Join URL",
  organizerName: "Organizer",
  organizerEmail: "Reply-to",
};

export default function OnboardingInvitePanel({ defaultForm }: OnboardingInvitePanelProps) {
  const [form, setForm] = useState<OnboardingInviteFormState>(defaultForm);
  const [preview, setPreview] = useState<OnboardingInvitePreviewResult>(() =>
    buildOnboardingInvitePreview(defaultForm, { createdAt: "2026-06-12T18:00:00Z" })
  );
  const [errors, setErrors] = useState<OnboardingInviteFieldErrors>({});
  const [hasGenerated, setHasGenerated] = useState(false);
  const [persisted, setPersisted] = useState<PersistedStatus>("not-recorded");
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState<"body" | "ics" | null>(null);
  const [apiMessage, setApiMessage] = useState("");

  const displayPayload = useMemo(
    () => (persisted === "not-recorded" ? preview.auditPayload : updateAuditPersistence(preview.auditPayload, persisted)),
    [persisted, preview.auditPayload]
  );

  function updateField(field: keyof OnboardingInviteFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, _form: undefined }));
    setApiMessage("");
  }

  function generatePreview() {
    try {
      const next = buildOnboardingInvitePreview(form);
      setPreview(next);
      setErrors({});
      setHasGenerated(true);
      setPersisted("not-recorded");
      setApiMessage("");
    } catch (err) {
      if (err instanceof OnboardingInvitePreviewError) {
        setErrors(err.fieldErrors);
        return;
      }
      setErrors({ _form: err instanceof Error ? err.message : "Unable to generate invite preview" });
    }
  }

  async function recordDryRun() {
    let payload = displayPayload;
    if (!hasGenerated) {
      try {
        const next = buildOnboardingInvitePreview(form);
        setPreview(next);
        setHasGenerated(true);
        payload = next.auditPayload;
      } catch (err) {
        if (err instanceof OnboardingInvitePreviewError) setErrors(err.fieldErrors);
        else setErrors({ _form: err instanceof Error ? err.message : "Unable to generate invite preview" });
        return;
      }
    }

    setRecording(true);
    setApiMessage("");
    try {
      const response = await fetch("/api/panel/onboarding-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        persisted?: PersistedStatus;
        error?: string;
      };
      if (!response.ok || !json.ok || !json.persisted || json.persisted === "not-recorded") {
        setApiMessage(json.error ?? "Dry-run record was rejected");
        return;
      }
      setPersisted(json.persisted);
      setApiMessage(json.persisted === "dry-run-no-database" ? "Dry-run recorded locally; database not configured." : "Dry-run accepted; Postgres adapter deferred.");
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Dry-run record failed");
    } finally {
      setRecording(false);
    }
  }

  async function copyText(kind: "body" | "ics", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function downloadIcs() {
    const blob = new Blob([preview.calendar.icsText], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = preview.calendar.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Onboarding automation</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Meeting invite panel</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
          <ShieldCheck size={15} />
          Dry-run only
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <section className="grid gap-5">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarPlus size={17} className="text-orange-500" />
              <h2 className="text-[15px] font-bold text-slate-900">Meeting details</h2>
            </div>

            {errors._form && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{errors._form}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <Field field="clientName" value={form.clientName} error={errors.clientName} onChange={updateField} />
              <Field field="businessName" value={form.businessName} error={errors.businessName} onChange={updateField} />
              <Field field="clientEmail" type="email" value={form.clientEmail} error={errors.clientEmail} onChange={updateField} />
              <Field field="organizerEmail" type="email" value={form.organizerEmail} error={errors.organizerEmail} onChange={updateField} />
              <Field field="meetingTitle" value={form.meetingTitle} error={errors.meetingTitle} onChange={updateField} />
              <Field field="organizerName" value={form.organizerName} error={errors.organizerName} onChange={updateField} />
              <Field field="start" value={form.start} error={errors.start} onChange={updateField} />
              <Field field="end" value={form.end} error={errors.end} onChange={updateField} />
              <label className="grid gap-1.5">
                <span className="text-[12px] font-semibold text-slate-600">{FIELD_LABELS.timeZone}</span>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-orange-400"
                  value={form.timeZone}
                  onChange={(event) => updateField("timeZone", event.target.value)}
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                {errors.timeZone && <span className="text-[11px] text-red-600">{errors.timeZone}</span>}
              </label>
              <Field field="location" value={form.location} error={errors.location} onChange={updateField} />
              <div className="md:col-span-2">
                <Field field="joinUrl" value={form.joinUrl} error={errors.joinUrl} onChange={updateField} />
              </div>
              <label className="grid gap-1.5 md:col-span-2">
                <span className="text-[12px] font-semibold text-slate-600">{FIELD_LABELS.description}</span>
                <textarea
                  className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-orange-400"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
                {errors.description && <span className="text-[11px] text-red-600">{errors.description}</span>}
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generatePreview}
                className="inline-flex min-w-0 items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-[13px] font-bold text-white hover:bg-orange-600"
              >
                <RefreshCw size={15} />
                Generate preview
              </button>
              <button
                type="button"
                onClick={() => void recordDryRun()}
                disabled={recording}
                className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Database size={15} />
                {recording ? "Recording..." : "Record dry-run"}
              </button>
              {apiMessage && <span className="self-center text-[12px] text-slate-500">{apiMessage}</span>}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <section className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Mail size={17} className="text-orange-500" />
                  <h2 className="text-[15px] font-bold text-slate-900">Email preview</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText("body", preview.bodyText)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {copied === "body" ? <Check size={14} /> : <Copy size={14} />}
                  Copy
                </button>
              </div>
              <p className="text-[13px] font-bold text-slate-800">{preview.subject}</p>
              <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-[12px] leading-5 text-slate-700">
                {preview.bodyText}
              </pre>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={17} className="text-orange-500" />
                <h2 className="text-[15px] font-bold text-slate-900">Calendar actions</h2>
              </div>
              <div className="grid gap-2">
                <ProviderLink label="Google" href={preview.calendar.links.google} />
                <ProviderLink label="Outlook.com" href={preview.calendar.links.outlook} />
                <ProviderLink label="Microsoft 365" href={preview.calendar.links.office365} />
                <ProviderLink label="Apple/iOS ICS" href={preview.calendar.links.apple} download={preview.calendar.fileName} />
                <ProviderLink label="Zoho/iCal fallback" href={preview.calendar.links.zoho} download={preview.calendar.fileName} />
                <ProviderLink label="Raw ICS" href={preview.calendar.links.ics} download={preview.calendar.fileName} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadIcs}
                  className="inline-flex min-w-0 items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-[13px] font-bold text-white hover:bg-slate-800"
                >
                  <Download size={15} />
                  Download .ics
                </button>
                <button
                  type="button"
                  onClick={() => void copyText("ics", preview.calendar.icsText)}
                  className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  {copied === "ics" ? <Check size={15} /> : <Copy size={15} />}
                  Copy ICS
                </button>
              </div>
              <p className="mt-3 break-all text-[11px] text-slate-400">{preview.calendar.fileName}</p>
            </section>
          </div>
        </section>

        <aside className="rounded-md border border-slate-200 bg-white p-4 xl:sticky xl:top-5 xl:self-start">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={17} className="text-orange-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Audit rail</h2>
          </div>
          <div className="grid gap-2">
            <RailItem label="Generated" value={hasGenerated ? "true" : "seeded demo"} ok={hasGenerated} />
            <RailItem label="Previewed" value="true" ok />
            <RailItem label="Persistence" value={displayPayload.status.persisted} ok={displayPayload.status.persisted !== "not-recorded"} />
            <RailItem label="Sent" value="false" ok />
            <RailItem label="GHL mutation" value="false" ok />
          </div>
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Checksum</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{displayPayload.calendar.icsTextSha256}</p>
          </div>
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Audit ID</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{displayPayload.id}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  field,
  value,
  error,
  type = "text",
  onChange,
}: {
  field: keyof OnboardingInviteFormState;
  value: string;
  error?: string;
  type?: string;
  onChange: (field: keyof OnboardingInviteFormState, value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold text-slate-600">{FIELD_LABELS[field]}</span>
      <input
        type={type}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-orange-400"
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
      />
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </label>
  );
}

function ProviderLink({ label, href, download }: { label: string; href: string; download?: string }) {
  return (
    <a
      href={href}
      target={download ? undefined : "_blank"}
      rel={download ? undefined : "noreferrer"}
      download={download}
      className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      <span className="truncate">{label}</span>
      <ExternalLink size={14} className="shrink-0 text-slate-400" />
    </a>
  );
}

function RailItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
      <span className="text-[12px] font-semibold text-slate-500">{label}</span>
      <span className={`inline-flex min-w-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${ok ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

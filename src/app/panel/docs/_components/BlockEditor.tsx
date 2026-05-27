"use client";

import { useState, useRef } from "react";
import type { DocBlock, BlockType, CalloutVariant } from "@/lib/docs/types";
import { X, Upload, Loader2 } from "lucide-react";

interface Props {
  block: DocBlock;
  onSave: (updated: DocBlock) => void;
  onCancel: () => void;
}

const CALLOUT_VARIANTS: CalloutVariant[] = ["info", "warning", "success", "accent", "pending"];
const VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: "Info (azul)",
  warning: "Advertencia (amarillo)",
  success: "Éxito (verde)",
  accent: "Sugerido (naranja)",
  pending: "Pendiente (rojo)",
};

export default function BlockEditor({ block, onSave, onCancel }: Props) {
  const [type] = useState<BlockType>(block.type);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── heading state ──────────────────────────────────────────────────────────
  const headingData = block.type === "heading" ? (block.data as { level: 2 | 3; text: string }) : null;
  const [headingLevel, setHeadingLevel] = useState<2 | 3>(headingData?.level ?? 2);
  const [headingText, setHeadingText] = useState(headingData?.text ?? "");

  // ── text state ─────────────────────────────────────────────────────────────
  const textData = block.type === "text" ? (block.data as { content: string }) : null;
  const [textContent, setTextContent] = useState(textData?.content ?? "");

  // ── image state ────────────────────────────────────────────────────────────
  const imageData = block.type === "image" ? (block.data as { url: string; alt: string; caption?: string }) : null;
  const [imageUrl, setImageUrl] = useState(imageData?.url ?? "");
  const [imageAlt, setImageAlt] = useState(imageData?.alt ?? "");
  const [imageCaption, setImageCaption] = useState(imageData?.caption ?? "");

  // ── video state ────────────────────────────────────────────────────────────
  const videoData = block.type === "video" ? (block.data as { url: string; caption?: string }) : null;
  const [videoUrl, setVideoUrl] = useState(videoData?.url ?? "");
  const [videoCaption, setVideoCaption] = useState(videoData?.caption ?? "");

  // ── callout state ──────────────────────────────────────────────────────────
  const calloutData = block.type === "callout" ? (block.data as { variant: CalloutVariant; title?: string; content: string }) : null;
  const [calloutVariant, setCalloutVariant] = useState<CalloutVariant>(calloutData?.variant ?? "info");
  const [calloutTitle, setCalloutTitle] = useState(calloutData?.title ?? "");
  const [calloutContent, setCalloutContent] = useState(calloutData?.content ?? "");

  // ── file upload ────────────────────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/panel/docs/media", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        alert(json.error ?? "Error al subir archivo");
        return;
      }
      if (type === "image") setImageUrl(json.url);
      if (type === "video") setVideoUrl(json.url);
    } finally {
      setUploading(false);
    }
  }

  function buildUpdated(): DocBlock {
    if (type === "heading") {
      return { ...block, data: { level: headingLevel, text: headingText } };
    }
    if (type === "text") {
      return { ...block, data: { content: textContent } };
    }
    if (type === "image") {
      return { ...block, data: { url: imageUrl, alt: imageAlt, caption: imageCaption || undefined } };
    }
    if (type === "video") {
      return { ...block, data: { url: videoUrl, caption: videoCaption || undefined } };
    }
    // callout
    return { ...block, data: { variant: calloutVariant, title: calloutTitle || undefined, content: calloutContent } };
  }

  const inputCls = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelCls = "block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="border border-orange-300 rounded-lg p-4 bg-orange-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-orange-700 uppercase tracking-wide">
          Editando bloque — {type}
        </span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700">
          <X size={16} />
        </button>
      </div>

      {type === "heading" && (
        <>
          <div>
            <label className={labelCls}>Nivel</label>
            <select value={headingLevel} onChange={(e) => setHeadingLevel(Number(e.target.value) as 2 | 3)} className={inputCls}>
              <option value={2}>H2 — Sección principal</option>
              <option value={3}>H3 — Subsección</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Texto</label>
            <input value={headingText} onChange={(e) => setHeadingText(e.target.value)} className={inputCls} />
          </div>
        </>
      )}

      {type === "text" && (
        <div>
          <label className={labelCls}>Contenido (usa • para viñetas)</label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={8}
            className={inputCls + " resize-y font-mono text-[12px]"}
          />
        </div>
      )}

      {(type === "image" || type === "video") && (
        <>
          <div>
            <label className={labelCls}>Archivo (subir)</label>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded border border-slate-300 bg-white hover:bg-slate-50"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? "Subiendo…" : "Seleccionar archivo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={type === "image" ? "image/*" : "video/*"}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); }}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>URL</label>
            <input
              value={type === "image" ? imageUrl : videoUrl}
              onChange={(e) => type === "image" ? setImageUrl(e.target.value) : setVideoUrl(e.target.value)}
              className={inputCls}
              placeholder="https://…"
            />
          </div>
          {type === "image" && (
            <div>
              <label className={labelCls}>Texto alternativo</label>
              <input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} className={inputCls} />
            </div>
          )}
          <div>
            <label className={labelCls}>Pie de foto (opcional)</label>
            <input
              value={type === "image" ? imageCaption : videoCaption}
              onChange={(e) => type === "image" ? setImageCaption(e.target.value) : setVideoCaption(e.target.value)}
              className={inputCls}
            />
          </div>
        </>
      )}

      {type === "callout" && (
        <>
          <div>
            <label className={labelCls}>Variante</label>
            <select value={calloutVariant} onChange={(e) => setCalloutVariant(e.target.value as CalloutVariant)} className={inputCls}>
              {CALLOUT_VARIANTS.map((v) => (
                <option key={v} value={v}>{VARIANT_LABELS[v]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Título (opcional)</label>
            <input value={calloutTitle} onChange={(e) => setCalloutTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contenido</label>
            <textarea
              value={calloutContent}
              onChange={(e) => setCalloutContent(e.target.value)}
              rows={4}
              className={inputCls + " resize-y"}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(buildUpdated())}
          className="px-4 py-1.5 text-[13px] font-medium rounded text-white"
          style={{ background: "#1E2C46" }}
        >
          Guardar bloque
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 text-[13px] rounded border border-slate-300 bg-white hover:bg-slate-50">
          Cancelar
        </button>
      </div>
    </div>
  );
}

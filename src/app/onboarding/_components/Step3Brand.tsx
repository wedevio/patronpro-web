"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Sparkles, Download, Check, RefreshCw, Loader2 } from "lucide-react";
import type { OnboardingFormData } from "@/lib/onboarding/types";
import ColorPicker from "./ColorPicker";

// ─── Services ────────────────────────────────────────────────────────────────

const PRESET_SERVICES = [
  { id: "roofing",       label: "Roofing / Techos" },
  { id: "gutters",       label: "Gutters / Canaletas" },
  { id: "siding",        label: "Siding / Revestimiento" },
  { id: "windows_doors", label: "Windows & Doors" },
  { id: "painting",      label: "Painting / Pintura" },
  { id: "waterproofing", label: "Waterproofing" },
  { id: "insulation",    label: "Insulation / Aislamiento" },
  { id: "solar",         label: "Solar Panels" },
  { id: "hvac",          label: "HVAC / Climatización" },
  { id: "flooring",      label: "Flooring / Pisos" },
  { id: "remodeling",    label: "Remodeling / Remodelación" },
  { id: "landscaping",   label: "Landscaping / Jardinería" },
  { id: "concrete",      label: "Concrete / Concreto" },
  { id: "fencing",       label: "Fencing / Cercas" },
  { id: "plumbing",      label: "Plumbing / Plomería" },
  { id: "electrical",    label: "Electrical / Eléctrico" },
  { id: "cleaning",      label: "Cleaning / Limpieza" },
  { id: "pest_control",  label: "Pest Control" },
];

// ─── Logo AI styles ───────────────────────────────────────────────────────────

const LOGO_STYLES = [
  { id: "moderno",     label: "Moderno" },
  { id: "clasico",     label: "Clásico" },
  { id: "bold",        label: "Bold" },
  { id: "minimalista", label: "Minimalista" },
] as const;

type LogoStyle = typeof LOGO_STYLES[number]["id"];

interface GeneratedLogo {
  horizontal: string; // base64
  square: string;     // base64
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step3Fields = Pick<
  OnboardingFormData,
  | "logoFile" | "logoSquareFile" | "logoUrl" | "logoSquareUrl"
  | "primaryColor" | "secondaryColor" | "complementaryColor" | "letUsChooseColors"
  | "websiteServices" | "websiteTagline"
  | "businessName"
>;

interface Step3Props {
  data: Partial<Step3Fields>;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Step3Brand({ data, errors, onChange }: Step3Props) {
  // Logo upload state
  const [noLogo, setNoLogo]     = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Logo AI state
  const [logoStyle, setLogoStyle]         = useState<LogoStyle>("moderno");
  const [attempts, setAttempts]           = useState<GeneratedLogo[]>([]);
  const [selectedIdx, setSelectedIdx]     = useState<number | null>(null);
  const [generating, setGenerating]       = useState(false);
  const [genError, setGenError]           = useState<string | null>(null);

  // Services custom input
  const [customInput, setCustomInput]     = useState("");
  const [customServices, setCustomServices] = useState<{ id: string; label: string }[]>([]);

  const selected: string[] = data.websiteServices ?? [];
  const allServices = [...PRESET_SERVICES, ...customServices];
  const attemptsLeft = 3 - attempts.length;

  useEffect(() => {
    if (data.logoSquareFile instanceof File || data.logoSquareUrl) {
      setNoLogo(true);
    }
  }, [data.logoSquareFile, data.logoSquareUrl]);

  useEffect(() => {
    if (data.logoFile instanceof File) {
      const objectUrl = URL.createObjectURL(data.logoFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (typeof data.logoUrl === "string" && data.logoUrl.trim()) {
      setPreview(data.logoUrl);
      return;
    }

    setPreview(null);
  }, [data.logoFile, data.logoUrl]);

  // ── Logo upload handlers ──────────────────────────────────────────────────

  function handleFile(file: File) {
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth  || 800;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngFile = new File([blob], file.name.replace(/\.svg$/i, ".png"), { type: "image/png" });
          onChange("logoFile", pngFile);
          setPreview(URL.createObjectURL(pngFile));
        }, "image/png");
        URL.revokeObjectURL(url);
      };
      img.src = url;
      return;
    }
    onChange("logoFile", file);
    setPreview(URL.createObjectURL(file));
  }

  // ── Logo AI handlers ──────────────────────────────────────────────────────

  async function generateLogo() {
    if (attemptsLeft <= 0 || generating) return;
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/logo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName:  data.businessName ?? "",
          services:      data.websiteServices ?? [],
          style:         logoStyle,
          primaryColor:  data.primaryColor  ?? "#1E2C46",
          secondaryColor: data.secondaryColor ?? "#F67D0A",
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Error generando el logo");
      }

      const json = (await res.json()) as GeneratedLogo;
      const newAttempts = [...attempts, json];
      setAttempts(newAttempts);

      // Auto-select the latest
      const idx = newAttempts.length - 1;
      setSelectedIdx(idx);
      applyLogo(json, idx);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  function applyLogo(logo: GeneratedLogo, idx: number) {
    setSelectedIdx(idx);
    const hFile = b64ToFile(logo.horizontal, "logo.png",        "image/png");
    const sFile = b64ToFile(logo.square,     "logo-square.png", "image/png");
    onChange("logoFile",       hFile);
    onChange("logoSquareFile", sFile);
    setPreview(`data:image/png;base64,${logo.horizontal}`);
  }

  function downloadLogo(logo: GeneratedLogo, idx: number) {
    const a = document.createElement("a");
    a.href     = `data:image/png;base64,${logo.horizontal}`;
    a.download = `logo-${(data.businessName ?? "logo").toLowerCase().replace(/\s+/g, "-")}-${idx + 1}.png`;
    a.click();
  }

  // ── Services handlers ─────────────────────────────────────────────────────

  function toggleService(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange("websiteServices", next);
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}`;
    setCustomServices((prev) => [...prev, { id, label: trimmed }]);
    onChange("websiteServices", [...selected, id]);
    setCustomInput("");
  }

  function removeCustom(id: string) {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
    onChange("websiteServices", selected.filter((s) => s !== id));
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Identidad de marca
      </h2>

      {/* ── SERVICES ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-semibold" style={{ color: "#1E2C46" }}>
            ¿Qué servicios ofrece tu empresa?
          </label>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
            Seleccioná todos los que apliquen — los usaremos para tu logo y tu web.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {allServices.map((svc) => {
            const isSelected = selected.includes(svc.id);
            const isCustom   = svc.id.startsWith("custom_");
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all"
                style={{
                  backgroundColor: isSelected ? "#1E2C46" : "#fff",
                  color:           isSelected ? "#fff"    : "#1E2C46",
                  borderColor:     isSelected ? "#1E2C46" : "#e5e7eb",
                }}
              >
                {svc.label}
                {isCustom && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); removeCustom(svc.id); }}
                    className="ml-0.5 opacity-70 hover:opacity-100"
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Otro servicio..."
            className="flex-1 rounded-[10px] border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F67D0A]/30 focus:border-[#F67D0A]"
            style={{ borderColor: "#e5e7eb", color: "#1E2C46" }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="flex items-center gap-1 rounded-[10px] px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#F67D0A" }}
          >
            <Plus size={14} />
            Añadir
          </button>
        </div>

        {errors.websiteServices && (
          <p className="text-xs" style={{ color: "#ef4444" }}>{errors.websiteServices}</p>
        )}
      </div>

      {/* ── DESCRIPTION ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: "#1E2C46" }}>
          Descripción de tu negocio
        </label>
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          ¿Qué querés que diga tu web sobre tu negocio? Ej: &ldquo;Llevamos 10 años haciendo techos en Glendale. Trabajo garantizado, precio justo.&rdquo;
        </p>
        <textarea
          value={data.websiteTagline ?? ""}
          onChange={(e) => onChange("websiteTagline", e.target.value)}
          placeholder="Contanos sobre tu negocio..."
          maxLength={280}
          rows={3}
          className="w-full rounded-[10px] border px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[#F67D0A]/30 focus:border-[#F67D0A]"
          style={{ borderColor: errors.websiteTagline ? "#ef4444" : "#e5e7eb", color: "#1E2C46" }}
        />
        <div className="flex justify-between">
          {errors.websiteTagline
            ? <p className="text-xs" style={{ color: "#ef4444" }}>{errors.websiteTagline}</p>
            : <span />
          }
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            {(data.websiteTagline ?? "").length}/280
          </p>
        </div>
      </div>

      {/* ── COLORS ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.letUsChooseColors ?? false}
            onChange={(e) => onChange("letUsChooseColors", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium" style={{ color: "#1E2C46" }}>
            Prefiero que PatronPro elija los colores
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorPicker label="Color principal (Main)"   value={data.primaryColor       ?? "#1E2C46"} onChange={(v) => onChange("primaryColor",       v)} disabled={data.letUsChooseColors ?? false} />
          <ColorPicker label="Color de acento (Accent)" value={data.secondaryColor     ?? "#F67D0A"} onChange={(v) => onChange("secondaryColor",     v)} disabled={data.letUsChooseColors ?? false} />
          <ColorPicker label="Color complementario"     value={data.complementaryColor ?? "#FFFFFF"} onChange={(v) => onChange("complementaryColor", v)} disabled={data.letUsChooseColors ?? false} />
        </div>
        {errors.primaryColor && (
          <p className="text-xs" style={{ color: "#ef4444" }}>{errors.primaryColor}</p>
        )}
      </div>

      {/* ── LOGO ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold" style={{ color: "#1E2C46" }}>Logo</label>

        {/* Toggle */}
        <div className="flex gap-2">
          {[
            { value: false, label: "Tengo un logo" },
            { value: true,  label: "Crear con PatronPro AI" },
          ].map(({ value, label }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => {
                setNoLogo(value);
                if (!value) {
                  onChange("logoFile",       undefined);
                  onChange("logoSquareFile", undefined);
                  setPreview(null);
                  setAttempts([]);
                  setSelectedIdx(null);
                }
              }}
              className="flex-1 rounded-[12px] border py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: noLogo === value ? "#1E2C46" : "#fff",
                color:           noLogo === value ? "#fff"    : "#1E2C46",
                borderColor:     noLogo === value ? "#1E2C46" : "#e5e7eb",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Upload */}
        {!noLogo && (
          <div
            className="rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center p-8 cursor-pointer transition-colors hover:border-[#F67D0A]"
            style={{ borderColor: "#e5e7eb" }}
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo preview" className="max-h-40 object-contain" />
            ) : (
              <>
                <svg className="w-10 h-10 mb-2" style={{ color: "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "#5f6f88" }}>
                  Arrastrá o hacé clic para subir tu logo
                </p>
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                  PNG, JPG, WebP, SVG · Máx 5MB
                </p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* AI Generator */}
        {noLogo && (
          <div className="flex flex-col gap-4 rounded-[14px] p-5" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>

            {/* Style picker */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#1E2C46" }}>Estilo</p>
              <div className="grid grid-cols-4 gap-2">
                {LOGO_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLogoStyle(s.id)}
                    className="rounded-[10px] border py-2 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: logoStyle === s.id ? "#1E2C46" : "#fff",
                      color:           logoStyle === s.id ? "#fff"    : "#1E2C46",
                      borderColor:     logoStyle === s.id ? "#1E2C46" : "#e5e7eb",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={generateLogo}
              disabled={generating || attemptsLeft <= 0}
              className="flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#F67D0A" }}
            >
              {generating ? (
                <><Loader2 size={15} className="animate-spin" />Generando logo...</>
              ) : (
                <><Sparkles size={15} />Generar logo{attemptsLeft < 3 ? ` (${attemptsLeft} restante${attemptsLeft !== 1 ? "s" : ""})` : ""}</>
              )}
            </button>

            {genError && (
              <p className="text-xs text-center" style={{ color: "#ef4444" }}>{genError}</p>
            )}

            {/* Gallery of attempts */}
            {attempts.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold" style={{ color: "#1E2C46" }}>
                  Seleccioná el logo que más te guste
                </p>
                {attempts.map((logo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-[12px] p-3 border-2 cursor-pointer transition-all"
                    style={{
                      borderColor:     selectedIdx === idx ? "#1E2C46" : "#e5e7eb",
                      backgroundColor: selectedIdx === idx ? "#f0f3f8" : "#fff",
                    }}
                    onClick={() => applyLogo(logo, idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${logo.horizontal}`}
                      alt={`Logo opción ${idx + 1}`}
                      className="h-32 object-contain flex-1 min-w-0"
                      style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 12px 12px" }}
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="Descargar"
                        onClick={(e) => { e.stopPropagation(); downloadLogo(logo, idx); }}
                        className="rounded-lg p-1.5 transition-colors hover:bg-slate-100"
                        style={{ color: "#5f6f88" }}
                      >
                        <Download size={14} />
                      </button>
                      {selectedIdx === idx && (
                        <span className="rounded-full p-1" style={{ backgroundColor: "#1E2C46" }}>
                          <Check size={11} color="white" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {attemptsLeft > 0 && (
                  <button
                    type="button"
                    onClick={generateLogo}
                    disabled={generating}
                    className="flex items-center justify-center gap-1.5 rounded-[10px] border py-2 text-xs font-medium transition-colors disabled:opacity-50 hover:border-[#1E2C46]"
                    style={{ borderColor: "#e5e7eb", color: "#1E2C46" }}
                  >
                    <RefreshCw size={12} />
                    Generar otro ({attemptsLeft} restante{attemptsLeft !== 1 ? "s" : ""})
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function b64ToFile(b64: string, filename: string, mimeType: string): File {
  const byteString = atob(b64);
  const arr = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
  return new File([arr], filename, { type: mimeType });
}

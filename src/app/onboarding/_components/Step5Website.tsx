"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { OnboardingFormData } from "@/lib/onboarding/types";

const PRESET_SERVICES = [
  { id: "roofing",         label: "Roofing / Techos" },
  { id: "gutters",         label: "Gutters / Canaletas" },
  { id: "siding",          label: "Siding / Revestimiento" },
  { id: "windows_doors",   label: "Windows & Doors / Ventanas y Puertas" },
  { id: "painting",        label: "Painting / Pintura" },
  { id: "waterproofing",   label: "Waterproofing / Impermeabilización" },
  { id: "insulation",      label: "Insulation / Aislamiento" },
  { id: "solar",           label: "Solar Panels / Paneles Solares" },
  { id: "hvac",            label: "HVAC / Climatización" },
  { id: "flooring",        label: "Flooring / Pisos" },
  { id: "remodeling",      label: "Remodeling / Remodelación" },
  { id: "landscaping",     label: "Landscaping / Jardinería" },
  { id: "concrete",        label: "Concrete / Concreto" },
  { id: "fencing",         label: "Fencing / Cercas" },
  { id: "plumbing",        label: "Plumbing / Plomería" },
  { id: "electrical",      label: "Electrical / Eléctrico" },
  { id: "cleaning",        label: "Cleaning / Limpieza" },
  { id: "pest_control",    label: "Pest Control / Control de Plagas" },
];

interface Step5WebsiteProps {
  data: Partial<OnboardingFormData>;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
  onChange: (field: string, value: unknown) => void;
}

export default function Step5Website({ data, errors, onChange }: Step5WebsiteProps) {
  const selected: string[] = data.websiteServices ?? [];
  const tagline: string = data.websiteTagline ?? "";

  const [customInput, setCustomInput] = useState("");
  const [customServices, setCustomServices] = useState<{ id: string; label: string }[]>([]);

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

  const allServices = [...PRESET_SERVICES, ...customServices];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "#1E2C46" }}>
          Tu Website
        </h2>
        <p className="text-sm" style={{ color: "#5f6f88" }}>
          Usaremos esta información para generar una landing page profesional para tu negocio.
        </p>
      </div>

      {/* Services selector */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: "#1E2C46" }}>
          ¿Qué servicios ofrece tu empresa?
        </label>
        <div className="flex flex-wrap gap-2">
          {allServices.map((svc) => {
            const isSelected = selected.includes(svc.id);
            const isCustom = svc.id.startsWith("custom_");
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => isCustom && !isSelected ? undefined : toggleService(svc.id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all"
                style={{
                  backgroundColor: isSelected ? "#1E2C46" : "#fff",
                  color: isSelected ? "#fff" : "#1E2C46",
                  borderColor: isSelected ? "#1E2C46" : "#e5e7eb",
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

        {/* Custom service input */}
        <div className="flex gap-2 mt-3">
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
          <p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>
            {errors.websiteServices}
          </p>
        )}
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: "#1E2C46" }}>
          Tagline de tu empresa
        </label>
        <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>
          Resumí tu empresa en una frase. Ej: &ldquo;Techos de calidad, protegiendo familias desde 2005&rdquo;
        </p>
        <input
          type="text"
          value={tagline}
          onChange={(e) => onChange("websiteTagline", e.target.value)}
          placeholder="Tu frase aquí..."
          maxLength={120}
          className="w-full rounded-[10px] border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F67D0A]/30 focus:border-[#F67D0A]"
          style={{ borderColor: errors.websiteTagline ? "#ef4444" : "#e5e7eb", color: "#1E2C46" }}
        />
        <div className="flex justify-between mt-1">
          {errors.websiteTagline ? (
            <p className="text-xs" style={{ color: "#ef4444" }}>{errors.websiteTagline}</p>
          ) : <span />}
          <p className="text-xs" style={{ color: "#9ca3af" }}>{tagline.length}/120</p>
        </div>
      </div>
    </div>
  );
}

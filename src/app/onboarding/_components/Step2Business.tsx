"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";

type Step2Data = Pick<
  OnboardingFormData,
  | "businessName"
  | "legalName"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "ein"
  | "businessLegalStructure"
  | "taxIdStatus"
  | "teamSize"
  | "preferredPlatformLanguage"
  | "customerCommunicationLanguage"
>;

  interface Step2Props {
  data: Partial<Step2Data>;
  errors: Partial<Record<keyof Step2Data, string>>;
  onChange: (field: keyof Step2Data, value: string | undefined) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
}

const inputClass =
  "w-full rounded-[14px] border px-4 py-3 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A]";

function Field({
  label,
  required,
  error,
  children,
  hint,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
        {label}
        {required && <span style={{ color: "#F67D0A" }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "#5f6f88" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function AddressAutocomplete({
  value,
  error,
  onChange,
  onSelect,
}: {
  value: string;
  error?: string;
  onChange: (val: string) => void;
  onSelect: (fields: Pick<Step2Data, "address" | "city" | "state" | "zip" | "country">) => void;
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 5) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=us`,
        { headers: { "Accept-Language": "en", "User-Agent": "PatronPro/1.0" } }
      );
      const data = (await res.json()) as NominatimResult[];
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function handleInput(val: string) {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(val), 400);
  }

  function handlePick(result: NominatimResult) {
    const a = result.address;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city ?? a.town ?? a.village ?? "";
    const state = a.state ?? "";
    const zip = a.postcode ?? "";
    const country = (a.country_code ?? "us").toUpperCase();

    onSelect({
      address: street || result.display_name.split(",")[0],
      city,
      state,
      zip,
      country,
    });
    setOpen(false);
    setSuggestions([]);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClass}
        style={{ borderColor: error ? "#ef4444" : "#e5e7eb" }}
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Ej: 123 Main St, Austin"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 rounded-[14px] border bg-white shadow-lg overflow-hidden"
          style={{ borderColor: "#e5e7eb" }}
        >
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-orange-50 transition-colors border-b last:border-b-0"
              style={{ borderColor: "#f3f4f6", color: "#1E2C46" }}
              onMouseDown={() => handlePick(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="#5F6F88"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Step2Business({ data, errors, onChange }: Step2Props) {
  function handleAddressSelect(
    fields: Pick<Step2Data, "address" | "city" | "state" | "zip" | "country">
  ) {
    for (const [key, val] of Object.entries(fields)) {
      onChange(key as keyof Step2Data, val);
    }
  }

  function handleEinInput(raw: string) {
    // Strip non-digits and limit to 9
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    onChange("ein", digits);
  }

  // Display with EIN format XX-XXXXXXX
  const einDisplay = (() => {
    const d = data.ein ?? "";
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}-${d.slice(2)}`;
  })();

  const selectClass =
    "w-full rounded-[14px] border px-4 py-3 pr-11 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A] bg-white appearance-none cursor-pointer";

  const languageOptions: Array<{
    value: NonNullable<OnboardingFormData["preferredPlatformLanguage"]>;
    label: string;
  }> = [
    { value: "es", label: "Español" },
    { value: "en", label: "Inglés" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Información de tu negocio
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nombre del negocio" required error={errors.businessName}>
          <input
            className={inputClass}
            style={{ borderColor: errors.businessName ? "#ef4444" : "#e5e7eb" }}
            value={data.businessName ?? ""}
            onChange={(e) => onChange("businessName", e.target.value)}
            placeholder="Ej: Construcciones Pérez"
          />
        </Field>

        <Field label="Nombre legal" required error={errors.legalName}>
          <input
            className={inputClass}
            style={{ borderColor: errors.legalName ? "#ef4444" : "#e5e7eb" }}
            value={data.legalName ?? ""}
            onChange={(e) => onChange("legalName", e.target.value)}
            placeholder="Ej: Pérez Construction LLC"
          />
        </Field>
      </div>

      <Field label="Dirección del Negocio" required error={errors.address}>
        <AddressAutocomplete
          value={data.address ?? ""}
          error={errors.address}
          onChange={(val) => onChange("address", val)}
          onSelect={handleAddressSelect}
        />
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Ciudad" required error={errors.city}>
          <input
            className={inputClass}
            style={{ borderColor: errors.city ? "#ef4444" : "#e5e7eb" }}
            value={data.city ?? ""}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Ciudad"
          />
        </Field>
        <Field label="Estado" required error={errors.state}>
          <input
            className={inputClass}
            style={{ borderColor: errors.state ? "#ef4444" : "#e5e7eb" }}
            value={data.state ?? ""}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="TX"
          />
        </Field>
        <Field label="ZIP" required error={errors.zip}>
          <input
            className={inputClass}
            style={{ borderColor: errors.zip ? "#ef4444" : "#e5e7eb" }}
            value={data.zip ?? ""}
            onChange={(e) => onChange("zip", e.target.value)}
            placeholder="78201"
          />
        </Field>
        <Field label="País">
          <input
            className={inputClass}
            style={{ borderColor: "#e5e7eb" }}
            value={data.country ?? "US"}
            onChange={(e) => onChange("country", e.target.value)}
            placeholder="US"
          />
        </Field>
      </div>

      <Field
        label="EIN (opcional)"
        hint="Número de identificación fiscal. Lo usamos solo para configurar integraciones de pagos."
        error={errors.ein}
      >
        <input
          className={inputClass}
          style={{ borderColor: errors.ein ? "#ef4444" : "#e5e7eb" }}
          value={einDisplay}
          onChange={(e) => handleEinInput(e.target.value)}
          placeholder="12-3456789"
          inputMode="numeric"
          maxLength={10}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="¿En qué idioma prefieres usar la plataforma?"
          required
          error={errors.preferredPlatformLanguage}
          hint="Este será el idioma que priorizaremos para tu experiencia dentro del sistema."
        >
          <div className="relative">
            <select
              className={selectClass}
              style={{ borderColor: errors.preferredPlatformLanguage ? "#ef4444" : "#e5e7eb" }}
              value={data.preferredPlatformLanguage ?? ""}
              onChange={(e) =>
                onChange(
                  "preferredPlatformLanguage",
                  e.target.value as OnboardingFormData["preferredPlatformLanguage"]
                )
              }
            >
              <option value="">Selecciona una opción</option>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </Field>

        <Field
          label="¿En qué idioma quieres que tu negocio se comunique con tus clientes?"
          required
          error={errors.customerCommunicationLanguage}
          hint="Este idioma nos guía para configurar mensajes, contenido y comunicación hacia tus clientes."
        >
          <div className="relative">
            <select
              className={selectClass}
              style={{ borderColor: errors.customerCommunicationLanguage ? "#ef4444" : "#e5e7eb" }}
              value={data.customerCommunicationLanguage ?? ""}
              onChange={(e) =>
                onChange(
                  "customerCommunicationLanguage",
                  e.target.value as OnboardingFormData["customerCommunicationLanguage"]
                )
              }
            >
              <option value="">Selecciona una opción</option>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </Field>
      </div>

      {/* ── Sección: estructura legal y datos adicionales ── */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-[13px] font-semibold mb-4" style={{ color: "#1E2C46" }}>
          Información adicional del negocio
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          <Field
            label="Estructura legal del negocio"
            hint="¿Bajo qué forma legal opera o va a operar tu negocio?"
          >
            <div className="relative">
              <select
                className={selectClass}
                style={{ borderColor: "#e5e7eb" }}
                value={data.businessLegalStructure ?? ""}
                onChange={(e) =>
                  onChange(
                    "businessLegalStructure",
                    e.target.value as OnboardingFormData["businessLegalStructure"]
                  )
                }
              >
                <option value="">Selecciona una opción</option>
                <option value="llc">LLC (Sociedad de Responsabilidad Limitada)</option>
                <option value="corporation">Corporación (Inc.)</option>
                <option value="sole_proprietorship">Empresa unipersonal (Sole Proprietor)</option>
                <option value="partnership">Sociedad / Partnership</option>
                <option value="none">Todavía no creé una entidad legal</option>
              </select>
              <SelectChevron />
            </div>
          </Field>

          <Field
            label="Cantidad de usuarios del sistema"
            hint="¿Cuántas personas de tu equipo van a usar el sistema?"
          >
            <div className="relative">
              <select
                className={selectClass}
                style={{ borderColor: "#e5e7eb" }}
                value={data.teamSize ?? ""}
                onChange={(e) =>
                  onChange("teamSize", e.target.value as OnboardingFormData["teamSize"])
                }
              >
                <option value="">Selecciona una opción</option>
                <option value="solo">Solo yo</option>
                <option value="2-5">2 a 5 personas</option>
                <option value="6-15">6 a 15 personas</option>
                <option value="16+">Más de 15 personas</option>
              </select>
              <SelectChevron />
            </div>
          </Field>

          <Field
            label="Identificación personal (Tax ID)"
            hint="¿Con qué número de identificación tributaria personal cuentas?"
            className="sm:col-span-2"
          >
            <div className="flex w-full gap-2">
              {([
                { val: "ssn",  label: "Social Security Number" },
                { val: "itin", label: "ITIN" },
                { val: "none", label: "No tengo uno todavía" },
              ] as { val: OnboardingFormData["taxIdStatus"]; label: string }[]).map(({ val, label }) => (
                <label
                  key={val}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-3 cursor-pointer transition-colors text-sm min-h-[64px]"
                  style={{
                    borderColor: data.taxIdStatus === val ? "#F67D0A" : "#e5e7eb",
                    backgroundColor: data.taxIdStatus === val ? "#fff8f0" : "white",
                    color: "#1E2C46",
                  }}
                >
                  <input
                    type="radio"
                    name="taxIdStatus"
                    checked={data.taxIdStatus === val}
                    onChange={() => onChange("taxIdStatus", val)}
                    className="accent-[#F67D0A]"
                  />
                  <span className="min-w-0 leading-snug">{label}</span>
                </label>
              ))}
            </div>
          </Field>

        </div>
      </div>
    </div>
  );
}

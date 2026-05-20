"use client";

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
  | "phone"
  | "email"
  | "ein"
>;

interface Step2Props {
  data: Partial<Step2Data>;
  errors: Partial<Record<keyof Step2Data, string>>;
  onChange: (field: keyof Step2Data, value: string) => void;
}

const inputClass =
  "w-full rounded-[14px] border px-4 py-3 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A]";

function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
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

export default function Step2Business({ data, errors, onChange }: Step2Props) {
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

      <Field label="Dirección" required error={errors.address}>
        <input
          className={inputClass}
          style={{ borderColor: errors.address ? "#ef4444" : "#e5e7eb" }}
          value={data.address ?? ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Ej: 123 Main St"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Teléfono" required error={errors.phone}>
          <input
            className={inputClass}
            style={{ borderColor: errors.phone ? "#ef4444" : "#e5e7eb" }}
            value={data.phone ?? ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+1 (210) 555-0100"
            type="tel"
          />
        </Field>
        <Field label="Email de contacto" required error={errors.email}>
          <input
            className={inputClass}
            style={{ borderColor: errors.email ? "#ef4444" : "#e5e7eb" }}
            value={data.email ?? ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="info@tunegocio.com"
            type="email"
          />
        </Field>
      </div>

      <Field
        label="EIN (opcional)"
        hint="Número de identificación fiscal. Lo usamos solo para configurar integraciones de pagos."
      >
        <input
          className={inputClass}
          style={{ borderColor: "#e5e7eb" }}
          value={data.ein ?? ""}
          onChange={(e) => onChange("ein", e.target.value)}
          placeholder="12-3456789"
        />
      </Field>
    </div>
  );
}

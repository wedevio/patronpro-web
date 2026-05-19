"use client";

import type { OnboardingFormData } from "@/lib/onboarding/types";

type Step3Data = Pick<
  OnboardingFormData,
  "hasDomain" | "existingDomain" | "wantNewDomain" | "desiredDomain" | "domainRegistrar"
>;

interface Step3Props {
  data: Partial<Step3Data>;
  errors: Partial<Record<keyof Step3Data, string>>;
  onChange: (field: keyof Step3Data, value: unknown) => void;
}

const inputClass =
  "w-full rounded-[14px] border px-4 py-3 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A]";

type DomainOption = "has" | "wants" | "unsure";

export default function Step3Domain({ data, errors, onChange }: Step3Props) {
  function getOption(): DomainOption {
    if (data.hasDomain) return "has";
    if (data.wantNewDomain) return "wants";
    return "unsure";
  }

  function setOption(opt: DomainOption) {
    onChange("hasDomain", opt === "has");
    onChange("wantNewDomain", opt === "wants");
  }

  const option = getOption();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Tu dominio
      </h2>

      <p className="text-sm" style={{ color: "#5f6f88" }}>
        El dominio es la dirección web de tu negocio (ej:{" "}
        <span className="font-mono">tunegocio.com</span>). Lo usamos para
        configurar tu sitio web y emails profesionales.
      </p>

      <div className="flex flex-col gap-3">
        {(
          [
            { value: "has", label: "Ya tengo un dominio" },
            { value: "wants", label: "Quiero comprar un dominio nuevo" },
            { value: "unsure", label: "No sé todavía" },
          ] as { value: DomainOption; label: string }[]
        ).map(({ value, label }) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-[14px] border px-4 py-3 cursor-pointer transition-colors"
            style={{
              borderColor: option === value ? "#F67D0A" : "#e5e7eb",
              backgroundColor: option === value ? "#fff8f0" : "white",
            }}
          >
            <input
              type="radio"
              name="domainOption"
              checked={option === value}
              onChange={() => setOption(value)}
              className="accent-[#F67D0A]"
            />
            <span className="text-sm font-medium" style={{ color: "#1E2C46" }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {option === "has" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
              ¿Cuál es tu dominio?
              <span style={{ color: "#F67D0A" }}> *</span>
            </label>
            <input
              className={inputClass}
              style={{
                borderColor: errors.existingDomain ? "#ef4444" : "#e5e7eb",
              }}
              value={data.existingDomain ?? ""}
              onChange={(e) => onChange("existingDomain", e.target.value)}
              placeholder="tunegocio.com"
            />
            {errors.existingDomain && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {errors.existingDomain}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
              ¿Dónde está registrado?
            </label>
            <select
              className={inputClass}
              style={{ borderColor: "#e5e7eb" }}
              value={data.domainRegistrar ?? ""}
              onChange={(e) => onChange("domainRegistrar", e.target.value)}
            >
              <option value="">Seleccioná un proveedor</option>
              <option value="godaddy">GoDaddy</option>
              <option value="namecheap">Namecheap</option>
              <option value="google">Google Domains</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      )}

      {option === "wants" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
            ¿Qué dominio te gustaría?
            <span style={{ color: "#F67D0A" }}> *</span>
          </label>
          <input
            className={inputClass}
            style={{
              borderColor: errors.desiredDomain ? "#ef4444" : "#e5e7eb",
            }}
            value={data.desiredDomain ?? ""}
            onChange={(e) => onChange("desiredDomain", e.target.value)}
            placeholder="tunegocio.com"
          />
          {errors.desiredDomain && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              {errors.desiredDomain}
            </p>
          )}
          <p className="text-xs" style={{ color: "#5f6f88" }}>
            Lo veremos juntos en la llamada y te ayudamos a conseguirlo.
          </p>
        </div>
      )}
    </div>
  );
}

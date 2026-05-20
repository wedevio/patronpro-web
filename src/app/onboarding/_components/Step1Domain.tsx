"use client";

import { useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";

type Step1Data = Pick<
  OnboardingFormData,
  "hasDomain" | "existingDomain" | "wantNewDomain" | "desiredDomain" | "domainRegistrar"
>;

interface Step1Props {
  data: Partial<Step1Data>;
  errors: Partial<Record<keyof Step1Data, string>>;
  onChange: (field: keyof Step1Data, value: unknown) => void;
}

const inputClass =
  "w-full rounded-[14px] border px-4 py-3 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A]";

type DomainOption = "has" | "wants" | "unsure";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

export default function Step1Domain({ data, errors, onChange }: Step1Props) {
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");

  function getOption(): DomainOption {
    if (data.hasDomain) return "has";
    if (data.wantNewDomain) return "wants";
    return "unsure";
  }

  function setOption(opt: DomainOption) {
    onChange("hasDomain", opt === "has");
    onChange("wantNewDomain", opt === "wants");
    setAvailabilityStatus("idle");
  }

  async function checkAvailability() {
    const domain = data.desiredDomain?.trim();
    if (!domain) return;
    setAvailabilityStatus("checking");
    try {
      const res = await fetch(
        `/api/domain-check?domain=${encodeURIComponent(domain)}`
      );
      const json = (await res.json()) as { available?: boolean };
      setAvailabilityStatus(json.available ? "available" : "taken");
    } catch {
      setAvailabilityStatus("error");
    }
  }

  const option = getOption();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
          Tu dominio web
        </h2>
        <p className="text-sm mt-1" style={{ color: "#5f6f88" }}>
          El dominio es la dirección de tu negocio en internet (ej:{" "}
          <span className="font-mono">tunegocio.com</span>). Lo usamos para
          configurar tu sitio y emails profesionales.
        </p>
      </div>

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
              style={{ borderColor: errors.existingDomain ? "#ef4444" : "#e5e7eb" }}
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
              <option value="cloudflare">Cloudflare</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      )}

      {option === "wants" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
              ¿Qué dominio te gustaría?
              <span style={{ color: "#F67D0A" }}> *</span>
            </label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                style={{
                  borderColor: errors.desiredDomain ? "#ef4444" : "#e5e7eb",
                  flex: 1,
                }}
                value={data.desiredDomain ?? ""}
                onChange={(e) => {
                  onChange("desiredDomain", e.target.value);
                  setAvailabilityStatus("idle");
                }}
                placeholder="tunegocio.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void checkAvailability();
                }}
              />
              <button
                type="button"
                onClick={() => void checkAvailability()}
                disabled={
                  !data.desiredDomain?.trim() ||
                  availabilityStatus === "checking"
                }
                className="rounded-[14px] px-4 py-3 text-sm font-medium border transition-colors disabled:opacity-40"
                style={{ borderColor: "#1E2C46", color: "#1E2C46" }}
              >
                {availabilityStatus === "checking" ? "..." : "Verificar"}
              </button>
            </div>
            {errors.desiredDomain && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {errors.desiredDomain}
              </p>
            )}
          </div>

          {availabilityStatus === "available" && (
            <div
              className="rounded-[14px] px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}
            >
              ✅ ¡Ese dominio parece estar disponible! Lo gestionamos juntos en la llamada.
            </div>
          )}
          {availabilityStatus === "taken" && (
            <div
              className="rounded-[14px] px-4 py-3 text-sm"
              style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}
            >
              ❌ Ese dominio ya está en uso. Intentá con una variación (ej:{" "}
              <span className="font-mono">
                {data.desiredDomain?.replace(/\.(com|net|org).*/, "")}-pro.com
              </span>
              ).
            </div>
          )}
          {availabilityStatus === "error" && (
            <p className="text-xs" style={{ color: "#6b7280" }}>
              No pudimos verificar la disponibilidad. Lo revisamos en la llamada.
            </p>
          )}
          {availabilityStatus === "idle" && (
            <p className="text-xs" style={{ color: "#5f6f88" }}>
              Hacé clic en "Verificar" para saber si está disponible. Lo
              tramitamos juntos en la llamada.
            </p>
          )}
        </div>
      )}

      {option === "unsure" && (
        <div
          className="rounded-[14px] px-4 py-3 text-sm"
          style={{ backgroundColor: "#f9fafb", color: "#5f6f88" }}
        >
          Sin problema — lo vemos juntos en la llamada de bienvenida 👋
        </div>
      )}
    </div>
  );
}

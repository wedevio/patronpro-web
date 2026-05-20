"use client";

import { useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";

type Step1Data = Pick<
  OnboardingFormData,
  | "hasDomain"
  | "existingDomain"
  | "wantNewDomain"
  | "desiredDomain"
  | "domainRegistrar"
  | "authorizeDomainPurchase"
>;

interface Step1Props {
  data: Partial<Step1Data>;
  errors: Partial<Record<keyof Step1Data, string>>;
  onChange: (field: keyof Step1Data, value: unknown) => void;
}

const inputClass =
  "w-full rounded-[14px] border px-4 py-3 text-sm min-h-[52px] outline-none transition-colors focus:border-[#F67D0A]";

type DomainOption = "has" | "wants";
type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

export default function Step1Domain({ data, errors, onChange }: Step1Props) {
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");

  function getOption(): DomainOption {
    if (data.wantNewDomain) return "wants";
    return "has";
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

      {/* Options */}
      <div className="flex flex-col gap-3">
        {(
          [
            { value: "has", label: "Ya tengo un dominio" },
            { value: "wants", label: "Quiero comprar un dominio nuevo" },
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

      {/* Has domain */}
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

      {/* Wants new domain */}
      {option === "wants" && (
        <div className="flex flex-col gap-4">
          {/* Domain input + check */}
          <div className="flex flex-col gap-2">
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

            {/* Availability feedback */}
            {availabilityStatus === "available" && (
              <div
                className="rounded-[14px] px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}
              >
                ✅ ¡Ese dominio parece estar disponible!
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
                Hacé clic en "Verificar" para saber si está disponible.
              </p>
            )}
          </div>

          {/* Purchase authorization */}
          <div
            className="rounded-[14px] border p-4 flex flex-col gap-3"
            style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: "#F67D0A" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1E2C46" }}>
                  Compra del dominio —{" "}
                  <span style={{ color: "#F67D0A" }}>$11 / año</span>
                </p>
                <p className="text-sm mt-1" style={{ color: "#5f6f88" }}>
                  Nosotros registramos el dominio por vos para poder configurar
                  todo correctamente: sitio web, emails profesionales y sistema
                  de seguimiento. El costo de{" "}
                  <strong>$11 al año</strong> se cobra junto con tu plan en el
                  momento de activación.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.authorizeDomainPurchase ?? false}
                onChange={(e) =>
                  onChange("authorizeDomainPurchase", e.target.checked)
                }
                className="mt-0.5 rounded accent-[#F67D0A]"
              />
              <span className="text-sm font-medium" style={{ color: "#1E2C46" }}>
                Autorizo a PatronPro a registrar este dominio por $11 al activar
                mi cuenta
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

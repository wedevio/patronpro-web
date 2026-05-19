"use client";

import type { OnboardingFormData } from "@/lib/onboarding/types";

interface StepReviewProps {
  data: Partial<OnboardingFormData>;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] border p-5"
      style={{ borderColor: "#e5e7eb" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: "#1E2C46" }}>
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-sm font-medium underline"
          style={{ color: "#F67D0A" }}
        >
          Editar
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-medium w-36 shrink-0" style={{ color: "#5f6f88" }}>
        {label}
      </span>
      <span style={{ color: "#1E2C46" }}>{value}</span>
    </div>
  );
}

export default function StepReview({
  data,
  onEdit,
  onSubmit,
  isSubmitting,
}: StepReviewProps) {
  const address = [data.address, data.city, data.state, data.zip, data.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Revisá tu información
      </h2>

      <Section title="Tu Negocio" step={1} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          <Row label="Negocio" value={data.businessName} />
          <Row label="Nombre legal" value={data.legalName} />
          <Row label="Dirección" value={address} />
          <Row label="Teléfono" value={data.phone} />
          <Row label="Email" value={data.email} />
          <Row label="Sitio web" value={data.website} />
          <Row label="EIN" value={data.ein} />
        </div>
      </Section>

      <Section title="Tu Marca" step={2} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          {data.logoUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoUrl}
                alt="Logo"
                className="h-16 object-contain"
              />
            </div>
          ) : data.letUsChooseColors !== undefined ? (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              Sin logo cargado
            </p>
          ) : null}
          {data.letUsChooseColors ? (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              PatronPro elegirá los colores
            </p>
          ) : (
            <>
              {data.primaryColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: data.primaryColor }}
                  />
                  <span style={{ color: "#5f6f88" }}>Color primario:</span>
                  <span className="font-mono" style={{ color: "#1E2C46" }}>
                    {data.primaryColor}
                  </span>
                </div>
              )}
              {data.secondaryColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: data.secondaryColor }}
                  />
                  <span style={{ color: "#5f6f88" }}>Color secundario:</span>
                  <span className="font-mono" style={{ color: "#1E2C46" }}>
                    {data.secondaryColor}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section title="Dominio" step={3} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          {data.hasDomain ? (
            <>
              <Row label="Dominio" value={data.existingDomain} />
              <Row label="Registrar" value={data.domainRegistrar} />
            </>
          ) : data.wantNewDomain ? (
            <Row label="Dominio deseado" value={data.desiredDomain} />
          ) : (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              Por definir en la llamada
            </p>
          )}
        </div>
      </Section>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full rounded-[14px] py-4 text-base font-bold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "#F67D0A" }}
      >
        {isSubmitting ? "Enviando..." : "Confirmar y enviar ✓"}
      </button>
    </div>
  );
}

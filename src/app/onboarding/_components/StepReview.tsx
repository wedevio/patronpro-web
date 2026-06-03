"use client";

import { Check } from "lucide-react";
import type { OnboardingFormData, HoursOfOperation } from "@/lib/onboarding/types";

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
    <div className="rounded-[14px] border p-5" style={{ borderColor: "#e5e7eb" }}>
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

const DAY_LABELS: Record<keyof HoursOfOperation, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

const LEGAL_STRUCTURE_LABELS: Record<NonNullable<OnboardingFormData["businessLegalStructure"]>, string> = {
  llc: "LLC",
  corporation: "Corporación",
  sole_proprietorship: "Sole Proprietorship",
  partnership: "Partnership",
  none: "Todavía no definido",
};

const TEAM_SIZE_LABELS: Record<NonNullable<OnboardingFormData["teamSize"]>, string> = {
  solo: "Solo yo",
  "2-5": "2 a 5 personas",
  "6-15": "6 a 15 personas",
  "16+": "Más de 15 personas",
};

const TAX_ID_LABELS: Record<NonNullable<OnboardingFormData["taxIdStatus"]>, string> = {
  ssn: "Social Security Number",
  itin: "ITIN",
  none: "No tiene uno todavía",
};

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  bilingual: "Español e inglés",
};

function formatTime(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 || 12;
  return `${h}:${mm.toString().padStart(2, "0")} ${period}`;
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

  const hours = data.hoursOfOperation;
  const domainType = data.hasDomain
    ? "Ya tengo dominio"
    : data.wantNewDomain
      ? "Quiero comprar un dominio nuevo"
      : "Por definir en la llamada";

  // Logo preview — use object URL if File, otherwise logoUrl string
  const logoSrc =
    data.logoFile instanceof File
      ? URL.createObjectURL(data.logoFile)
      : (data.logoUrl ?? null);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Revisá tu información
      </h2>

      {/* Step 1 — Negocio */}
      <Section title="Tu Negocio" step={1} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          <Row label="Negocio" value={data.businessName} />
          <Row label="Nombre legal" value={data.legalName} />
          <Row label="Dirección" value={address} />
          <Row label="EIN" value={data.ein} />
          <Row
            label="Estructura legal"
            value={data.businessLegalStructure ? LEGAL_STRUCTURE_LABELS[data.businessLegalStructure] : undefined}
          />
          <Row
            label="Equipo"
            value={data.teamSize ? TEAM_SIZE_LABELS[data.teamSize] : undefined}
          />
          <Row
            label="Tax ID personal"
            value={data.taxIdStatus ? TAX_ID_LABELS[data.taxIdStatus] : undefined}
          />
          <Row
            label="Idioma para usar la plataforma"
            value={data.preferredPlatformLanguage ? LANGUAGE_LABELS[data.preferredPlatformLanguage] : undefined}
          />
          <Row
            label="Idioma para comunicarse con clientes"
            value={data.customerCommunicationLanguage ? LANGUAGE_LABELS[data.customerCommunicationLanguage] : undefined}
          />
        </div>
      </Section>

      {/* Step 2 — Marca */}
      <Section title="Marca" step={2} onEdit={onEdit}>
        <div className="flex flex-col gap-3">
          {/* Services */}
          {data.websiteServices?.length ? (
            <div>
              <span className="text-sm font-medium block mb-1.5" style={{ color: "#5f6f88" }}>
                Servicios:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.websiteServices.map((svc) => (
                  <span
                    key={svc}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: "#f0f4ff", color: "#1E2C46" }}
                  >
                    {svc.startsWith("custom_") ? svc.replace(/^custom_\d+_?/, "") : svc}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Description */}
          {data.websiteTagline && (
            <Row label="Descripción" value={data.websiteTagline} />
          )}

          {/* Logo preview */}
          {logoSrc ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Logo"
                className="h-16 object-contain rounded-[8px] border p-1"
                style={{ borderColor: "#e5e7eb", maxWidth: "180px" }}
              />
              <span className="text-sm" style={{ color: "#5f6f88" }}>Logo subido</span>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#9ca3af" }}>Sin logo</p>
          )}

          {/* Colors */}
          {data.letUsChooseColors ? (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              PatronPro elegirá los colores
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {[
                { label: "Principal", value: data.primaryColor },
                { label: "Acento", value: data.secondaryColor },
                { label: "Complementario", value: data.complementaryColor },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-5 h-5 rounded-full border"
                      style={{ backgroundColor: value, borderColor: "#e5e7eb" }}
                    />
                    <span style={{ color: "#5f6f88" }}>{label}:</span>
                    <span className="font-mono" style={{ color: "#1E2C46" }}>{value}</span>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Step 3 — Horarios */}
      {hours && (
        <Section title="Horarios" step={3} onEdit={onEdit}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {(Object.keys(DAY_LABELS) as Array<keyof HoursOfOperation>).map((day) => {
              const d = hours[day];
              return (
                <div key={day}>
                  <span className="font-medium" style={{ color: "#5f6f88" }}>{DAY_LABELS[day]}: </span>
                  <span style={{ color: "#1E2C46" }}>
                    {d.open ? `${formatTime(d.from)} - ${formatTime(d.to)}` : "Cerrado"}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Step 4 — Dominio */}
      <Section title="Dominio" step={4} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          <Row label="Tipo" value={domainType} />
          {data.hasDomain ? (
            <>
              <Row label="Dominio" value={data.existingDomain} />
              <Row label="Registrar" value={data.domainRegistrar} />
            </>
          ) : data.wantNewDomain ? (
            <>
              <Row label="Dominio deseado" value={data.desiredDomain} />
              <Row
                label="Compra autorizada"
                value={data.authorizeDomainPurchase === undefined ? undefined : data.authorizeDomainPurchase ? "Sí" : "No"}
              />
            </>
          ) : (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              Por definir en la llamada
            </p>
          )}
          <Row
            label="Stripe"
            value={data.hasStripeAccount === undefined ? undefined : data.hasStripeAccount ? "Sí" : "No"}
          />
        </div>
      </Section>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full rounded-[14px] py-4 text-base font-bold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "#F67D0A" }}
      >
        {isSubmitting ? "Enviando..." : <><Check size={16} strokeWidth={2.5} className="inline mr-1" />Confirmar y enviar</>}
      </button>
    </div>
  );
}

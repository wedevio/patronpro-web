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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Revisá tu información
      </h2>

      <Section title="Dominio" step={1} onEdit={onEdit}>
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

      <Section title="Tu Negocio" step={2} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          <Row label="Negocio" value={data.businessName} />
          <Row label="Nombre legal" value={data.legalName} />
          <Row label="Dirección" value={address} />
          <Row label="Teléfono" value={data.phone} />
          <Row label="Email" value={data.email} />
          <Row label="EIN" value={data.ein} />
        </div>
      </Section>

      <Section title="Marca" step={3} onEdit={onEdit}>
        <div className="flex flex-col gap-2">
          {data.letUsChooseColors ? (
            <p className="text-sm" style={{ color: "#5f6f88" }}>
              PatronPro elegirá los colores
            </p>
          ) : (
            <>
              {data.primaryColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: data.primaryColor }} />
                  <span style={{ color: "#5f6f88" }}>Principal:</span>
                  <span className="font-mono" style={{ color: "#1E2C46" }}>{data.primaryColor}</span>
                </div>
              )}
              {data.secondaryColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: data.secondaryColor }} />
                  <span style={{ color: "#5f6f88" }}>Acento:</span>
                  <span className="font-mono" style={{ color: "#1E2C46" }}>{data.secondaryColor}</span>
                </div>
              )}
              {data.complementaryColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: data.complementaryColor }} />
                  <span style={{ color: "#5f6f88" }}>Complementario:</span>
                  <span className="font-mono" style={{ color: "#1E2C46" }}>{data.complementaryColor}</span>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {hours && (
        <Section title="Horarios" step={4} onEdit={onEdit}>
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

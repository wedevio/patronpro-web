"use client";

import type { OnboardingFormData, HoursOfOperation, DayHours } from "@/lib/onboarding/types";

type Step4Data = Pick<OnboardingFormData, "hoursOfOperation">;

interface Step4Props {
  data: Partial<Step4Data>;
  onChange: (field: keyof Step4Data, value: unknown) => void;
}

type DayKey = keyof HoursOfOperation;

const DAY_LABELS: Record<DayKey, string> = {
  monday:    "Lunes",
  tuesday:   "Martes",
  wednesday: "Miércoles",
  thursday:  "Jueves",
  friday:    "Viernes",
  saturday:  "Sábado",
  sunday:    "Domingo",
};

const DAY_ORDER: DayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hh = h.toString().padStart(2, "0");
  return `${hh}:${m}`;
});

function formatTime(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 || 12;
  return `${h}:${mm.toString().padStart(2, "0")} ${period}`;
}

export default function Step4Hours({ data, onChange }: Step4Props) {
  const hours = data.hoursOfOperation ?? {
    monday:    { open: true,  from: "08:00", to: "17:00" },
    tuesday:   { open: true,  from: "08:00", to: "17:00" },
    wednesday: { open: true,  from: "08:00", to: "17:00" },
    thursday:  { open: true,  from: "08:00", to: "17:00" },
    friday:    { open: true,  from: "08:00", to: "17:00" },
    saturday:  { open: false, from: "09:00", to: "13:00" },
    sunday:    { open: false, from: "09:00", to: "13:00" },
  };

  function updateDay(day: DayKey, patch: Partial<DayHours>) {
    onChange("hoursOfOperation", {
      ...hours,
      [day]: { ...hours[day], ...patch },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
          Horario de atención
        </h2>
        <p className="text-sm mt-1" style={{ color: "#5f6f88" }}>
          Configuramos tu horario en el sistema para que los clientes sepan cuándo
          pueden contactarte.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {DAY_ORDER.map((day) => {
          const d = hours[day];
          return (
            <div
              key={day}
              className="rounded-[14px] border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ borderColor: d.open ? "#F67D0A" : "#e5e7eb", backgroundColor: d.open ? "#fff8f0" : "#f9fafb" }}
            >
              {/* Toggle + label */}
              <div className="flex items-center gap-3 sm:w-32 shrink-0">
                <button
                  type="button"
                  onClick={() => updateDay(day, { open: !d.open })}
                  className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
                  style={{ backgroundColor: d.open ? "#F67D0A" : "#d1d5db" }}
                  role="switch"
                  aria-checked={d.open}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform"
                    style={{ transform: d.open ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </button>
                <span
                  className="text-sm font-medium w-20"
                  style={{ color: d.open ? "#1E2C46" : "#9ca3af" }}
                >
                  {DAY_LABELS[day]}
                </span>
              </div>

              {/* Time selectors */}
              {d.open ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    className="rounded-[10px] border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "#e5e7eb" }}
                    value={d.from}
                    onChange={(e) => updateDay(day, { from: e.target.value })}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                  <span className="text-sm" style={{ color: "#5f6f88" }}>a</span>
                  <select
                    className="rounded-[10px] border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "#e5e7eb" }}
                    value={d.to}
                    onChange={(e) => updateDay(day, { to: e.target.value })}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm" style={{ color: "#9ca3af" }}>
                  Cerrado
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

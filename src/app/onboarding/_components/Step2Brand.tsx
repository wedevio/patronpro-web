"use client";

import { useRef, useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";
import ColorPicker from "./ColorPicker";

type Step2Data = Pick<
  OnboardingFormData,
  "logoFile" | "logoUrl" | "primaryColor" | "secondaryColor" | "letUsChooseColors"
>;

interface Step2Props {
  data: Partial<Step2Data>;
  errors: Partial<Record<keyof Step2Data, string>>;
  onChange: (field: keyof Step2Data, value: unknown) => void;
}

export default function Step2Brand({ data, errors, onChange }: Step2Props) {
  const [noLogo, setNoLogo] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    onChange("logoFile", file);
    setPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold" style={{ color: "#1E2C46" }}>
        Identidad de marca
      </h2>

      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
          Logo
        </label>

        {!noLogo && (
          <div
            className="rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center p-8 cursor-pointer transition-colors hover:border-[#F67D0A]"
            style={{ borderColor: "#e5e7eb" }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Logo preview"
                className="max-h-24 object-contain"
              />
            ) : (
              <>
                <svg
                  className="w-10 h-10 mb-2"
                  style={{ color: "#9ca3af" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium" style={{ color: "#5f6f88" }}>
                  Arrastrá o hacé clic para subir tu logo
                </p>
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                  PNG, JPG, SVG · Máx 5MB
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={noLogo}
            onChange={(e) => {
              setNoLogo(e.target.checked);
              if (e.target.checked) onChange("logoFile", undefined);
            }}
            className="rounded"
          />
          <span className="text-sm" style={{ color: "#5f6f88" }}>
            No tengo logo todavía
          </span>
        </label>
        {noLogo && (
          <p
            className="text-sm rounded-[14px] px-4 py-3"
            style={{ backgroundColor: "#f9fafb", color: "#5f6f88" }}
          >
            No hay problema — lo veremos en la llamada 👋
          </p>
        )}
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.letUsChooseColors ?? false}
            onChange={(e) => onChange("letUsChooseColors", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium" style={{ color: "#1E2C46" }}>
            Prefiero que PatronPro elija los colores
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorPicker
            label="Color primario"
            value={data.primaryColor ?? "#1E2C46"}
            onChange={(v) => onChange("primaryColor", v)}
            disabled={data.letUsChooseColors ?? false}
          />
          <ColorPicker
            label="Color secundario"
            value={data.secondaryColor ?? "#F67D0A"}
            onChange={(v) => onChange("secondaryColor", v)}
            disabled={data.letUsChooseColors ?? false}
          />
        </div>
        {errors.primaryColor && (
          <p className="text-xs" style={{ color: "#ef4444" }}>
            {errors.primaryColor}
          </p>
        )}
      </div>
    </div>
  );
}

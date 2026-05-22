"use client";

import { useRef, useState } from "react";
import type { OnboardingFormData } from "@/lib/onboarding/types";
import ColorPicker from "./ColorPicker";

type Step3Data = Pick<
  OnboardingFormData,
  "logoFile" | "logoUrl" | "primaryColor" | "secondaryColor" | "complementaryColor" | "letUsChooseColors"
>;

interface Step3Props {
  data: Partial<Step3Data>;
  errors: Partial<Record<keyof Step3Data, string>>;
  onChange: (field: keyof Step3Data, value: unknown) => void;
}

export default function Step3Brand({ data, errors, onChange }: Step3Props) {
  const [noLogo, setNoLogo] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    // SVG → PNG conversion: GHL media API doesn't accept SVG
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth  || 800;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngFile = new File([blob], file.name.replace(/\.svg$/i, ".png"), { type: "image/png" });
          onChange("logoFile", pngFile);
          setPreview(URL.createObjectURL(pngFile));
        }, "image/png");
        URL.revokeObjectURL(url);
      };
      img.src = url;
      return;
    }
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
                  PNG, JPG, WebP, SVG · Máx 5MB
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorPicker
            label="Color principal (Main)"
            value={data.primaryColor ?? "#1E2C46"}
            onChange={(v) => onChange("primaryColor", v)}
            disabled={data.letUsChooseColors ?? false}
          />
          <ColorPicker
            label="Color de acento (Accent)"
            value={data.secondaryColor ?? "#F67D0A"}
            onChange={(v) => onChange("secondaryColor", v)}
            disabled={data.letUsChooseColors ?? false}
          />
          <ColorPicker
            label="Color complementario"
            value={data.complementaryColor ?? "#FFFFFF"}
            onChange={(v) => onChange("complementaryColor", v)}
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

"use client";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export default function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: "#1E2C46" }}>
        {label}
      </label>
      {disabled ? (
        <div
          className="flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm"
          style={{ borderColor: "#e5e7eb", color: "#9ca3af", backgroundColor: "#f9fafb" }}
        >
          <div
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: "#e5e7eb", borderColor: "#e5e7eb" }}
          />
          <span>PatronPro lo elegirá por ti</span>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
          style={{ borderColor: "#e5e7eb" }}
        >
          <input
            type="color"
            value={value || "#1E2C46"}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          />
          <span className="text-sm font-mono" style={{ color: "#1E2C46" }}>
            {value || "#1E2C46"}
          </span>
        </div>
      )}
    </div>
  );
}

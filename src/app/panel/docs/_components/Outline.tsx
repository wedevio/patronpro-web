"use client";

import type { DocBlock } from "@/lib/docs/types";

interface Props {
  blocks: DocBlock[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function Outline({ blocks, activeId, onSelect }: Props) {
  const headings = blocks.filter((b) => b.type === "heading") as Array<
    DocBlock & { data: { level: 2 | 3; text: string } }
  >;

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
        En esta página
      </p>
      {headings.map((h) => {
        const active = h.id === activeId;
        return (
          <button
            key={h.id}
            onClick={() => {
              onSelect(h.id);
              const el = document.getElementById(`heading-${h.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block w-full text-left text-[12px] leading-snug rounded px-2 py-1 transition-colors ${
              h.data.level === 3 ? "pl-4" : ""
            } ${
              active
                ? "font-medium text-orange-600 bg-orange-50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {h.data.text}
          </button>
        );
      })}
    </nav>
  );
}
